"""Router for Police Field Operations."""
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.utils import require_roles

router = APIRouter(prefix="/api/officers", tags=["officers"])

class LocationPydantic(BaseModel):
    latitude: float
    longitude: float

class SessionResponse(BaseModel):
    id: str
    officer_id: str
    clock_in: datetime
    clock_out: Optional[datetime]
    is_active: bool

@router.post("/clockin", response_model=SessionResponse)
async def clock_in(
    current_user: dict = Depends(require_roles("POLICE_OFFICER")),
    db: AsyncSession = Depends(get_db)
):
    session_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    # Close any existing active sessions
    await db.execute(
        text("UPDATE officer_sessions SET is_active = false, clock_out = :now WHERE officer_id = :oid AND is_active = true"),
        {"now": now, "oid": current_user["id"]}
    )
    
    # Create new session
    await db.execute(
        text("""
            INSERT INTO officer_sessions (id, officer_id, clock_in, is_active)
            VALUES (:id, :oid, :now, true)
        """),
        {"id": session_id, "oid": current_user["id"], "now": now}
    )
    await db.commit()
    
    return {
        "id": session_id,
        "officer_id": current_user["id"],
        "clock_in": now,
        "clock_out": None,
        "is_active": True
    }

@router.post("/clockout")
async def clock_out(
    current_user: dict = Depends(require_roles("POLICE_OFFICER")),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    await db.execute(
        text("UPDATE officer_sessions SET is_active = false, clock_out = :now WHERE officer_id = :oid AND is_active = true"),
        {"now": now, "oid": current_user["id"]}
    )
    await db.commit()
    return {"status": "success", "clock_out": now}

@router.post("/location")
async def update_location(
    loc: LocationPydantic,
    current_user: dict = Depends(require_roles("POLICE_OFFICER")),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    loc_id = str(uuid.uuid4())
    
    await db.execute(
        text("""
            INSERT INTO officer_locations (id, officer_id, latitude, longitude, timestamp)
            VALUES (:id, :oid, :lat, :lon, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :now)
        """),
        {"id": loc_id, "oid": current_user["id"], "lat": loc.latitude, "lon": loc.longitude, "now": now}
    )
    await db.commit()
    return {"status": "success"}

@router.get("/active")
async def get_active_officers(
    current_user: dict = Depends(require_roles("ADMIN", "ANALYST")),
    db: AsyncSession = Depends(get_db)
):
    """Returns the latest location for all active officers."""
    result = await db.execute(text("""
        WITH active_sessions AS (
            SELECT officer_id FROM officer_sessions WHERE is_active = true
        ),
        latest_locations AS (
            SELECT DISTINCT ON (officer_id) officer_id, latitude, longitude, timestamp
            FROM officer_locations
            WHERE timestamp > NOW() - INTERVAL '1 hour'
            ORDER BY officer_id, timestamp DESC
        )
        SELECT u.id, u.full_name, u.police_station, l.latitude, l.longitude, l.timestamp
        FROM users u
        JOIN active_sessions s ON u.id = s.officer_id
        JOIN latest_locations l ON u.id = l.officer_id
    """))
    return [dict(r._mapping) for r in result.fetchall()]

@router.get("/me/alerts")
async def get_proximity_alerts(
    current_user: dict = Depends(require_roles("POLICE_OFFICER")),
    db: AsyncSession = Depends(get_db)
):
    """Returns severe congestion alerts within 1km of the officer's last known location."""
    # 1. Get officer's latest location
    loc_res = await db.execute(
        text("""
            SELECT geom FROM officer_locations 
            WHERE officer_id = :oid 
            ORDER BY timestamp DESC LIMIT 1
        """),
        {"oid": current_user["id"]}
    )
    loc = loc_res.fetchone()
    if not loc:
        return []

    # 2. Find active hotspots (violations in last 3 hours grouped by junction) within 1km
    alerts_res = await db.execute(text("""
        WITH recent_violations AS (
            SELECT junction_name, geom, severity_weight
            FROM violations
            WHERE created_datetime > NOW() - INTERVAL '3 hours'
            AND junction_name IS NOT NULL
        ),
        hotspots AS (
            SELECT junction_name, 
                   ST_Centroid(ST_Collect(geom::geometry))::geography as center_geom,
                   SUM(severity_weight) as total_severity
            FROM recent_violations
            GROUP BY junction_name
            HAVING SUM(severity_weight) > 10
        )
        SELECT junction_name, total_severity, 
               ST_Distance(center_geom, :officer_geom) as distance_m
        FROM hotspots
        WHERE ST_DWithin(center_geom, :officer_geom, 1000) -- within 1km
        ORDER BY distance_m ASC
    """), {"officer_lat": loc.latitude, "officer_lon": loc.longitude})
    
    return [dict(r._mapping) for r in alerts_res.fetchall()]

@router.get("/attendance")
async def get_attendance_logs(
    current_user: dict = Depends(require_roles("ADMIN")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(text("""
        SELECT s.id, u.full_name, u.police_station, s.clock_in, s.clock_out, s.is_active
        FROM officer_sessions s
        JOIN users u ON s.officer_id = u.id
        ORDER BY s.clock_in DESC
        LIMIT 100
    """))
    return [dict(r._mapping) for r in result.fetchall()]
