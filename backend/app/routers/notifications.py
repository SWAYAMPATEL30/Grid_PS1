"""Vehicle owner notifications and appeal router."""
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.utils import require_roles, get_current_user
from app.services.notification_service import send_notification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class NotificationOut(BaseModel):
    id: str
    vehicle_number: Optional[str]
    type: str
    message: str
    status: str
    sent_at: datetime

class AppealRequest(BaseModel):
    vehicle_number: str
    reason: str

@router.post("/notify/violation")
async def notify_vehicle_owner(
    vehicle_number: str,
    violation_description: str,
    current_user: dict = Depends(require_roles("ADMIN", "ANALYST", "POLICE_OFFICER")),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a notification to the vehicle owner about a confirmed violation."""
    msg = (
        f"Dear Vehicle Owner, your vehicle {vehicle_number} has received a traffic violation: "
        f"{violation_description}. Please visit your nearest police station or use ParkSight to resolve."
    )
    notif_id = await send_notification(db, vehicle_number, msg, "SMS")
    await db.commit()
    return {"status": "sent", "notification_id": notif_id}

@router.get("/history/{vehicle_number}", response_model=List[NotificationOut])
async def get_notification_history(
    vehicle_number: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT * FROM notifications WHERE vehicle_number = :vn ORDER BY sent_at DESC"),
        {"vn": vehicle_number},
    )
    return [dict(r._mapping) for r in result.fetchall()]

@router.get("/vehicle/{vehicle_number}/violations")
async def get_vehicle_violations(
    vehicle_number: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Vehicle owner sees all violations for their registered vehicle."""
    result = await db.execute(
        text("""
            SELECT id, vehicle_type, violation_types, police_station, junction_name,
                   created_datetime, validation_status, resolution_lag_mins
            FROM violations
            WHERE vehicle_number = :vn
            ORDER BY created_datetime DESC
            LIMIT 50
        """),
        {"vn": vehicle_number},
    )
    rows = result.fetchall()
    return {
        "vehicle_number": vehicle_number,
        "total_violations": len(rows),
        "violations": [dict(r._mapping) for r in rows],
    }

@router.post("/vehicle/{vehicle_number}/appeal")
async def submit_appeal(
    vehicle_number: str,
    req: AppealRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    appeal_id = str(uuid.uuid4())
    msg = f"[APPEAL] Vehicle {vehicle_number} submitted appeal: {req.reason}"
    # Log as an in-app notification for the admin
    await send_notification(db, vehicle_number, msg, "IN_APP", recipient_id=current_user["id"])
    await db.commit()
    return {"status": "appeal_submitted", "appeal_id": appeal_id}
