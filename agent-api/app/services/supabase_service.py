from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import httpx

from ..settings import get_settings


@dataclass
class SupabaseService:
    """Minimal Supabase Storage helper using service key via REST API.

    This avoids adding the supabase-py dependency for a hackathon-friendly footprint.
    """

    url: str
    key: str

    @classmethod
    def from_env(cls) -> "SupabaseService":
        settings = get_settings()
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in environment/.env")
        return cls(url=settings.SUPABASE_URL.rstrip("/"), key=settings.SUPABASE_KEY)

    @property
    def _headers(self) -> dict:
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
        }

    async def download_to_file(self, bucket: str, object_path: str, dest_path: str) -> str:
        """Download a storage object to a local file path."""
        file_url = f"{self.url}/storage/v1/object/{bucket}/{object_path.lstrip('/')}"
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.get(file_url, headers=self._headers)
            r.raise_for_status()
            Path(dest_path).parent.mkdir(parents=True, exist_ok=True)
            Path(dest_path).write_bytes(r.content)
        return dest_path

    async def upload_file(self, bucket: str, object_path: str, local_path: str, content_type: str = "application/octet-stream") -> str:
        """Upload a local file to storage; returns public-style URL (may need signing if private)."""
        file_url = f"{self.url}/storage/v1/object/{bucket}/{object_path.lstrip('/')}"
        data = Path(local_path).read_bytes()
        headers = {**self._headers, "Content-Type": content_type, "x-upsert": "true"}
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(file_url, headers=headers, content=data)
            r.raise_for_status()
        # Return the public URL form (works if bucket/object is public)
        return f"{self.url}/storage/v1/object/public/{bucket}/{object_path.lstrip('/')}"

    async def upload_bytes(self, bucket: str, object_path: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload raw bytes to storage; returns public-style URL (may need signing if private)."""
        file_url = f"{self.url}/storage/v1/object/{bucket}/{object_path.lstrip('/')}"
        headers = {**self._headers, "Content-Type": content_type, "x-upsert": "true"}
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(file_url, headers=headers, content=data)
            r.raise_for_status()
        return f"{self.url}/storage/v1/object/public/{bucket}/{object_path.lstrip('/')}"

    async def sign_url(self, bucket: str, object_path: str, expires_in: int = 3600) -> str:
        """Create a signed URL for a private object; returns the signed URL string."""
        sign_url = f"{self.url}/storage/v1/object/sign/{bucket}/{object_path.lstrip('/')}"
        payload = {"expiresIn": expires_in}
        headers = {**self._headers, "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(sign_url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
            # Supabase returns { signedURL: "/storage/v1/object/sign/..." } or { signedUrl: "..." }
            signed = data.get("signedURL") or data.get("signedUrl")
            if not signed:
                # Some responses return full URL in 'url'
                signed = data.get("url")
            if not signed:
                raise RuntimeError(f"Failed to sign URL: {data}")
            # If response is a path, prefix base URL
            if signed.startswith("/"):
                return f"{self.url.rstrip('/')}{signed}"
            return signed
