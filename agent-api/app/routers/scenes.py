from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import re
from ..services.supabase_service import SupabaseService

router = APIRouter()


class Scene(BaseModel):
    id: str
    name: str
    filename: str
    uploaded_at: str
    total_pages: Optional[int] = None
    status: str = "completed"  # processing, completed, error
    public_url: Optional[str] = None


class SceneListResponse(BaseModel):
    scenes: List[Scene]


@router.get("/list", response_model=SceneListResponse)
async def list_scenes():
    """List all scenes from the manga-pdfs bucket."""
    try:
        sb = SupabaseService.from_env()
    except Exception as e:
        print(f"Supabase connection error: {e}")
        raise HTTPException(status_code=500, detail=f"supabase_connection_failed: {e}")

    try:
        # List objects at the bucket root (no subfolder)
        bucket = "manga-pdfs"
        folder_path = ""
        
        # Use Supabase storage API to list files (POST with JSON body)
        list_url = f"{sb.url}/storage/v1/object/list/{bucket}"
        list_payload = {
            "prefix": folder_path,
            "limit": 200,
            "offset": 0,
            "sortBy": {"column": "name", "order": "asc"},
        }
        
        import httpx
        async with httpx.AsyncClient(timeout=30) as client:
            print(f"Making request to: {list_url}")
            print(f"Headers: {sb._headers}")
            print(f"Payload: {list_payload}")
            
            response = await client.post(
                list_url,
                headers={**sb._headers, "Content-Type": "application/json"},
                json=list_payload,
            )
            print(f"Response status: {response.status_code}")
            print(f"Response text: {response.text[:500]}...")
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="bucket_or_folder_not_found")
            
            response.raise_for_status()
            files = response.json()
            print(f"Found {len(files)} files")
        
        scenes = []
        for file_info in files:
            if file_info.get("name", "").endswith(".pdf"):
                # Names are relative to the prefix (root here), so use as-is
                relative_name = file_info["name"]
                filename = relative_name.lstrip("/")
                # Extract scene number from filename pattern: timestamp_scene-X.pdf
                scene_match = re.search(r'scene[-_](\d+)', filename.lower())
                scene_number = scene_match.group(1) if scene_match else "Unknown"
                
                scene = Scene(
                    id=filename,  # Use object path at bucket root as ID
                    name=f"Scene {scene_number}",
                    filename=relative_name,
                    uploaded_at=(file_info.get("created_at") or file_info.get("updated_at") or datetime.now().isoformat()),
                    total_pages=_estimate_pages_from_scene(scene_number),
                    status="completed",
                    public_url=f"{sb.url}/storage/v1/object/public/{bucket}/{filename}"
                )
                scenes.append(scene)
        
        # Sort by scene number
        scenes.sort(key=lambda x: int(re.search(r'scene[-_](\d+)', x.filename.lower()).group(1)) if re.search(r'scene[-_](\d+)', x.filename.lower()) else 999)
        
        print(f"Returning {len(scenes)} scenes")
        return SceneListResponse(scenes=scenes)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in list_scenes: {e}")
        raise HTTPException(status_code=500, detail=f"list_failed: {e}")


def _estimate_pages_from_scene(scene_number: str) -> int:
    """Estimate page count based on scene number (for demo purposes)."""
    scene_num = int(scene_number)
    if scene_num == 1:
        return 7  # ch01 has 7 pages
    elif scene_num == 2:
        return 4  # ch02 has 4 pages
    elif scene_num == 3:
        return 5  # ch03 has 5 pages
    else:
        return 5  # Default estimate


@router.get("/{scene_id}", response_model=Scene)
async def get_scene(scene_id: str):
    """Get details for a specific scene."""
    try:
        sb = SupabaseService.from_env()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase connection failed: {str(e)}")

    try:
        bucket = "manga-pdfs"
        filename = scene_id
        
        # Check if file exists
        file_url = f"{sb.url}/storage/v1/object/{bucket}/{filename}"
        import httpx
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.head(file_url, headers=sb._headers)
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Scene not found")
            response.raise_for_status()
        
        # Extract scene number
        scene_match = re.search(r'scene[-_](\d+)', filename.lower())
        scene_number = scene_match.group(1) if scene_match else "Unknown"
        
        scene = Scene(
            id=filename,
            name=f"Scene {scene_number}",
            filename=filename,
            uploaded_at=datetime.now().isoformat(),  # Would need to get from metadata
            total_pages=_estimate_pages_from_scene(scene_number),
            status="completed",
            public_url=f"{sb.url}/storage/v1/object/public/{bucket}/{filename}"
        )
        
        return scene
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scene: {str(e)}")
