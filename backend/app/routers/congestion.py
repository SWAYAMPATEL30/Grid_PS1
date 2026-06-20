from datetime import datetime
"""Congestion router."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import CongestionScore, ZoneCongestion

router = APIRouter(prefix="/api/congestion", tags=["congestion"])

@router.get("/score", response_model=CongestionScore)
async def get_congestion_score(zone_id: str = Query(...), from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    fd = from_date or "2023-11-01"; td = to_date or "2024-04-30"
    result = await db.execute(text("SELECT COUNT(*) AS cnt, AVG(severity_weight) AS avg_sev, AVG(resolution_lag_mins) AS avg_lag FROM violations WHERE police_station = :zone AND created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp)"), {"zone": zone_id, "fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59")})
    row = result.fetchone()
    cnt = int(row.cnt or 0); avg_sev = float(row.avg_sev or 1.0); avg_lag = float(row.avg_lag or 0)
    return CongestionScore(zone_id=zone_id, score=min(100.0, round((cnt * avg_sev) / 10.0, 2)), violation_count=cnt, avg_severity=round(avg_sev, 2), avg_lag_mins=round(avg_lag, 2))

@router.get("/all-zones", response_model=list[ZoneCongestion])
async def get_all_zone_scores(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT COALESCE(police_station, 'Unknown') AS zone, COUNT(*) AS cnt, AVG(severity_weight) AS avg_sev FROM violations WHERE police_station IS NOT NULL GROUP BY police_station ORDER BY cnt DESC LIMIT 30"))
    rows = result.fetchall()
    return [ZoneCongestion(zone_id=r.zone, zone_name=r.zone, score=min(100.0, round((r.cnt * float(r.avg_sev or 1)) / 10.0, 2)), violation_count=int(r.cnt), avg_severity=round(float(r.avg_sev or 0), 2)) for r in rows]

@router.get("/vehicle-impact")
async def get_vehicle_impact(zone_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT COALESCE(vehicle_type, 'UNKNOWN') AS vehicle_type, COUNT(*) AS cnt, AVG(severity_weight) AS avg_sev FROM violations WHERE police_station = :zone GROUP BY vehicle_type ORDER BY cnt DESC"), {"zone": zone_id})
    return [{"vehicle_type": r.vehicle_type, "violation_count": int(r.cnt), "impact_score": round(float(r.avg_sev or 1) * r.cnt / 10.0, 2)} for r in result.fetchall()]

@router.get("/peak-windows")
async def get_peak_windows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT COALESCE(police_station, 'Unknown') AS zone, hour_of_day AS hour, COUNT(*) AS cnt FROM violations WHERE police_station IS NOT NULL AND hour_of_day IS NOT NULL GROUP BY police_station, hour_of_day ORDER BY police_station, hour_of_day"))
    rows = result.fetchall()
    zones = sorted(set(r.zone for r in rows))[:10]
    matrix = [[int({r.hour: r.cnt for r in rows if r.zone == zone}.get(h, 0)) for h in range(24)] for zone in zones]
    return {"zones": zones, "matrix": matrix}
