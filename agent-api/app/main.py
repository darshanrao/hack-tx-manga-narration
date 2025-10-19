from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import parse
from .routers import ingest
from .routers import storage_upload
from .routers import scenes
from .settings import get_settings

settings = get_settings()

app = FastAPI(title="Manga Agent API", version="0.1.0")

# CORS for local dev; tighten in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOW_ORIGINS or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

# Mount routers under configurable API prefix
api_prefix = settings.API_PREFIX.rstrip("/")
app.include_router(parse.router, prefix=f"{api_prefix}/agent", tags=["agent"]) 
app.include_router(ingest.router, prefix=f"{api_prefix}/ingest", tags=["ingest"]) 
app.include_router(storage_upload.router, prefix=f"{api_prefix}/storage", tags=["storage"])
app.include_router(scenes.router, prefix=f"{api_prefix}/scenes", tags=["scenes"]) 
