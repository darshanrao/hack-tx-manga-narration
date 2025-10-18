from fastapi import APIRouter, HTTPException
from ..models import ParseRequest, ParseResponse, MangaScene, Character, Dialogue

router = APIRouter()

@router.post("/parse-scene", response_model=ParseResponse)
async def parse_scene(req: ParseRequest) -> ParseResponse:
    """
    Stub endpoint that transforms a raw_text or bubbles array into a structured scene.
    For the hackathon MVP, we return a minimal mocked structure that the Next.js backend expects.
    Later, plug in OCR+LLM/agent logic here.
    """
    if not req.raw_text and not req.bubbles:
        raise HTTPException(status_code=400, detail="Provide raw_text or bubbles")

    # naive mock: if bubbles supplied, map them to dialogue lines; else use raw_text
    dialogue: list[Dialogue] = []
    if req.bubbles:
        for b in req.bubbles:
            speaker = b.get("speaker") or "Narrator"
            text = b.get("text") or ""
            dialogue.append(Dialogue(speaker=speaker, voice_id=None, text=text))
    else:
        # split by newline, assign to Narrator
        lines = [line.strip() for line in (req.raw_text or "").splitlines() if line.strip()]
        for line in lines:
            dialogue.append(Dialogue(speaker="Narrator", voice_id=None, text=line))

    scene = MangaScene(
        manga_title=req.manga_title or "Unknown",
        chapter_number=req.chapter_number or 1,
        page_id=req.page_id or "p1",
        scene_title=req.scene_title or "Auto Scene",
        ambient=req.ambient or "",
        characters={
            "Narrator": Character(voice_id=None, gender="neutral")
        },
        dialogue=dialogue
    )

    return ParseResponse(scene=scene)
