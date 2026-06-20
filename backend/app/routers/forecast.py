from datetime import datetime
"""Forecast router."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import ForecastTimelinePoint, ForecastHotspot

router = APIRouter(prefix="/api/forecast", tags=["forecast"])

@router.get("/timeline", response_model=list[ForecastTimelinePoint])
async def get_forecast_timeline(from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    fd = from_date or "2023-11-01"; td = to_date or "2024-04-30"
    result = await db.execute(text("SELECT DATE(created_datetime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') AS d, COUNT(*) AS cnt FROM violations WHERE created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp) GROUP BY d ORDER BY d"), {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59")})
    rows = result.fetchall()
    counts = [int(r.cnt) for r in rows]; dates = [str(r.d) for r in rows]; window = 7
    out = []
    for i, (d, c) in enumerate(zip(dates, counts)):
        wv = counts[max(0, i - window + 1): i + 1]; mean = sum(wv) / len(wv)
        variance = sum((x - mean) ** 2 for x in wv) / max(len(wv) - 1, 1); std = variance ** 0.5
        out.append(ForecastTimelinePoint(date=d, actual=c, forecast=round(mean, 1), upper=round(mean + std, 1), lower=round(max(0.0, mean - std), 1)))
    return out

@router.get("/hotspots", response_model=list[ForecastHotspot])
async def get_forecast_hotspots(limit: int = Query(10, ge=1, le=50), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT COALESCE(police_station, 'Unknown') AS station, COUNT(*) AS cnt, AVG(severity_weight) AS avg_sev FROM violations WHERE created_datetime >= CAST('2025-04-01' AS timestamp) GROUP BY police_station ORDER BY cnt DESC LIMIT :limit"), {"limit": limit})
    rows = result.fetchall()
    return [ForecastHotspot(zone=r.station, predicted_count=int(round(r.cnt * 1.05)), confidence=min(0.95, round(0.6 + (float(r.avg_sev or 1) / 10.0), 2)), risk_level="HIGH" if r.cnt > 300 else "MEDIUM" if r.cnt > 150 else "LOW") for r in rows]

@router.get("/summary")
async def get_forecast_summary(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT COUNT(*) AS total, AVG(severity_weight) AS avg_sev, COUNT(DISTINCT police_station) AS stations FROM violations WHERE created_datetime >= CAST('2025-04-01' AS timestamp)"))
    row = result.fetchone()
    return {"total_recent": int(row.total or 0), "avg_severity": round(float(row.avg_sev or 0), 2), "active_stations": int(row.stations or 0), "forecast_period": "30 days"}
