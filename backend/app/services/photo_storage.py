"""Photo storage service for citizen uploads."""
import os
import uuid
import aiofiles
from fastapi import UploadFile

UPLOAD_DIR = "/app/data/uploads"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

async def save_photo(file: UploadFile) -> str:
    """Saves an uploaded photo to the local disk and returns the relative URL."""
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    async with aiofiles.open(filepath, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
        
    return f"/static/uploads/{filename}"
