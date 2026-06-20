from datetime import datetime
"""Temporal router."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import HourDayCell, DailyTrend, WeekdayWeekend

router = APIRouter(prefix="/api/temporal", tags=["temporal"])
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

def _dr(fd, td): return (fd or "2023-11-01"), (td or "2024-04-30")

@router.get("/heatmap-matrix", response_model=list[HourDayCell])
async def get_heatmap_matrix(from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    fd, td = _dr(from_date, to_date)
    result = await db.execute(text("SELECT hour_of_day AS hour, day_of_week AS day, COUNT(*) AS cnt FROM violations WHERE created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp) AND hour_of_day IS NOT NULL AND day_of_week IS NOT NULL GROUP BY hour_of_day, day_of_week ORDER BY day_of_week, hour_of_day"), {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59")})
    rows = result.fetchall()
    data = {(r.hour, r.day): int(r.cnt) for r in rows}
    return [HourDayCell(hour=h, day=d, day_name=DAYS[d], count=data.get((h, d), 0)) for d in range(7) for h in range(24)]

@router.get("/daily-trend", response_model=list[DailyTrend])
async def get_daily_trend(from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    fd, td = _dr(from_date, to_date)
    result = await db.execute(text("SELECT DATE(created_datetime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') AS d, COUNT(*) AS cnt, AVG(severity_weight) AS avg_sev FROM violations WHERE created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp) GROUP BY d ORDER BY d"), {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59")})
    return [DailyTrend(date=str(r.d), count=int(r.cnt), avg_severity=round(float(r.avg_sev or 0), 2)) for r in result.fetchall()]

@router.get("/weekday-weekend", response_model=WeekdayWeekend)
async def get_weekday_weekend(from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    fd, td = _dr(from_date, to_date)
    result = await db.execute(text("SELECT CASE WHEN day_of_week IN (5,6) THEN 'weekend' ELSE 'weekday' END AS dtype, COUNT(*) AS cnt, AVG(severity_weight) AS avg_sev FROM violations WHERE created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp) AND day_of_week IS NOT NULL GROUP BY dtype"), {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59")})
    rows = result.fetchall()
    data = {r.dtype: r for r in rows}
    wd = data.get("weekday"); we = data.get("weekend")
    return WeekdayWeekend(weekday_count=int(wd.cnt) if wd else 0, weekend_count=int(we.cnt) if we else 0, weekday_avg_severity=round(float(wd.avg_sev or 0), 2) if wd else 0.0, weekend_avg_severity=round(float(we.avg_sev or 0), 2) if we else 0.0)
