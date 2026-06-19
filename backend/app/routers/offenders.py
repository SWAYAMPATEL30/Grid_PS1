from datetime import datetime
"""Offenders router."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import OffenderSummary, OffenderInsights

router = APIRouter(prefix="/api/offenders", tags=["offenders"])

@router.get("/summary", response_model=list[OffenderSummary])
async def get_offenders(from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None), min_violations: int = Query(2, ge=1), limit: int = Query(50, ge=1, le=200), db: AsyncSession = Depends(get_db)):
    fd = from_date or "2025-01-01"; td = to_date or "2025-05-31"
    result = await db.execute(text("SELECT vehicle_number, COUNT(*) AS total, COUNT(DISTINCT police_station) AS stations, AVG(severity_weight) AS avg_sev, MAX(created_datetime) AS last_seen, MODE() WITHIN GROUP (ORDER BY vehicle_type) AS common_type FROM violations WHERE vehicle_number IS NOT NULL AND created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp) GROUP BY vehicle_number HAVING COUNT(*) >= :min_v ORDER BY total DESC LIMIT :limit"), {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59"), "min_v": min_violations, "limit": limit})
    rows = result.fetchall()
    return [OffenderSummary(vehicle_number=r.vehicle_number, total_violations=int(r.total), unique_stations=int(r.stations), avg_severity=round(float(r.avg_sev or 0), 2), last_seen=r.last_seen.isoformat() if r.last_seen else None, vehicle_type=r.common_type, risk_tier="HIGH" if r.total >= 10 else "MEDIUM" if r.total >= 5 else "LOW") for r in rows]

@router.get("/insights", response_model=OffenderInsights)
async def get_offender_insights(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT COUNT(DISTINCT vehicle_number) FILTER (WHERE cnt >= 5) AS high_risk, COUNT(DISTINCT vehicle_number) FILTER (WHERE cnt >= 2) AS repeat_offenders, COUNT(DISTINCT vehicle_number) AS total_unique FROM (SELECT vehicle_number, COUNT(*) AS cnt FROM violations WHERE vehicle_number IS NOT NULL GROUP BY vehicle_number) sub"))
    row = result.fetchone()
    return OffenderInsights(total_unique_vehicles=int(row.total_unique or 0), repeat_offenders=int(row.repeat_offenders or 0), high_risk_vehicles=int(row.high_risk or 0))
