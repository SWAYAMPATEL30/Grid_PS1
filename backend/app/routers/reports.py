"""Router for citizen reports and photo uploads."""
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.utils import require_roles, require_any, get_current_user
from app.services.photo_storage import save_photo

router = APIRouter(prefix="/api/reports", tags=["reports"])

class ReportResponse(BaseModel):
    id: str
    citizen_id: str
    photo_url: str
    description: Optional[str]
    latitude: float
    longitude: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/submit", response_model=ReportResponse)
async def submit_report(
    photo: UploadFile = File(...),
    description: Optional[str] = Form(None),
    lat: float = Form(...),
    lon: float = Form(...),
    current_user: dict = Depends(require_roles("CITIZEN")),
    db: AsyncSession = Depends(get_db)
):
    """Citizen uploads a photo with GPS of an illegally parked vehicle."""
    photo_url = await save_photo(photo)
    report_id = str(uuid.uuid4())
    now = datetime.utcnow()

    await db.execute(
        text("""
            INSERT INTO citizen_reports (id, citizen_id, photo_url, description, latitude, longitude, geom, status, created_at)
            VALUES (:id, :cid, :url, :desc, :lat, :lon, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), 'pending', :now)
        """),
        {
            "id": report_id,
            "cid": current_user["id"],
            "url": photo_url,
            "desc": description,
            "lat": lat,
            "lon": lon,
            "now": now
        }
    )
    await db.commit()
    
    return {
        "id": report_id, "citizen_id": current_user["id"],
        "photo_url": photo_url, "description": description,
        "latitude": lat, "longitude": lon, "status": "pending",
        "created_at": now
    }

@router.get("/my", response_model=List[ReportResponse])
async def get_my_reports(
    current_user: dict = Depends(require_roles("CITIZEN")),
    db: AsyncSession = Depends(get_db)
):
    """Citizen views their own submissions."""
    result = await db.execute(
        text("SELECT * FROM citizen_reports WHERE citizen_id = :cid ORDER BY created_at DESC"),
        {"cid": current_user["id"]}
    )
    return [dict(r._mapping) for r in result.fetchall()]

@router.get("/pending", response_model=List[ReportResponse])
async def get_pending_reports(
    current_user: dict = Depends(require_roles("VERIFIER", "ADMIN")),
    db: AsyncSession = Depends(get_db)
):
    """Verifier sees reports needing validation."""
    result = await db.execute(
        text("SELECT * FROM citizen_reports WHERE status = 'pending' ORDER BY created_at ASC")
    )
    return [dict(r._mapping) for r in result.fetchall()]

class VerifyRequest(BaseModel):
    is_valid: bool
    reason: Optional[str] = None

@router.put("/{report_id}/verify")
async def verify_report(
    report_id: str,
    req: VerifyRequest,
    current_user: dict = Depends(require_roles("VERIFIER", "ADMIN")),
    db: AsyncSession = Depends(get_db)
):
    """Verifier marks a report as valid or rejected."""
    new_status = "verified" if req.is_valid else "rejected"
    await db.execute(
        text("UPDATE citizen_reports SET status = :status, verifier_id = :vid WHERE id = :id"),
        {"status": new_status, "vid": current_user["id"], "id": report_id}
    )
    await db.commit()
    return {"status": "success", "new_status": new_status}

@router.put("/{report_id}/assign")
async def assign_report(
    report_id: str,
    officer_id: str,
    current_user: dict = Depends(require_roles("ANALYST", "ADMIN")),
    db: AsyncSession = Depends(get_db)
):
    """Assign a verified report to a police officer."""
    await db.execute(
        text("UPDATE citizen_reports SET status = 'assigned', assigned_officer_id = :oid WHERE id = :id AND status = 'verified'"),
        {"oid": officer_id, "id": report_id}
    )
    await db.commit()
    return {"status": "assigned"}

@router.get("/assigned", response_model=List[ReportResponse])
async def get_assigned_reports(
    current_user: dict = Depends(require_roles("POLICE_OFFICER")),
    db: AsyncSession = Depends(get_db)
):
    """Officer views tasks assigned to them."""
    result = await db.execute(
        text("SELECT * FROM citizen_reports WHERE assigned_officer_id = :oid AND status = 'assigned'"),
        {"oid": current_user["id"]}
    )
    return [dict(r._mapping) for r in result.fetchall()]
