import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.config import settings

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

async def save_uploaded_image(file: UploadFile) -> str:
    """
    Validates uploaded image and stores it with a secure random UUID filename.
    Returns relative URL path: '/uploads/<filename>'
    """
    content_type = file.content_type.lower() if file.content_type else ""
    if not content_type or content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image format. Allowed formats: JPG, PNG, WEBP."
        )

    # Read file content safely with size limit
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
        )

    # Generate safe random filename
    ext = ALLOWED_MIME_TYPES[content_type]
    file_id = f"{uuid.uuid4().hex}{ext}"
    target_path = UPLOAD_DIR / file_id

    # Write asynchronously to disk
    async with aiofiles.open(target_path, "wb") as f:
        await f.write(content)

    return f"/uploads/{file_id}"

def remove_uploaded_image(image_path: str):
    """Safely removes an uploaded image if it resides in the uploads directory."""
    if not image_path or not image_path.startswith("/uploads/"):
        return
    filename = Path(image_path).name
    file_path = UPLOAD_DIR / filename
    try:
        if file_path.exists() and file_path.is_file():
            file_path.unlink()
    except Exception:
        pass
