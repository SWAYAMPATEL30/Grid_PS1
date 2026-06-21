"""
Enforcement Queue router — ML-scored priority dispatch.
Uses XGBoost model to rank zones by predicted congestion score.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import QueueZone
from app.ml.predictor import ml

router = APIRouter(prefix="/api/queue", tags=["queue"])


@router.get("/zones", response_model=list[QueueZone])
async def get_queue_zones(
    time_window: Optional[str] = Query(None),
    zone_type: Optional[str] = Query(None),
    vehicle_focus: Optional[str] = Query(None),
    limit: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    clauses = ["police_station IS NOT NULL",
                "created_datetime BETWEEN CAST('2025-01-01' AS timestamp) AND CAST('2025-05-31' AS timestamp)"]
    params: dict = {"limit": limit}

    if vehicle_focus and vehicle_focus not in ("all", ""):
        vmap = {"lgv": "LGV", "auto": "PASSENGER AUTO", "car": "CAR", "scooter": "SCOOTER"}
        vtype = vmap.get(vehicle_focus.lower(), vehicle_focus.upper())
        clauses.append("vehicle_type = :vf")
        params["vf"] = vtype
    if time_window == "2h":
        clauses.append("hour_of_day BETWEEN 7 AND 10")
    elif time_window == "8h":
        clauses.append("hour_of_day BETWEEN 6 AND 22")

    where = " AND ".join(clauses)

    result = await db.execute(
        text(f"""
        SELECT
            police_station AS zone_id,
            police_station AS zone_name,
            MODE() WITHIN GROUP (ORDER BY junction_name) AS junction_name,
            COUNT(*) AS cnt,
            AVG(severity_weight) AS avg_sev,
            AVG(resolution_lag_mins) AS avg_lag,
            AVG(latitude) AS lat,
            AVG(longitude) AS lng,
            BOOL_OR(is_junction) AS has_junction,
            MODE() WITHIN GROUP (ORDER BY vehicle_type) AS common_vehicle,
            MODE() WITHIN GROUP (ORDER BY hour_of_day) AS peak_hour,
            MODE() WITHIN GROUP (ORDER BY day_of_week) AS peak_dow
        FROM violations
        WHERE {where}
        GROUP BY police_station
        ORDER BY COUNT(*) DESC
        LIMIT :limit
        """),
        params,
    )
    rows = result.fetchall()

    output = []
    for r in rows:
        cnt = int(r.cnt)
        avg_lag = float(r.avg_lag or 60.0)
        peak_h = int(r.peak_hour or 9)

        ml_score = ml.predict_score(
            hour_of_day=peak_h,
            day_of_week=int(r.peak_dow or 1),
            month=3,
            lat=float(r.lat or 12.97),
            lon=float(r.lng or 77.59),
            density_500m=float(min(cnt, 100)),
            is_junction=bool(r.has_junction or False),
            police_station=str(r.zone_id),
            primary_violation="WRONG PARKING",
            num_violation_types=1,
            vehicle_type=str(r.common_vehicle or "CAR"),
            resolution_lag_mins=avg_lag,
        )

        if ml_score >= 75:
            action = "Deploy Officer — Critical"
        elif ml_score >= 50:
            action = "Dispatch Officer"
        elif ml_score >= 25:
            action = "CCTV Monitor"
        else:
            action = "Routine Patrol"

        output.append(QueueZone(
            rank=0,
            zone=str(r.zone_id),
            zone_id=str(r.zone_id),
            zone_name=str(r.zone_name),
            junction_name=r.junction_name,
            score=round(ml_score, 2),
            priority_score=round(ml_score, 2),
            open_violations=cnt,
            violation_count=cnt,
            avg_severity=round(float(r.avg_sev or 0), 2),
            avg_lag_mins=round(avg_lag, 2),
            peak_hour=peak_h,
            recommended_action=action,
            lat=float(r.lat) if r.lat else None,
            lon=float(r.lng) if r.lng else None,
            lng=float(r.lng) if r.lng else None,
        ))

    output.sort(key=lambda z: z.score, reverse=True)
    for i, z in enumerate(output):
        z.rank = i + 1
    return output[:limit]



@router.get("/zone/{zone_id}")
async def get_zone_detail(zone_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
        SELECT DATE(created_datetime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') AS d,
               COUNT(*) AS cnt
        FROM violations
        WHERE police_station = :zone
        GROUP BY d
        ORDER BY d DESC
        LIMIT 30
        """),
        {"zone": zone_id},
    )
    chart_data = [{"date": str(r.d), "count": int(r.cnt)} for r in result.fetchall()]

    recent = await db.execute(
        text("""
        SELECT id, vehicle_number, vehicle_type, violation_types,
               created_datetime, severity_weight, resolution_lag_mins,
               is_junction, hour_of_day, latitude, longitude
        FROM violations
        WHERE police_station = :zone
        ORDER BY created_datetime DESC
        LIMIT 10
        """),
        {"zone": zone_id},
    )
    recent_rows = recent.fetchall()

    recent_violations = []
    for r in recent_rows:
        # ML score per individual recent violation
        score = ml.predict_score(
            hour_of_day=int(r.hour_of_day or 12),
            day_of_week=0,
            month=3,
            lat=float(r.latitude or 12.97),
            lon=float(r.longitude or 77.59),
            density_500m=5.0,  # single-record estimate
            is_junction=bool(r.is_junction or False),
            police_station=zone_id,
            primary_violation="WRONG PARKING",
            num_violation_types=1,
            vehicle_type=str(r.vehicle_type or "CAR"),
            resolution_lag_mins=float(r.resolution_lag_mins or 60.0),
        )
        recent_violations.append({
            "id": r.id,
            "vehicle_number": r.vehicle_number,
            "vehicle_type": r.vehicle_type,
            "violation_types": r.violation_types,
            "created_datetime": r.created_datetime.isoformat() if r.created_datetime else None,
            "severity_weight": r.severity_weight,
            "ml_congestion_score": round(score, 2),
            "ml_label": ml.score_to_label(score),
            "recommended_action": ml.score_to_action(score),
        })

    return {
        "zone_id": zone_id,
        "chart_data": chart_data,
        "recent_violations": recent_violations,
    }
