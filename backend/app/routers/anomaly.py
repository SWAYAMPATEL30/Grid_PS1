from datetime import datetime
"""Anomaly router."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import AnomalyTimelinePoint, AnomalyFeedItem

router = APIRouter(prefix="/api/anomaly", tags=["anomaly"])

@router.get("/timeline", response_model=list[AnomalyTimelinePoint])
async def get_anomaly_timeline(from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    fd = from_date or "2025-01-01"; td = to_date or "2025-05-31"
    result = await db.execute(text("SELECT DATE(created_datetime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') AS d, COUNT(*) AS cnt FROM violations WHERE created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp) GROUP BY d ORDER BY d"), {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59")})
    rows = result.fetchall()
    counts = [int(r.cnt) for r in rows]; dates = [str(r.d) for r in rows]
    if not counts: return []
    mean = sum(counts) / len(counts); variance = sum((x - mean) ** 2 for x in counts) / max(len(counts) - 1, 1); std = max(variance ** 0.5, 1.0)
    return [AnomalyTimelinePoint(date=d, count=c, z_score=round((c - mean) / std, 2), is_anomaly=abs((c - mean) / std) > 2.0, expected=round(mean, 1)) for d, c in zip(dates, counts)]

@router.get("/feed", response_model=list[AnomalyFeedItem])
async def get_anomaly_feed(limit: int = Query(20, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT DATE(created_datetime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') AS d, COALESCE(police_station, 'Unknown') AS station, COUNT(*) AS cnt, AVG(severity_weight) AS avg_sev FROM violations GROUP BY d, police_station ORDER BY cnt DESC LIMIT :limit"), {"limit": limit})
    return [AnomalyFeedItem(date=str(r.d), station=r.station, count=int(r.cnt), severity=round(float(r.avg_sev or 0), 2), anomaly_type="SPIKE" if r.cnt > 50 else "NORMAL") for r in result.fetchall()]

@router.get("/summary")
async def get_anomaly_summary(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("WITH daily AS (SELECT DATE(created_datetime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') AS d, COUNT(*) AS cnt FROM violations GROUP BY d), stats AS (SELECT AVG(cnt) AS mean, STDDEV(cnt) AS std FROM daily) SELECT COUNT(*) FILTER (WHERE ABS(cnt - stats.mean) > 2 * COALESCE(stats.std, 1)) AS anomaly_days, COUNT(*) AS total_days, stats.mean, stats.std FROM daily, stats GROUP BY stats.mean, stats.std"))
    row = result.fetchone()
    if not row: return {"anomaly_days": 0, "total_days": 0, "anomaly_rate": 0.0}
    return {"anomaly_days": int(row.anomaly_days or 0), "total_days": int(row.total_days or 0), "anomaly_rate": round(float(row.anomaly_days or 0) / max(float(row.total_days or 1), 1) * 100, 2), "mean_daily": round(float(row.mean or 0), 1), "std_daily": round(float(row.std or 0), 1)}
