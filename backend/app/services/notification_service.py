"""Notification service — mock SMS/email, logged to DB."""
import uuid
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def send_notification(
    db: AsyncSession,
    vehicle_number: str,
    message: str,
    notif_type: str = "SMS",
    recipient_id: str = None,
):
    """Log and (mock) send a notification to the vehicle owner."""
    notif_id = str(uuid.uuid4())
    now = datetime.utcnow()

    # Look up owner from registry
    owner_result = await db.execute(
        text("SELECT owner_name, owner_phone, owner_email FROM vehicle_registry WHERE vehicle_number = :vn"),
        {"vn": vehicle_number},
    )
    owner = owner_result.fetchone()

    # In production: call Twilio / MSG91 here
    if owner:
        print(f"[MOCK {notif_type}] → {owner.owner_phone}: {message}")
    else:
        print(f"[MOCK {notif_type}] → (unknown owner for {vehicle_number}): {message}")

    await db.execute(
        text("""
            INSERT INTO notifications (id, recipient_id, vehicle_number, type, message, status, sent_at)
            VALUES (:id, :rid, :vn, :type, :msg, 'sent', :now)
        """),
        {
            "id": notif_id,
            "rid": recipient_id,
            "vn": vehicle_number,
            "type": notif_type,
            "msg": message,
            "now": now,
        },
    )
    return notif_id
