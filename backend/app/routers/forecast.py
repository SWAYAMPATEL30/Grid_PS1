"""
Forecast router — ML-powered hotspot prediction and timeline forecasting.
Uses XGBoost model to score predicted future violation hotspots.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import ForecastTimelinePoint, ForecastHotspot
from app.ml.predictor import ml

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.get("/timeline", response_model=list[ForecastTimelinePoint])
async def get_forecast_timeline(
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    fd = from_date or "2025-01-01"
    td = to_date or "2025-05-31"

    result = await db.execute(
        text("""
        SELECT
            DATE(created_datetime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') AS d,
            COUNT(*) AS cnt
        FROM violations
        WHERE created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp)
        GROUP BY d
        ORDER BY d
        """),
        {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59")},
    )
    rows = result.fetchall()
    counts = [int(r.cnt) for r in rows]
    dates = [str(r.d) for r in rows]
    window = 7  # 7-day rolling mean

    out = []
    for i, (d, c) in enumerate(zip(dates, counts)):
        wv = counts[max(0, i - window + 1): i + 1]
        mean = sum(wv) / len(wv)
        variance = sum((x - mean) ** 2 for x in wv) / max(len(wv) - 1, 1)
        std = variance ** 0.5
        out.append(ForecastTimelinePoint(
            date=d,
            actual=c,
            forecast=round(mean, 1),
            upper=round(mean + std, 1),
            lower=round(max(0.0, mean - std), 1),
        ))
    return out


@router.get("/hotspots", response_model=list[ForecastHotspot])
async def get_forecast_hotspots(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Forecast next-period hotspots using ML model.
    Pulls recent zone stats → predicts congestion score → ranks by predicted risk.
    """
    result = await db.execute(
        text("""
        SELECT
            COALESCE(police_station, 'Unknown') AS station,
            COUNT(*) AS cnt,
            AVG(severity_weight) AS avg_sev,
            AVG(resolution_lag_mins) AS avg_lag,
            AVG(latitude) AS lat,
            AVG(longitude) AS lon,
            BOOL_OR(is_junction) AS has_junction,
            MODE() WITHIN GROUP (ORDER BY vehicle_type) AS common_vehicle
        FROM violations
        WHERE created_datetime >= CAST('2025-03-01' AS timestamp)
        GROUP BY police_station
        ORDER BY cnt DESC
        LIMIT :limit
        """),
        {"limit": limit * 2},  # over-fetch then re-rank by ML
    )
    rows = result.fetchall()

    hotspots = []
    for r in rows:
        cnt = int(r.cnt)
        avg_lag = float(r.avg_lag or 60.0)

        # ML score at peak hour (9 AM) to simulate morning enforcement planning
        ml_score = ml.predict_score(
            hour_of_day=9,
            day_of_week=1,
            month=4,   # predict for next month
            lat=float(r.lat or 12.97),
            lon=float(r.lon or 77.59),
            density_500m=float(min(cnt, 100)),
            is_junction=bool(r.has_junction or False),
            police_station=str(r.station),
            primary_violation="WRONG PARKING",
            num_violation_types=1,
            vehicle_type=str(r.common_vehicle or "CAR"),
            resolution_lag_mins=avg_lag,
        )

        # Confidence = based on historical data volume (more data = more confident)
        confidence = min(0.95, round(0.5 + (min(cnt, 500) / 1000.0), 2))

        hotspots.append(ForecastHotspot(
            zone=str(r.station),
            predicted_count=int(round(cnt * 1.05)),  # 5% growth forecast
            confidence=confidence,
            risk_level=ml.score_to_label(ml_score),
        ))

    # Re-rank by ML predicted congestion (Critical first)
    level_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    hotspots.sort(key=lambda h: level_order.get(h.risk_level, 4))
    return hotspots[:limit]


@router.get("/summary")
async def get_forecast_summary(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        SELECT COUNT(*) AS total, AVG(severity_weight) AS avg_sev,
               COUNT(DISTINCT police_station) AS stations
        FROM violations
        WHERE created_datetime >= CAST('2025-03-01' AS timestamp)
    """))
    row = result.fetchone()
    return {
        "total_recent": int(row.total or 0),
        "avg_severity": round(float(row.avg_sev or 0), 2),
        "active_stations": int(row.stations or 0),
        "forecast_period": "30 days",
        "model": "XGBoost" if ml.is_loaded else "rule-based",
    }
