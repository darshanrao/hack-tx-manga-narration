## Manga Narration Backend (FastAPI-only)

This branch contains only the backend service and database schema.

- `agent-api/` — FastAPI service (backend/agentic AI)
- `database-schema.sql` — Supabase schema (tables, indexes, policies)

This README is Windows-optimized (PowerShell commands). Adjust as needed for macOS/Linux.

## Prerequisites

- Python 3.11 or 3.13
- Optional: Supabase project (to apply `database-schema.sql`)

## Environment variables

- `agent-api/.env` (optional for local dev without DB/TTS)
  - `SUPABASE_URL=...`
  - `SUPABASE_KEY=...`
  - `ELEVENLABS_API_KEY=...`
  - `GOOGLE_API_KEY=...` (Gemini AI Studio)
  - `GEMINI_MODEL=gemini-2.5-flash`

Keep secrets out of git. See `.gitignore`.

## Quick Start

Backend (FastAPI)

```powershell
cd agent-api
py -3.13 -m venv .\.venv
.\.venv\Scripts\Activate.ps1
py -3.13 -m pip install --upgrade pip
py -3.13 -m pip install -r requirements.txt
py -3.13 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Test: open http://localhost:8000/health → should return `{ "status": "ok" }`

## Apply database schema (optional)

If you’re using Supabase, paste `database-schema.sql` into the SQL editor and run it. It creates:

- `manga_scenes`, `audio_files`, `audio_transcripts`
- indexes, RLS policies, and a small update trigger

For production, tighten RLS policies beyond the permissive demo setup.

## Test endpoints

- Backend health: `GET http://localhost:8000/health`
- Agent parse stub: `POST http://localhost:8000/api/agent/parse-scene`
  - Body example: `{ "raw_text": "[calm] The wind drifts." }`

## Git: initialize and push a new branch

Run these from the repo root (`C:\hacktx25`). Replace placeholders in angle brackets.

```powershell
# 1) Initialize and set remote
git init
git add .
git commit -m "chore: initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git

# 2) Create a new branch for your work
git checkout -b feature/fastapi-voices
git push -u origin feature/fastapi-voices
```

Later updates on that branch:

```powershell
git add -A
git commit -m "feat(api): add /api/voices in FastAPI"
git push
```

## Project structure

```
agent-api/
  app/
    main.py           # FastAPI app entry
    routers/          # Feature routers (e.g., parse)
    models.py         # Pydantic models
    settings.py       # Env-driven configuration
  requirements.txt

database-schema.sql   # Supabase schema
.gitignore            # Root ignore rules
```

## Troubleshooting

- If `uvicorn` isn’t found, ensure the venv is activated or run with `py -3.13 -m uvicorn ...`.
- If `pydantic-core` tries to compile from source, prefer Python 3.11 or 3.13 to use prebuilt wheels.
- If the frontend can’t reach the backend, confirm `NEXT_PUBLIC_API_BASE` and CORS allowlist in `agent-api/app/main.py`.

