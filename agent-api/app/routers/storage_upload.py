from __future__ import annotations

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from ..services.supabase_service import SupabaseService

router = APIRouter()


class UploadResponse(BaseModel):
    bucket: str
    object_path: str
    public_url: str | None = None


@router.post("/upload", response_model=UploadResponse)
async def upload_file_to_bucket(
    file: UploadFile = File(...),
    bucket: str = Form(...),
    object_path: str = Form(...),
):
    try:
        sb = SupabaseService.from_env()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    data = await file.read()
    content_type = file.content_type or "application/octet-stream"
    try:
        public_url = await sb.upload_bytes(bucket=bucket, object_path=object_path, data=data, content_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"upload_failed: {e}")

    return UploadResponse(bucket=bucket, object_path=object_path, public_url=public_url)


class SignRequest(BaseModel):
    bucket: str
    object_path: str
    expires_in: int = 3600


class SignResponse(BaseModel):
    signed_url: str


@router.post("/sign", response_model=SignResponse)
async def sign_object_url(req: SignRequest):
    try:
        sb = SupabaseService.from_env()
        signed = await sb.sign_url(bucket=req.bucket, object_path=req.object_path, expires_in=req.expires_in)
        return SignResponse(signed_url=signed)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"sign_failed: {e}")
