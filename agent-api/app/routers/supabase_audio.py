from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
import re
import httpx
from ..services.supabase_service import SupabaseService

router = APIRouter()

class SupabaseFileInfo(BaseModel):
    name: str
    id: str
    updated_at: str
    created_at: str
    last_accessed_at: str
    metadata: dict

class SceneFolderInfo(BaseModel):
    sceneNumber: int
    folderName: str
    audioFiles: List[SupabaseFileInfo]
    transcriptFiles: List[SupabaseFileInfo]

class SceneListResponse(BaseModel):
    scenes: List[SceneFolderInfo]

class PageAudioResponse(BaseModel):
    pageNumber: int
    sceneNumber: int
    audioUrl: str
    transcriptUrl: str
    duration: Optional[float] = None

class TranscriptResponse(BaseModel):
    transcriptContent: str

@router.get("/debug/files")
async def debug_list_all_files():
    """Debug endpoint to list all files in the bucket."""
    try:
        sb = SupabaseService.from_env()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase connection failed: {str(e)}")

    try:
        bucket = "output-files"
        
        # List all files in the bucket
        list_url = f"{sb.url}/storage/v1/object/list/{bucket}"
        list_payload = {
            "prefix": "",
            "limit": 200,
            "offset": 0,
            "sortBy": {"column": "name", "order": "asc"},
        }
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                list_url,
                headers={**sb._headers, "Content-Type": "application/json"},
                json=list_payload,
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Bucket not found")
            
            response.raise_for_status()
            files = response.json()
        
        # Return all file names for debugging
        file_names = [file_info.get("name", "NO_NAME") for file_info in files]
        
        return {
            "total_files": len(files),
            "file_names": file_names,
            "bucket": bucket
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

@router.get("/scenes", response_model=SceneListResponse)
async def list_scene_folders():
    """List all scene folders in the output-files bucket."""
    try:
        sb = SupabaseService.from_env()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase connection failed: {str(e)}")

    try:
        bucket = "output-files"
        
        # List all folders in the bucket
        list_url = f"{sb.url}/storage/v1/object/list/{bucket}"
        list_payload = {
            "prefix": "",
            "limit": 200,
            "offset": 0,
            "sortBy": {"column": "name", "order": "asc"},
        }
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                list_url,
                headers={**sb._headers, "Content-Type": "application/json"},
                json=list_payload,
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Bucket not found")
            
            response.raise_for_status()
            files = response.json()
            
            # Debug: Log all files found
            print(f"DEBUG: Found {len(files)} files in bucket '{bucket}'")
            for file_info in files[:10]:  # Log first 10 files
                print(f"DEBUG: File: {file_info.get('name', 'NO_NAME')}")
            if len(files) > 10:
                print(f"DEBUG: ... and {len(files) - 10} more files")
        
        # First, identify scene folders
        scene_folder_names = []
        for file_info in files:
            name = file_info.get("name", "")
            print(f"DEBUG: Processing item: '{name}'")
            
            # Check if it's a scene folder (scene-X without trailing slash)
            scene_match = re.match(r'scene-(\d+)$', name)
            if scene_match:
                scene_number = int(scene_match.group(1))
                folder_name = f"scene-{scene_number}"
                print(f"DEBUG: Found scene folder: {folder_name}")
                scene_folder_names.append(folder_name)
            else:
                print(f"DEBUG: Item '{name}' is not a scene folder")
        
        print(f"DEBUG: Found {len(scene_folder_names)} scene folders: {scene_folder_names}")
        
        # Now, for each scene folder, list its contents
        scene_folders = {}
        
        async with httpx.AsyncClient(timeout=30) as client:
            for folder_name in scene_folder_names:
                try:
                    scene_number = int(folder_name.split('-')[1])
                    print(f"DEBUG: Listing contents of folder: {folder_name}")
                    
                    # List files in this specific folder
                    folder_list_url = f"{sb.url}/storage/v1/object/list/{bucket}"
                    folder_list_payload = {
                        "prefix": f"{folder_name}/",
                        "limit": 200,
                        "offset": 0,
                        "sortBy": {"column": "name", "order": "asc"},
                    }
                    
                    print(f"DEBUG: Making request to {folder_list_url} with prefix '{folder_name}/'")
                    folder_response = await client.post(
                        folder_list_url,
                        headers={**sb._headers, "Content-Type": "application/json"},
                        json=folder_list_payload,
                    )
                    
                    print(f"DEBUG: Response status: {folder_response.status_code}")
                    if folder_response.status_code != 200:
                        print(f"DEBUG: Error response: {folder_response.text}")
                        continue
                    
                    folder_response.raise_for_status()
                    folder_files = folder_response.json()
                    
                    print(f"DEBUG: Found {len(folder_files)} files in {folder_name}")
                    
                    # Initialize scene folder data
                    scene_folders[scene_number] = {
                        "sceneNumber": scene_number,
                        "folderName": folder_name,
                        "audioFiles": [],
                        "transcriptFiles": []
                    }
                    
                    # Process files in this folder
                    for file_info in folder_files:
                        file_name = file_info.get("name", "")
                        print(f"DEBUG: Processing file in {folder_name}: {file_name}")
                        
                        # Check if it's an audio or transcript file
                        if file_name.endswith('.mp3') and '_dialogue_' in file_name:
                            print(f"DEBUG: Found audio file: {file_name}")
                            # Construct public URL
                            full_object_path = f"{folder_name}/{file_name}"
                            public_url = f"{sb.url}/storage/v1/object/public/{bucket}/{full_object_path}"
                            scene_folders[scene_number]["audioFiles"].append(SupabaseFileInfo(
                                name=file_name,
                                id=file_info.get("id", ""),
                                updated_at=file_info.get("updated_at", ""),
                                created_at=file_info.get("created_at", ""),
                                last_accessed_at=file_info.get("last_accessed_at", ""),
                                metadata=file_info.get("metadata", {}),
                                publicUrl=public_url
                            ))
                        elif file_name.endswith('.txt') and '_transcript_' in file_name:
                            print(f"DEBUG: Found transcript file: {file_name}")
                            # Construct public URL
                            full_object_path = f"{folder_name}/{file_name}"
                            public_url = f"{sb.url}/storage/v1/object/public/{bucket}/{full_object_path}"
                            scene_folders[scene_number]["transcriptFiles"].append(SupabaseFileInfo(
                                name=file_name,
                                id=file_info.get("id", ""),
                                updated_at=file_info.get("updated_at", ""),
                                created_at=file_info.get("created_at", ""),
                                last_accessed_at=file_info.get("last_accessed_at", ""),
                                metadata=file_info.get("metadata", {}),
                                publicUrl=public_url
                            ))
                        else:
                            print(f"DEBUG: File {file_name} is not an audio or transcript file")
                except Exception as e:
                    print(f"DEBUG: Error processing folder {folder_name}: {str(e)}")
                    continue
        
        # Convert to list and sort by scene number
        scenes = [SceneFolderInfo(**folder_data) for folder_data in scene_folders.values()]
        scenes.sort(key=lambda x: x.sceneNumber)
        
        print(f"DEBUG: Final result - Found {len(scenes)} scenes")
        for scene in scenes:
            print(f"DEBUG: Scene {scene.sceneNumber}: {len(scene.audioFiles)} audio files, {len(scene.transcriptFiles)} transcript files")
        
        return SceneListResponse(scenes=scenes)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list scenes: {str(e)}")

@router.get("/scenes/{scene_number}", response_model=SceneFolderInfo)
async def get_scene_files(scene_number: int):
    """Get all files for a specific scene."""
    try:
        sb = SupabaseService.from_env()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase connection failed: {str(e)}")

    try:
        bucket = "output-files"
        folder_prefix = f"scene-{scene_number}/"
        
        # List files in the specific scene folder
        list_url = f"{sb.url}/storage/v1/object/list/{bucket}"
        list_payload = {
            "prefix": folder_prefix,
            "limit": 200,
            "offset": 0,
            "sortBy": {"column": "name", "order": "asc"},
        }
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                list_url,
                headers={**sb._headers, "Content-Type": "application/json"},
                json=list_payload,
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Scene folder not found")
            
            response.raise_for_status()
            files = response.json()
        
        audio_files = []
        transcript_files = []
        
        for file_info in files:
            name = file_info.get("name", "")
            
            if name.endswith('.mp3') and '_dialogue_' in name:
                audio_files.append(SupabaseFileInfo(
                    name=name,
                    id=file_info.get("id", ""),
                    updated_at=file_info.get("updated_at", ""),
                    created_at=file_info.get("created_at", ""),
                    last_accessed_at=file_info.get("last_accessed_at", ""),
                    metadata=file_info.get("metadata", {})
                ))
            elif name.endswith('.txt') and '_transcript_' in name:
                transcript_files.append(SupabaseFileInfo(
                    name=name,
                    id=file_info.get("id", ""),
                    updated_at=file_info.get("updated_at", ""),
                    created_at=file_info.get("created_at", ""),
                    last_accessed_at=file_info.get("last_accessed_at", ""),
                    metadata=file_info.get("metadata", {})
                ))
        
        return SceneFolderInfo(
            sceneNumber=scene_number,
            folderName=f"scene-{scene_number}",
            audioFiles=audio_files,
            transcriptFiles=transcript_files
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scene files: {str(e)}")

@router.get("/scenes/{scene_number}/pages/{page_number}", response_model=PageAudioResponse)
async def get_page_audio(scene_number: int, page_number: int):
    """Get audio and transcript URLs for a specific page."""
    try:
        sb = SupabaseService.from_env()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase connection failed: {str(e)}")

    try:
        bucket = "output-files"
        folder_prefix = f"scene-{scene_number}/"
        
        # List files in the specific scene folder
        list_url = f"{sb.url}/storage/v1/object/list/{bucket}"
        list_payload = {
            "prefix": folder_prefix,
            "limit": 200,
            "offset": 0,
            "sortBy": {"column": "name", "order": "asc"},
        }
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                list_url,
                headers={**sb._headers, "Content-Type": "application/json"},
                json=list_payload,
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Scene folder not found")
            
            response.raise_for_status()
            files = response.json()
        
        # Find the specific page files
        audio_file = None
        transcript_file = None
        
        for file_info in files:
            name = file_info.get("name", "")
            
            # Look for files matching the page number pattern
            if name.endswith('.mp3') and f'_dialogue_' in name:
                # Extract page number from filename
                page_match = re.search(r'_page(\d+)_', name)
                if page_match and int(page_match.group(1)) == page_number:
                    audio_file = name
            elif name.endswith('.txt') and f'_transcript_' in name:
                # Extract page number from filename
                page_match = re.search(r'_page(\d+)_', name)
                if page_match and int(page_match.group(1)) == page_number:
                    transcript_file = name
        
        if not audio_file:
            raise HTTPException(status_code=404, detail=f"Audio file not found for scene {scene_number}, page {page_number}")
        
        # Generate signed URLs for the files
        audio_url = f"{sb.url}/storage/v1/object/public/{bucket}/scene-{scene_number}/{audio_file}"
        transcript_url = f"{sb.url}/storage/v1/object/public/{bucket}/scene-{scene_number}/{transcript_file}" if transcript_file else ""
        
        return PageAudioResponse(
            pageNumber=page_number,
            sceneNumber=scene_number,
            audioUrl=audio_url,
            transcriptUrl=transcript_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get page audio: {str(e)}")

@router.get("/scenes/{scene_number}/pages/{page_number}/transcript", response_model=TranscriptResponse)
async def get_page_transcript(scene_number: int, page_number: int):
    """Get transcript content for a specific page."""
    try:
        sb = SupabaseService.from_env()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase connection failed: {str(e)}")

    try:
        bucket = "output-files"
        folder_prefix = f"scene-{scene_number}/"
        
        # List files in the specific scene folder
        list_url = f"{sb.url}/storage/v1/object/list/{bucket}"
        list_payload = {
            "prefix": folder_prefix,
            "limit": 200,
            "offset": 0,
            "sortBy": {"column": "name", "order": "asc"},
        }
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                list_url,
                headers={**sb._headers, "Content-Type": "application/json"},
                json=list_payload,
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Scene folder not found")
            
            response.raise_for_status()
            files = response.json()
        
        # Find the specific transcript file
        transcript_file = None
        
        for file_info in files:
            name = file_info.get("name", "")
            
            if name.endswith('.txt') and f'_transcript_' in name:
                # Extract page number from filename
                page_match = re.search(r'_page(\d+)_', name)
                if page_match and int(page_match.group(1)) == page_number:
                    transcript_file = name
                    break
        
        if not transcript_file:
            raise HTTPException(status_code=404, detail=f"Transcript file not found for scene {scene_number}, page {page_number}")
        
        # Download the transcript content
        file_url = f"{sb.url}/storage/v1/object/{bucket}/scene-{scene_number}/{transcript_file}"
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(file_url, headers=sb._headers)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Transcript file not found")
            
            response.raise_for_status()
            transcript_content = response.text
        
        return TranscriptResponse(transcriptContent=transcript_content)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get transcript: {str(e)}")

@router.get("/files/{scene_number}/{filename}")
async def serve_file(scene_number: int, filename: str, request: Request):
    """Serve a file from Supabase Storage with Range support for seeking."""
    try:
        sb = SupabaseService.from_env()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase connection failed: {str(e)}")

    try:
        bucket = "output-files"
        object_path = f"scene-{scene_number}/{filename}"
        
        # Get the file from Supabase Storage
        file_url = f"{sb.url}/storage/v1/object/{bucket}/{object_path}"
        
        # Forward Range header if present to support partial content
        forward_headers = dict(sb._headers)
        range_header = request.headers.get("range") or request.headers.get("Range")
        if range_header:
            forward_headers["Range"] = range_header

        async with httpx.AsyncClient(timeout=None) as client:
            response = await client.get(file_url, headers=forward_headers)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"File not found: {filename}")
            
            # Allow 200 (full) or 206 (partial)
            if response.status_code not in (200, 206):
                response.raise_for_status()

            # Return the file content with appropriate headers
            from fastapi.responses import Response

            # Pass through upstream headers important for seeking
            headers = {
                "Cache-Control": response.headers.get("Cache-Control", "public, max-age=3600"),
                "Content-Disposition": f"inline; filename={filename}",
            }
            for h in ("Content-Range", "Accept-Ranges", "Content-Length", "Content-Type"):
                if h in response.headers:
                    headers[h] = response.headers[h]

            # Choose media type from upstream if present
            content_type = response.headers.get("Content-Type", "audio/mpeg" if filename.endswith('.mp3') else "text/plain")

            return Response(
                content=response.content,
                media_type=content_type,
                status_code=response.status_code,
                headers=headers
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to serve file {filename}: {str(e)}")
