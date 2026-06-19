from datetime import datetime
"""SCITA router."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import ScitaOverview, ScitaByStation, ScitaTimeline, ScitaJunction

router = APIRouter(prefix="/api/scita", tags=["scita"])

@router.get("/overview", response_model=ScitaOverview)
async def get_scita_overview(from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    fd = from_date or "2025-01-01"; td = to_date or "2025-05-31"
    result = await db.execute(text("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE data_sent_to_scita = true) AS sent, AVG(EXTRACT(EPOCH FROM (data_sent_to_scita_timestamp - created_datetime)) / 60) FILTER (WHERE data_sent_to_scita = true AND data_sent_to_scita_timestamp IS NOT NULL) AS avg_delay FROM violations WHERE created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp)"), {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59")})
    row = result.fetchone(); total = int(row.total or 0); sent = int(row.sent or 0)
    return ScitaOverview(total_records=total, sent_to_scita=sent, not_sent=total - sent, transmission_rate=round(sent / max(total, 1) * 100, 2), avg_transmission_delay_mins=round(float(row.avg_delay or 0), 2))

@router.get("/by-station", response_model=list[ScitaByStation])
async def get_scita_by_station(from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    fd = from_date or "2025-01-01"; td = to_date or "2025-05-31"
    result = await db.execute(text("SELECT COALESCE(police_station, 'Unknown') AS station, COUNT(*) AS total, COUNT(*) FILTER (WHERE data_sent_to_scita = true) AS sent FROM violations WHERE police_station IS NOT NULL AND created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp) GROUP BY police_station ORDER BY total DESC LIMIT 20"), {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59")})
    return [ScitaByStation(station=r.station, total=int(r.total), sent=int(r.sent), rate=round(int(r.sent) / max(int(r.total), 1) * 100, 2)) for r in result.fetchall()]

@router.get("/timeline", response_model=list[ScitaTimeline])
async def get_scita_timeline(from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    fd = from_date or "2025-01-01"; td = to_date or "2025-05-31"
    result = await db.execute(text("SELECT DATE(created_datetime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') AS d, COUNT(*) AS total, COUNT(*) FILTER (WHERE data_sent_to_scita = true) AS sent FROM violations WHERE created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp) GROUP BY d ORDER BY d"), {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59")})
    return [ScitaTimeline(date=str(r.d), total=int(r.total), sent=int(r.sent), not_sent=int(r.total) - int(r.sent)) for r in result.fetchall()]

@router.get("/junctions", response_model=list[ScitaJunction])
async def get_scita_junctions(limit: int = Query(10, ge=1, le=50), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT COALESCE(junction_name, 'Non-junction') AS junction, COUNT(*) AS total, COUNT(*) FILTER (WHERE data_sent_to_scita = true) AS sent FROM violations WHERE junction_name IS NOT NULL GROUP BY junction_name ORDER BY total DESC LIMIT :limit"), {"limit": limit})
    return [ScitaJunction(junction=r.junction, total=int(r.total), sent=int(r.sent), rate=round(int(r.sent) / max(int(r.total), 1) * 100, 2)) for r in result.fetchall()]
