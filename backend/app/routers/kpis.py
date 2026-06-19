from datetime import datetime
"""KPIs router."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import OfficerKPI, StationKPI

router = APIRouter(prefix="/api/kpis", tags=["kpis"])

@router.get("/officers", response_model=list[OfficerKPI])
async def get_officer_kpis(from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None), limit: int = Query(20, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    fd = from_date or "2025-01-01"; td = to_date or "2025-05-31"
    result = await db.execute(text("SELECT created_by_id AS officer_id, COUNT(*) AS total, AVG(severity_weight) AS avg_sev, AVG(resolution_lag_mins) AS avg_lag, COUNT(*) FILTER (WHERE data_sent_to_scita = true) AS scita_sent FROM violations WHERE created_by_id IS NOT NULL AND created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp) GROUP BY created_by_id ORDER BY total DESC LIMIT :limit"), {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59"), "limit": limit})
    return [OfficerKPI(officer_id=r.officer_id, total_violations=int(r.total), avg_severity=round(float(r.avg_sev or 0), 2), avg_lag_mins=round(float(r.avg_lag or 0), 2) if r.avg_lag else None, scita_sent=int(r.scita_sent or 0)) for r in result.fetchall()]

@router.get("/stations", response_model=list[StationKPI])
async def get_station_kpis(from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    fd = from_date or "2025-01-01"; td = to_date or "2025-05-31"
    result = await db.execute(text("SELECT COALESCE(police_station, 'Unknown') AS station, COUNT(*) AS total, AVG(severity_weight) AS avg_sev, AVG(resolution_lag_mins) AS avg_lag, COUNT(*) FILTER (WHERE validation_status = 'approved') AS approved, COUNT(*) FILTER (WHERE data_sent_to_scita = true) AS scita_sent FROM violations WHERE police_station IS NOT NULL AND created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp) GROUP BY police_station ORDER BY total DESC LIMIT 30"), {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59")})
    return [StationKPI(station=r.station, total_violations=int(r.total), avg_severity=round(float(r.avg_sev or 0), 2), avg_lag_mins=round(float(r.avg_lag or 0), 2) if r.avg_lag else None, approval_rate=round(int(r.approved) / max(int(r.total), 1) * 100, 2), scita_rate=round(int(r.scita_sent) / max(int(r.total), 1) * 100, 2)) for r in result.fetchall()]
