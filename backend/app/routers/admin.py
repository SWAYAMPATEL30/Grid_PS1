from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.utils import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/users")
async def get_all_users(
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        text("SELECT id, email, full_name, role, police_station, is_active FROM users ORDER BY created_at DESC")
    )
    return [dict(r._mapping) for r in result.fetchall()]
