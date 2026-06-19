from datetime import datetime
"""Queue router."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import QueueZone

router = APIRouter(prefix="/api/queue", tags=["queue"])

@router.get("/zones", response_model=list[QueueZone])
async def get_queue_zones(time_window: Optional[str] = Query(None), zone_type: Optional[str] = Query(None), vehicle_focus: Optional[str] = Query(None), limit: int = Query(20, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    clauses = ["police_station IS NOT NULL"]
    params: dict = {"limit": limit}
    if vehicle_focus:
        clauses.append("vehicle_type = :vf"); params["vf"] = vehicle_focus
    if time_window == "morning":
        clauses.append("hour_of_day BETWEEN 6 AND 10")
    elif time_window == "evening":
        clauses.append("hour_of_day BETWEEN 17 AND 20")
    where = " AND ".join(clauses)
    result = await db.execute(text(f"SELECT police_station AS zone_id, police_station AS zone_name, COUNT(*) AS cnt, AVG(severity_weight) AS avg_sev, AVG(resolution_lag_mins) AS avg_lag, AVG(latitude) AS lat, AVG(longitude) AS lng FROM violations WHERE {where} GROUP BY police_station ORDER BY (COUNT(*) * AVG(severity_weight)) DESC LIMIT :limit"), params)
    rows = result.fetchall()
    return [QueueZone(zone_id=r.zone_id, zone_name=r.zone_name, priority_score=min(100.0, round((r.cnt * float(r.avg_sev or 1)) / 5.0, 2)), violation_count=int(r.cnt), avg_severity=round(float(r.avg_sev or 0), 2), avg_lag_mins=round(float(r.avg_lag or 0), 2) if r.avg_lag else None, lat=float(r.lat) if r.lat else None, lng=float(r.lng) if r.lng else None) for r in rows]

@router.get("/zone/{zone_id}")
async def get_zone_detail(zone_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT DATE(created_datetime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') AS d, COUNT(*) AS cnt FROM violations WHERE police_station = :zone GROUP BY d ORDER BY d DESC LIMIT 30"), {"zone": zone_id})
    chart_data = [{"date": str(r.d), "count": int(r.cnt)} for r in result.fetchall()]
    recent = await db.execute(text("SELECT id, vehicle_number, vehicle_type, violation_types, created_datetime, severity_weight FROM violations WHERE police_station = :zone ORDER BY created_datetime DESC LIMIT 10"), {"zone": zone_id})
    recent_violations = [{"id": r.id, "vehicle_number": r.vehicle_number, "vehicle_type": r.vehicle_type, "violation_types": r.violation_types, "created_datetime": r.created_datetime.isoformat() if r.created_datetime else None, "severity_weight": r.severity_weight} for r in recent.fetchall()]
    return {"zone_id": zone_id, "chart_data": chart_data, "recent_violations": recent_violations}
