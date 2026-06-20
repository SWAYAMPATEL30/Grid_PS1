"""
Overview router — KPIs, hourly distribution, vehicle split, hotspots, lag stations.
"""
from datetime import date, timedelta, datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import (
    OverviewKPIs, KPIDeltas, HourlyBucket,
    VehicleSplit, TopHotspot, WorstLagStation,
)
from app.ml.predictor import ml

router = APIRouter(prefix="/api/overview", tags=["overview"])

def _date_range(from_date: Optional[str], to_date: Optional[str]) -> tuple[str, str]:
    return (from_date or "2025-01-01"), (to_date or "2025-05-31")

@router.get("/kpis", response_model=OverviewKPIs)
async def get_kpis(
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    fd, td = _date_range(from_date, to_date)
    dt_fd = datetime.fromisoformat(fd)
    dt_td = datetime.fromisoformat(td + " 23:59:59")
    
    result = await db.execute(
        text("""
        SELECT
          COUNT(*) AS total_violations,
          AVG(resolution_lag_mins) FILTER (WHERE resolution_lag_mins IS NOT NULL) AS avg_lag,
          COUNT(DISTINCT police_station) FILTER (WHERE police_station IS NOT NULL) AS hotspot_stations
        FROM violations
        WHERE created_datetime BETWEEN :fd AND :td
        """),
        {"fd": dt_fd, "td": dt_td},
    )
    row = result.fetchone()
    total = int(row.total_violations or 0)
    avg_lag = float(row.avg_lag or 0)
    hotspots = int(row.hotspot_stations or 0)

    try:
        d1 = date.fromisoformat(fd)
        d2 = date.fromisoformat(td)
        delta_days = (d2 - d1).days or 1
        prev_fd = (d1 - timedelta(days=delta_days)).isoformat()
        prev_td = (d1 - timedelta(days=1)).isoformat()
    except Exception:
        prev_fd, prev_td = "2024-11-01", "2024-12-31"

    dt_prev_fd = datetime.fromisoformat(prev_fd)
    dt_prev_td = datetime.fromisoformat(prev_td + " 23:59:59")

    prev_res = await db.execute(
        text("SELECT COUNT(*) AS c FROM violations WHERE created_datetime BETWEEN :fd AND :td"),
        {"fd": dt_prev_fd, "td": dt_prev_td},
    )
    prev_total = int((prev_res.scalar() or 0))
    violations_pct = round(((total - prev_total) / max(prev_total, 1)) * 100, 2)
    delivery_risk = min(100.0, round((avg_lag / 120.0) * 100, 2))

    return OverviewKPIs(
        total_violations=total,
        active_hotspots=hotspots,
        avg_resolution_lag_mins=round(avg_lag, 2),
        delivery_risk_index=delivery_risk,
        deltas=KPIDeltas(violations_pct=violations_pct, hotspots_pct=0.0),
    )

@router.get("/hourly-distribution", response_model=list[HourlyBucket])
async def get_hourly_distribution(
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    fd, td = _date_range(from_date, to_date)
    dt_fd = datetime.fromisoformat(fd)
    dt_td = datetime.fromisoformat(td + " 23:59:59")

    result = await db.execute(
        text("""
        SELECT
          hour_of_day AS hour,
          COUNT(*) FILTER (WHERE violation_types && ARRAY['WRONG PARKING']) AS wrong_parking,
          COUNT(*) FILTER (WHERE violation_types && ARRAY['NO PARKING']) AS no_parking,
          COUNT(*) FILTER (WHERE violation_types && ARRAY['PARKING IN A MAIN ROAD']) AS main_road,
          COUNT(*) FILTER (
            WHERE NOT (violation_types && ARRAY['WRONG PARKING','NO PARKING','PARKING IN A MAIN ROAD'])
            OR violation_types IS NULL
          ) AS other
        FROM violations
        WHERE created_datetime BETWEEN :fd AND :td
          AND hour_of_day IS NOT NULL
        GROUP BY hour_of_day
        ORDER BY hour_of_day
        """),
        {"fd": dt_fd, "td": dt_td},
    )
    rows = result.fetchall()
    data = {r.hour: r for r in rows}
    return [
        HourlyBucket(
            hour=h,
            wrong_parking=int(data[h].wrong_parking) if h in data else 0,
            no_parking=int(data[h].no_parking) if h in data else 0,
            main_road=int(data[h].main_road) if h in data else 0,
            other=int(data[h].other) if h in data else 0,
        )
        for h in range(24)
    ]

@router.get("/vehicle-split", response_model=list[VehicleSplit])
async def get_vehicle_split(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT COALESCE(vehicle_type, 'UNKNOWN') AS vehicle_type, COUNT(*) AS cnt FROM violations WHERE vehicle_type IS NOT NULL GROUP BY vehicle_type ORDER BY cnt DESC LIMIT 15"))
    rows = result.fetchall()
    total = sum(r.cnt for r in rows) or 1
    return [VehicleSplit(vehicle_type=r.vehicle_type, count=int(r.cnt), pct=round(r.cnt / total * 100, 2)) for r in rows]

@router.get("/top-hotspots", response_model=list[TopHotspot])
async def get_top_hotspots(limit: int = Query(5, ge=1, le=50), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
        SELECT
            COALESCE(police_station, 'Unknown') AS zone,
            COUNT(*) AS cnt,
            AVG(severity_weight) AS avg_sev,
            AVG(resolution_lag_mins) AS avg_lag,
            AVG(latitude) AS lat,
            AVG(longitude) AS lon,
            BOOL_OR(is_junction) AS has_junction,
            MODE() WITHIN GROUP (ORDER BY vehicle_type) AS common_vehicle
        FROM violations
        WHERE police_station IS NOT NULL
        GROUP BY police_station
        HAVING COUNT(*) > 5
        ORDER BY cnt DESC
        LIMIT :limit
        """),
        {"limit": limit * 3},
    )
    rows = result.fetchall()
    scored = []
    for r in rows:
        ml_score = ml.predict_score(
            hour_of_day=9, day_of_week=1, month=3,
            lat=float(r.lat or 12.97), lon=float(r.lon or 77.59),
            density_500m=float(min(int(r.cnt), 100)),
            is_junction=bool(r.has_junction or False),
            police_station=str(r.zone),
            primary_violation="WRONG PARKING",
            num_violation_types=1,
            vehicle_type=str(r.common_vehicle or "CAR"),
            resolution_lag_mins=float(r.avg_lag or 60.0),
        )
        scored.append(TopHotspot(zone=str(r.zone), score=round(ml_score, 2), violation_count=int(r.cnt)))
    scored.sort(key=lambda h: h.score, reverse=True)
    return scored[:limit]

@router.get("/worst-lag-stations", response_model=list[WorstLagStation])
async def get_worst_lag_stations(limit: int = Query(10, ge=1, le=50), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT police_station AS station, AVG(resolution_lag_mins) AS avg_lag FROM violations WHERE police_station IS NOT NULL AND resolution_lag_mins IS NOT NULL GROUP BY police_station ORDER BY avg_lag DESC LIMIT :limit"), {"limit": limit})
    rows = result.fetchall()
    return [WorstLagStation(station=r.station, avg_lag_mins=round(float(r.avg_lag), 2)) for r in rows]
