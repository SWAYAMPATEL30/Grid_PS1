from datetime import datetime
"""Zones router."""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import ZoneListItem

router = APIRouter(prefix="/api/zones", tags=["zones"])

@router.get("/list", response_model=list[ZoneListItem])
async def get_zones(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT police_station AS zone_id, police_station AS zone_name, COUNT(*) AS total, AVG(latitude) AS lat, AVG(longitude) AS lng, AVG(severity_weight) AS avg_sev FROM violations WHERE police_station IS NOT NULL GROUP BY police_station ORDER BY total DESC"))
    rows = result.fetchall()
    return [ZoneListItem(zone_id=r.zone_id, zone_name=r.zone_name, total_violations=int(r.total), lat=float(r.lat) if r.lat else None, lng=float(r.lng) if r.lng else None, avg_severity=round(float(r.avg_sev or 0), 2)) for r in rows]
