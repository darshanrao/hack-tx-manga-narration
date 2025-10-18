from typing import Dict, List, Literal, Optional
from pydantic import BaseModel

Gender = Literal['male', 'female', 'neutral', 'other']

class Character(BaseModel):
    voice_id: Optional[str] = None
    gender: Gender

class Dialogue(BaseModel):
    speaker: str
    voice_id: Optional[str] = None
    text: str
    timestamp: Optional[float] = None

class MangaScene(BaseModel):
    manga_title: str
    chapter_number: int
    page_id: str
    scene_title: str
    scene_description: Optional[str] = None
    ambient: Optional[str] = ''
    characters: Dict[str, Character]
    dialogue: List[Dialogue]

class ParseRequest(BaseModel):
    # flexible input: raw text from OCR or structured block
    manga_title: Optional[str] = None
    chapter_number: Optional[int] = None
    page_id: Optional[str] = None
    scene_title: Optional[str] = None
    ambient: Optional[str] = ''
    raw_text: Optional[str] = None
    # if client already extracted bubbles
    bubbles: Optional[List[Dict[str, str]]] = None

class ParseResponse(BaseModel):
    scene: MangaScene
