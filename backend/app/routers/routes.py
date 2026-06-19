from datetime import datetime
"""Routes router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db

router = APIRouter(prefix="/api/routes", tags=["routes"])

@router.get("/vehicle/{vehicle_number}")
async def get_vehicle_route(vehicle_number: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT latitude, longitude, created_datetime, police_station, violation_types, severity_weight FROM violations WHERE vehicle_number = :vn AND latitude IS NOT NULL ORDER BY created_datetime LIMIT 100"), {"vn": vehicle_number})
    rows = result.fetchall()
    return {"vehicle_number": vehicle_number, "route_points": [{"lat": float(r.latitude), "lng": float(r.longitude), "timestamp": r.created_datetime.isoformat() if r.created_datetime else None, "station": r.police_station, "violation_types": r.violation_types, "severity": r.severity_weight} for r in rows], "total_violations": len(rows)}

@router.get("/top-corridors")
async def get_top_corridors(limit: int = Query(10, ge=1, le=50), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT COALESCE(junction_name, police_station, 'Unknown') AS corridor, COUNT(*) AS cnt, AVG(severity_weight) AS avg_sev FROM violations WHERE (junction_name IS NOT NULL OR police_station IS NOT NULL) GROUP BY corridor ORDER BY cnt DESC LIMIT :limit"), {"limit": limit})
    return [{"corridor": r.corridor, "violation_count": int(r.cnt), "avg_severity": round(float(r.avg_sev or 0), 2)} for r in result.fetchall()]
