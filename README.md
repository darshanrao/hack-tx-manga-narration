## Manga Narration (HackTX 2025)

Turn manga PDFs into immersive, accessible audio with page-synced transcripts and voice-acted dialogue. Built for rapid demos: one command to run the frontend, one for the backend, optional pipelines to generate audio from PDFs.

### What it does
- Page-by-page audio playback aligned with transcripts
- Multi-speaker dialogue with performance tags (e.g., `[whispers]`, `[angry]`)
- Local demo assets included in `frontend/public` for instant playback
- Backend API for ingesting PDFs and serving scene data
- Optional pipelines for Gemini+ElevenLabs generation

---

## Quick Demo

1) Frontend (Next.js)
```bash
cd frontend
npm ci
npm run dev
# http://localhost:3000
```

2) Backend (FastAPI)
```bash
cd agent-api
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# http://localhost:8000/health → {"status":"ok"}
```

By default, CORS allows `http://localhost:3000`. Frontend expects the API at `http://127.0.0.1:8000` or `http://localhost:8000`.

---

## Project Structure

```
frontend/                 # Next.js app with page audio + transcripts
  public/                 # Sample MP3 + transcript files for demo
agent-api/                # FastAPI service (health + ingest + scenes)
data_processing/          # Python PDF→JSON pipeline (Gemini-based)
elevenlabs/               # Generate dialogue audio from JSON (ElevenLabs)
supabase/                 # Edge functions + storage setup (optional)
database-schema.sql       # Supabase schema (optional)
```

---

## End-to-End Pipeline (PDF → Main Audio)

1) PDF intake
- Source: local `data_processing/Chapters/*.pdf`, frontend upload, or Supabase Storage.
- Each PDF represents a scene with N pages.

2) Analysis (Gemini, two-pass hybrid)
- Pass 1 (character identification): analyze all pages to detect consistent character set and context.
- Pass 2 (dialogue extraction): per-page text and speaker attribution using Pass 1 context.

3) Enhancement (audio tags)
- Dialogue lines are augmented with ElevenLabs v3-compatible performance tags (e.g., `[whispers]`, `[angry]`, `[short pause]`).

4) Voice assignment
- Characters map to stable ElevenLabs `voice_id`s (see `voice_registry.json`); narrator has a dedicated voice.

5) Audio generation (ElevenLabs)
- For each page, generate MP3 with multi-speaker dialogue; also emit timestamped transcript for sync.
- Outputs: `ch{chapter}_page{page}_dialogue_{timestamp}.mp3` and `ch{chapter}_page{page}_transcript_{timestamp}.txt`.

6) Optional combine and storage
- Optionally combine per-page audio/transcripts and upload to Supabase Storage for hosting.

7) Frontend consumption
- Frontend scans `frontend/public` (or API/Storage) and auto-matches page MP3 ↔ transcript by filename.
- PDF viewer displays page N while the audio and transcript for page N play and highlight.

Where it runs
- Local Python: `data_processing/` (PDF→JSON) and `elevenlabs/` (JSON→audio)
- Edge option: `supabase/functions/manga-audio-pipeline` mirrors the flow serverlessly

Key outputs
- Per-page MP3 + transcript for seamless, page-synced playback in the UI

---

## Frontend Architecture (Next.js)

Core
- Next.js 15 App Router (`frontend/app`)
- TypeScript + Tailwind + Radix UI

Key pieces
- `components/PDFPageViewer.tsx`: renders a PDF page and exposes page change events
- `components/PageAudioManager.tsx`: binds current page → audio + transcript
- `hooks/usePageAudio.ts`: state machine for current page audio, transcript, and active cue
- `utils/pageAudioManager.ts`: parsing/auto-matching files to pages, chapter grouping
- `components/Transcript.tsx`: renders timestamped transcript with active-line highlight
- `components/PlaybackControls.tsx` and `EnhancedPlaybackControls.tsx`: media controls and keyboard shortcuts
- `services/pageAudioAPI.ts`: future API/Supabase integration (currently optional/local-first)

Data flow
- On page change, `usePageAudio` loads the matching audio/transcript, plays audio, and updates the active transcript line by time.
- Local-first: files from `frontend/public`; API mode: reads from backend/Supabase when enabled.

---

## Flow Diagram

[![Untitled-diagram-2025-10-19-160123.png](https://i.postimg.cc/Gm399frR/Untitled-diagram-2025-10-19-160123.png)](https://postimg.cc/3d63cndf)


---

## Environment

Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url   # optional
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key       # optional
```

Backend (`agent-api/.env`):
```env
API_PREFIX=/api
CORS_ALLOW_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
SUPABASE_URL=...              # optional
SUPABASE_KEY=...              # optional
ELEVENLABS_API_KEY=...        # optional (for generation)
GOOGLE_API_KEY=...            # optional (Gemini)
GEMINI_MODEL=gemini-2.5-flash # optional
```

Keep secrets out of git.

---

## API (selected)

- Health: `GET /health`
- Scenes: `GET /api/scenes/...` (see `agent-api/app/routers/scenes.py`)
- Ingest (stub for hackathon demo): `POST /api/ingest/...`
- Storage upload (optional): `POST /api/storage/upload`

Example quick test:
```bash
curl http://localhost:8000/health
```

---

## Generate Your Own Audio (optional)

Option A: Python pipeline (PDF → JSON)
```bash
cd data_processing
source venv/bin/activate  # or create one
export GOOGLE_API_KEY=your_key
python example_usage.py
```

Option B: ElevenLabs dialogue from JSON
```bash
cd elevenlabs
export ELEVENLABS_API_KEY=your_key
python generate_dialogue.py
```

Place the resulting MP3 and transcript `.txt` files into `frontend/public` (or a subfolder) following the naming pattern used in `frontend/README_PAGE_AUDIO.md` for automatic matching.

---

## Hackathon Notes

- Demo flows: upload or select a PDF → view pages → play page audio with transcript highlighting
- Accessibility: keyboard-first controls, high contrast, screen reader friendly
- Tradeoffs: local demo assets to avoid API latency; generation pipelines available if time allows

---

## Troubleshooting

- Frontend builds but assets don't play: ensure files are in `frontend/public` and follow the naming pattern
- CORS errors: confirm backend is on `:8000` and allowed origins include `http://localhost:3000`
- Python deps missing: re-activate venv and `pip install -r agent-api/requirements.txt`
- Node engine warnings for `pdfjs-dist`: use Node ≥20.16 or Node 22+

---

## Credits

HackTX 2025 team. Built with Next.js, FastAPI, Gemini, and ElevenLabs.
