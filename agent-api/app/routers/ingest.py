from __future__ import annotations

from typing import Optional, Dict, Any, List
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from ..settings import get_settings
from ..services.supabase_service import SupabaseService
import asyncio
import os
import shutil
from pathlib import Path
import json

# Path to data_processing pipeline (project root sibling to agent-api)
# __file__ -> .../agent-api/app/routers/ingest.py
# parents[0]=routers, [1]=app, [2]=agent-api, [3]=hack-tx-manga-narration (project root)
DATA_PROCESSING_DIR = Path(__file__).resolve().parents[3] / "data_processing"
PIPELINE_FILE = DATA_PROCESSING_DIR / "pdf_to_audio_pipeline.py"


router = APIRouter()


class IngestStartRequest(BaseModel):
    bucket: str
    object_path: str
    filename: Optional[str] = None


class IngestStartResponse(BaseModel):
    job_id: str


class IngestStatusResponse(BaseModel):
    status: str  # queued | processing | done | error
    progress: Optional[int] = None
    outputs: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# Extremely simple in-memory job store (hackathon-friendly)
JOBS: Dict[str, Dict[str, Any]] = {}


def _process_job(job_id: str, req: IngestStartRequest) -> None:
    """Background job stub.
    Replace this with real logic: download from Supabase, run pipeline, upload outputs, etc.
    """
    try:
        JOBS[job_id]["status"] = "processing"
        JOBS[job_id]["progress"] = 5

        settings = get_settings()
        bucket = req.bucket
        object_path = req.object_path
        filename = req.filename or Path(object_path).name

        work_dir = Path(Path.cwd()) / "_jobs" / job_id
        work_dir.mkdir(parents=True, exist_ok=True)
        local_pdf = work_dir / filename
        output_dir = work_dir / "outputs"
        output_dir.mkdir(parents=True, exist_ok=True)

        # 1) Download the PDF from Supabase
        JOBS[job_id]["progress"] = 10
        sb = SupabaseService.from_env()
        asyncio.run(sb.download_to_file(bucket=bucket, object_path=object_path, dest_path=str(local_pdf)))

        # 2) Try running the pipeline (best-effort, catches missing deps like poppler)
        #    We will execute the pipeline file as a module-like by import and call class directly.
        #    To avoid import issues, add data_processing to sys.path temporarily.
        import sys
        sys.path.insert(0, str(DATA_PROCESSING_DIR))
        try:
            from pdf_to_audio_pipeline import PDFToAudioPipeline  # type: ignore
            os.environ.setdefault("GOOGLE_API_KEY", settings.GOOGLE_API_KEY or "")
            pipeline = PDFToAudioPipeline(output_dir=str(output_dir), gemini_api_key=os.environ.get("GOOGLE_API_KEY"))
            JOBS[job_id]["progress"] = 40
            results = pipeline.process_pdf_scene(str(local_pdf))
            JOBS[job_id]["progress"] = 70
        except Exception as e:
            # If pipeline fails (e.g., poppler missing), record error but continue to produce a minimal transcript
            results = {
                "scene_id": Path(filename).stem,
                "error": f"pipeline_failed: {e}",
                "output_directory": str(output_dir),
                "page_results": [],
            }
        finally:
            # remove path injection
            if str(DATA_PROCESSING_DIR) in sys.path:
                sys.path.remove(str(DATA_PROCESSING_DIR))

        # 3) Collect produced JSON files (if any)
        produced_json: List[Path] = sorted(output_dir.glob("*.json"))
        transcript_manifest = output_dir / "transcript.json"
        with open(transcript_manifest, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

        # 4) Upload outputs to Supabase under outputs/{job_id}/
        JOBS[job_id]["progress"] = 85
        public_base = settings.SUPABASE_URL.rstrip("/") if settings.SUPABASE_URL else None
        audio_url = None
        transcript_url = None

        # Upload transcript manifest
        transcript_object = f"outputs/{job_id}/transcript.json"
        transcript_url = asyncio.run(sb.upload_file(bucket=bucket, object_path=transcript_object, local_path=str(transcript_manifest), content_type="application/json"))

        # If we have page JSON files, upload them too
        for json_file in produced_json:
            object_name = f"outputs/{job_id}/{json_file.name}"
            asyncio.run(sb.upload_file(bucket=bucket, object_path=object_name, local_path=str(json_file), content_type="application/json"))

        # Note: generating a single audio.mp3 would require a TTS call; omitted for now.
        # Provide transcript_url and leave audio_url None for the moment.
        outputs = {
            "audio_url": audio_url,
            "transcript_url": transcript_url,
        }

        JOBS[job_id]["progress"] = 100
        JOBS[job_id]["status"] = "done"
        JOBS[job_id]["outputs"] = outputs
    except Exception as e:
        JOBS[job_id]["status"] = "error"
        JOBS[job_id]["error"] = str(e)


@router.post("/start", response_model=IngestStartResponse)
async def start_ingest(req: IngestStartRequest, background_tasks: BackgroundTasks):
    """Kick off a new ingest job from a Supabase Storage object.

    Body: { bucket, object_path, filename? }
    Returns: { job_id }
    """
    if not req.bucket or not req.object_path:
        raise HTTPException(status_code=400, detail="bucket and object_path are required")

    job_id = str(uuid4())
    JOBS[job_id] = {"status": "queued", "progress": 0, "request": req.model_dump()}

    background_tasks.add_task(_process_job, job_id, req)
    return IngestStartResponse(job_id=job_id)


@router.get("/status/{job_id}", response_model=IngestStatusResponse)
async def get_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    return IngestStatusResponse(
        status=job.get("status", "queued"),
        progress=job.get("progress"),
        outputs=job.get("outputs"),
        error=job.get("error"),
    )
