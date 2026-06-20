"""
Congestion router — uses XGBoost ML model for scoring.
Replaces the hand-crafted formula with model.predict_score().
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import CongestionScore, ZoneCongestion
from app.ml.predictor import ml

router = APIRouter(prefix="/api/congestion", tags=["congestion"])


@router.get("/score", response_model=CongestionScore)
async def get_congestion_score(
    zone_id: str = Query(...),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    fd = from_date or "2025-01-01"
    td = to_date or "2025-05-31"

    result = await db.execute(
        text("""
        SELECT
            COUNT(*) AS cnt,
            AVG(severity_weight) AS avg_sev,
            AVG(resolution_lag_mins) AS avg_lag,
            AVG(latitude) AS lat,
            AVG(longitude) AS lon,
            BOOL_OR(is_junction) AS has_junction,
            MODE() WITHIN GROUP (ORDER BY vehicle_type) AS common_vehicle,
            MAX(hour_of_day) AS peak_hour,
            MAX(day_of_week) AS peak_dow
        FROM violations
        WHERE police_station = :zone
          AND created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp)
        """),
        {
            "zone": zone_id,
            "fd": datetime.fromisoformat(fd),
            "td": datetime.fromisoformat(td + " 23:59:59"),
        },
    )
    row = result.fetchone()
    cnt = int(row.cnt or 0)
    avg_sev = float(row.avg_sev or DEFAULT_SEV)
    avg_lag = float(row.avg_lag or 60.0)

    if cnt == 0:
        return CongestionScore(zone_id=zone_id, score=0.0, violation_count=0,
                               avg_severity=0.0, avg_lag_mins=0.0)

    # Use ML model — density approximated by violation count in zone
    ml_score = ml.predict_score(
        hour_of_day=int(row.peak_hour or 12),
        day_of_week=int(row.peak_dow or 0),
        month=datetime.fromisoformat(fd).month,
        lat=float(row.lat or 12.97),
        lon=float(row.lon or 77.59),
        density_500m=float(min(cnt, 100)),          # zone count as density proxy
        is_junction=bool(row.has_junction or False),
        police_station=zone_id,
        primary_violation="WRONG PARKING",           # dominant default
        num_violation_types=1,
        vehicle_type=str(row.common_vehicle or "CAR"),
        resolution_lag_mins=avg_lag,
        is_approved=False,
        sent_to_scita=False,
    )

    return CongestionScore(
        zone_id=zone_id,
        score=round(ml_score, 2),
        violation_count=cnt,
        avg_severity=round(avg_sev, 2),
        avg_lag_mins=round(avg_lag, 2),
    )


@router.get("/all-zones", response_model=list[ZoneCongestion])
async def get_all_zone_scores(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
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
        ORDER BY cnt DESC
        LIMIT 30
    """))
    rows = result.fetchall()

    output = []
    for r in rows:
        cnt = int(r.cnt)
        avg_lag = float(r.avg_lag or 60.0)

        # ML prediction per zone
        score = ml.predict_score(
            hour_of_day=9,          # morning peak assumption for zone-level
            day_of_week=1,
            month=3,
            lat=float(r.lat or 12.97),
            lon=float(r.lon or 77.59),
            density_500m=float(min(cnt, 100)),
            is_junction=bool(r.has_junction or False),
            police_station=str(r.zone),
            primary_violation="WRONG PARKING",
            num_violation_types=1,
            vehicle_type=str(r.common_vehicle or "CAR"),
            resolution_lag_mins=avg_lag,
        )

        output.append(ZoneCongestion(
            zone_id=str(r.zone),
            zone_name=str(r.zone),
            score=round(score, 2),
            violation_count=cnt,
            avg_severity=round(float(r.avg_sev or 0), 2),
        ))

    # Re-sort by ML score
    output.sort(key=lambda z: z.score, reverse=True)
    return output


@router.get("/vehicle-impact")
async def get_vehicle_impact(zone_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
        SELECT COALESCE(vehicle_type, 'UNKNOWN') AS vehicle_type,
               COUNT(*) AS cnt, AVG(severity_weight) AS avg_sev,
               AVG(resolution_lag_mins) AS avg_lag,
               AVG(latitude) AS lat, AVG(longitude) AS lon,
               BOOL_OR(is_junction) AS has_junction
        FROM violations
        WHERE police_station = :zone
        GROUP BY vehicle_type
        ORDER BY cnt DESC
        """),
        {"zone": zone_id},
    )
    rows = result.fetchall()
    out = []
    for r in rows:
        score = ml.predict_score(
            hour_of_day=9, day_of_week=1, month=3,
            lat=float(r.lat or 12.97), lon=float(r.lon or 77.59),
            density_500m=float(min(r.cnt, 100)),
            is_junction=bool(r.has_junction or False),
            police_station=zone_id,
            primary_violation="WRONG PARKING",
            num_violation_types=1,
            vehicle_type=str(r.vehicle_type),
            resolution_lag_mins=float(r.avg_lag or 60.0),
        )
        out.append({
            "vehicle_type": r.vehicle_type,
            "violation_count": int(r.cnt),
            "impact_score": round(score, 2),
            "ml_label": ml.score_to_label(score),
        })
    out.sort(key=lambda x: x["impact_score"], reverse=True)
    return out


@router.get("/peak-windows")
async def get_peak_windows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        SELECT COALESCE(police_station, 'Unknown') AS zone,
               hour_of_day AS hour, COUNT(*) AS cnt
        FROM violations
        WHERE police_station IS NOT NULL AND hour_of_day IS NOT NULL
        GROUP BY police_station, hour_of_day
        ORDER BY police_station, hour_of_day
    """))
    rows = result.fetchall()
    zones = sorted(set(r.zone for r in rows))[:10]
    matrix = [
        [int({r.hour: r.cnt for r in rows if r.zone == zone}.get(h, 0)) for h in range(24)]
        for zone in zones
    ]
    return {"zones": zones, "matrix": matrix}


DEFAULT_SEV = 1.5
