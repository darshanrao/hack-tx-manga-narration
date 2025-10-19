from __future__ import annotations

import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.supabase_service import SupabaseService


router = APIRouter()


class ProcessPdfRequest(BaseModel):
    bucket: str
    object_path: str
    scene_id: str | None = None


class ProcessPdfResponse(BaseModel):
    success: bool
    scene_id: str | None = None
    total_pages: int | None = None
    total_duration: float | None = None
    total_lines: int | None = None
    generated_files: list[dict] | None = None
    error: str | None = None


class _Noop(BaseModel):
    pass


@router.post("/process", response_model=ProcessPdfResponse)
async def process_pdf_with_eleven(req: ProcessPdfRequest):
    """Download a PDF from Supabase and process it via ElevenLabs pipeline.

    This calls elevenlabs/generate_dialogue.py:process_pdf_to_audio_uploading under the hood
    and uploads outputs to Supabase bucket 'output-files/<pdfBaseName>/*'.
    """
    # Prepare temp working directory
    job_id = str(uuid.uuid4())
    jobs_dir = Path(__file__).resolve().parents[2] / "agent-api" / "_jobs" / job_id
    jobs_dir.mkdir(parents=True, exist_ok=True)
    local_pdf = jobs_dir / Path(req.object_path).name

    # Download PDF from Supabase
    try:
        sb = SupabaseService.from_env()
        await sb.download_to_file(bucket=req.bucket, object_path=req.object_path, dest_path=str(local_pdf))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"download_failed: {e}")

    # Import and execute ElevenLabs processing
    try:
        # Add repository root to import path for elevenlabs module
        import sys
        import httpx
        repo_root = Path(__file__).resolve().parents[2]
        if str(repo_root) not in sys.path:
            sys.path.insert(0, str(repo_root))
        data_processing_path = repo_root / "data_processing"
        if str(data_processing_path) not in sys.path:
            sys.path.insert(0, str(data_processing_path))

        from elevenlabs.generate_dialogue import process_pdf_to_audio_uploading  # type: ignore

        scene_id = req.scene_id or Path(local_pdf).stem

        # Determine output folder name based on PDF base name (without extension)
        pdf_base = Path(local_pdf).stem
        output_bucket = "output-files"

        # Define synchronous upload function for eleven to call per file
        def upload_fn(name: str, data: bytes, content_type: str) -> str:
            object_path = f"{pdf_base}/{name}"
            file_url = f"{sb.url}/storage/v1/object/{output_bucket}/{object_path}"
            headers = {**sb._headers, "Content-Type": content_type, "x-upsert": "true"}
            with httpx.Client(timeout=120) as client:
                r = client.post(file_url, headers=headers, content=data)
                r.raise_for_status()
            return object_path

        result = process_pdf_to_audio_uploading(str(local_pdf), scene_id=scene_id, upload_fn=upload_fn)

        if not isinstance(result, dict):
            raise RuntimeError("Unexpected result from process_pdf_to_audio")

        # Normalize response
        success = bool(result.get("success"))
        if success:
            return ProcessPdfResponse(
                success=True,
                scene_id=result.get("scene_id"),
                total_pages=result.get("total_pages"),
                total_duration=result.get("total_duration"),
                total_lines=result.get("total_lines"),
                generated_files=result.get("generated_files", []),
            )
        else:
            return ProcessPdfResponse(success=False, error=str(result.get("error", "unknown_error")))

    except Exception as e:
        # Bubble up controlled error
        raise HTTPException(status_code=500, detail=f"elevenlabs_processing_failed: {e}")


## Async job/status endpoints were removed per request; use synchronous /process route.
