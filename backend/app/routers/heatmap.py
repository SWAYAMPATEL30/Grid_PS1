from datetime import datetime
"""Heatmap router."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import RealHeatmapPoint

router = APIRouter(prefix="/api/heatmap", tags=["heatmap"])

@router.get("/points", response_model=list[RealHeatmapPoint])
async def get_heatmap_points(
    from_date: Optional[str] = Query(None), to_date: Optional[str] = Query(None),
    hour_min: Optional[int] = Query(None), hour_max: Optional[int] = Query(None),
    day_type: Optional[str] = Query(None), vehicle_types: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    fd = from_date or "2020-01-01"
    td = to_date or "2026-12-31"
    clauses = ["created_datetime BETWEEN CAST(:fd AS timestamp) AND CAST(:td AS timestamp)", "latitude IS NOT NULL"]
    params: dict = {"fd": datetime.fromisoformat(fd), "td": datetime.fromisoformat(td + " 23:59:59")}
    if hour_min is not None:
        clauses.append("hour_of_day >= :hour_min"); params["hour_min"] = hour_min
    if hour_max is not None:
        clauses.append("hour_of_day <= :hour_max"); params["hour_max"] = hour_max
    if day_type == "weekday":
        clauses.append("day_of_week BETWEEN 0 AND 4")
    elif day_type == "weekend":
        clauses.append("day_of_week IN (5, 6)")
    if vehicle_types:
        clauses.append("vehicle_type = ANY(:vt_list)"); params["vt_list"] = vehicle_types.split(",")
    where = " AND ".join(clauses)
    result = await db.execute(
        text(f"SELECT latitude, longitude, AVG(severity_weight) AS weight, COUNT(*) AS cnt FROM violations WHERE {where} GROUP BY ROUND(latitude::numeric,3), ROUND(longitude::numeric,3), latitude, longitude ORDER BY cnt DESC LIMIT 2000"),
        params,
    )
    return [RealHeatmapPoint(lat=float(r.latitude), lng=float(r.longitude), weight=float(r.weight or 1.0), count=int(r.cnt)) for r in result.fetchall()]

@router.get("/zones")
async def get_heatmap_zones(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT police_station AS name, AVG(latitude) AS lat, AVG(longitude) AS lng, COUNT(*) AS cnt FROM violations WHERE police_station IS NOT NULL AND latitude IS NOT NULL GROUP BY police_station ORDER BY cnt DESC"))
    rows = result.fetchall()
    return {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"name": r.name, "count": int(r.cnt)}, "geometry": {"type": "Point", "coordinates": [float(r.lng), float(r.lat)]}} for r in rows]}
