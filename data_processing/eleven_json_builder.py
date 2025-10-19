"""
JSON Builder for ElevenLabs-ready Output
Step 3: Combine scene data, enhanced dialogue, and voice assignments into final JSON
"""

import json
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime

from voice_registry import VoiceRegistry

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ElevenLabsJSONBuilder:
    """Builds ElevenLabs-ready JSON from processed manga data"""
    
    def __init__(self, voice_registry: VoiceRegistry = None):
        """
        Initialize JSON builder
        
        Args:
            voice_registry: Voice registry instance for voice assignments
        """
        self.voice_registry = voice_registry or VoiceRegistry()
        logger.info("ElevenLabs JSON Builder initialized")
    
    def build_eleven_json(self, 
                         page_data: Dict[str, Any], 
                         enhanced_dialogue: Dict[str, Any],
                         scene_title: str = None,
                         add_narrator: bool = True) -> Dict[str, Any]:
        """
        Step 3: Build final ElevenLabs-ready JSON
        
        Args:
            page_data: Original scene data from vision analysis
            enhanced_dialogue: Enhanced dialogue with audio tags
            scene_title: Optional scene title override
            add_narrator: Whether to add narrator dialogue
            
        Returns:
            ElevenLabs-ready JSON structure
        """
        try:
            logger.info(f"Building ElevenLabs JSON for page: {page_data.get('page_id', 'unknown')}")
            
            # Extract basic data
            page_id = page_data.get("page_id", "unknown")
            scene_description = page_data.get("scene", "No description available")
            ambient = page_data.get("ambient", "")
            characters = page_data.get("speaking_characters", [])
            dialogue_order = enhanced_dialogue.get("dialogue_order", [])
            
            # Build characters dictionary with voice assignments
            characters_dict = {}
            for char in characters:
                char_name = char["name"]
                voice_id = self.voice_registry.assign_voice(char_name)
                characters_dict[char_name] = {
                    "voice_id": voice_id,
                    "expression": char.get("expression", "neutral")
                }
            
            # Add narrator if requested
            if add_narrator:
                narrator_voice = self.voice_registry.assign_voice("Narrator", character_type="narrator")
                characters_dict["Narrator"] = {
                    "voice_id": narrator_voice,
                    "expression": "neutral"
                }
            
            # Build dialogue list with voice assignments
            dialogue_list = []
            
            # Add scene description as narrator dialogue if add_narrator is True
            if add_narrator and scene_description and "Narrator" in characters_dict:
                narrator_voice_id = characters_dict["Narrator"]["voice_id"]
                dialogue_list.append({
                    "speaker": "Narrator",
                    "voice_id": narrator_voice_id,
                    "text": f"[calm] {scene_description}",
                    "page_number": page_data.get("page_id", "unknown"),
                    "emotion": "neutral",
                    "confidence": "high"
                })
            
            # Add character dialogue
            for dialogue in dialogue_order:
                speaker = dialogue["speaker"]
                text = dialogue["text"]
                
                # Get voice assignment
                if speaker in characters_dict:
                    voice_id = characters_dict[speaker]["voice_id"]
                else:
                    # Assign voice for unknown character
                    voice_id = self.voice_registry.assign_voice(speaker)
                    characters_dict[speaker] = {
                        "voice_id": voice_id,
                        "expression": "neutral"
                    }
                
                dialogue_list.append({
                    "speaker": speaker,
                    "voice_id": voice_id,
                    "text": text,
                    "page_number": page_data.get("page_id", "unknown"),
                    "emotion": dialogue.get("emotion", "neutral"),
                    "confidence": dialogue.get("confidence", "medium")
                })
            
            # Build final JSON structure
            eleven_json = {
                "page_id": page_id,
                "scene_title": scene_title or self._generate_scene_title(scene_description),
                "ambient": ambient,
                "characters": characters_dict,
                "dialogue": dialogue_list,
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "total_dialogue_lines": len(dialogue_list),
                    "total_characters": len(characters_dict),
                    "has_narrator": add_narrator
                }
            }
            
            logger.info(f"Built ElevenLabs JSON with {len(dialogue_list)} dialogue lines and {len(characters_dict)} characters")
            return eleven_json
            
        except Exception as e:
            logger.error(f"Error building ElevenLabs JSON: {str(e)}")
            raise
    
    def _generate_scene_title(self, scene_description: str) -> str:
        """
        Generate a scene title from scene description
        
        Args:
            scene_description: Scene description text
            
        Returns:
            Generated scene title
        """
        if not scene_description:
            return "Untitled Scene"
        
        # Simple title generation - take first few words
        words = scene_description.split()[:4]
        title = " ".join(words)
        
        # Capitalize first letter
        if title:
            title = title[0].upper() + title[1:]
        
        return title
    
    def save_json(self, eleven_json: Dict[str, Any], output_dir: str = "scenes") -> str:
        """
        Save ElevenLabs JSON to file
        
        Args:
            eleven_json: ElevenLabs JSON data
            output_dir: Output directory for JSON files
            
        Returns:
            Path to saved JSON file
        """
        try:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            page_id = eleven_json.get("page_id", "unknown")
            json_filename = f"page_{page_id}.json"
            json_filepath = output_path / json_filename
            
            with open(json_filepath, 'w', encoding='utf-8') as f:
                json.dump(eleven_json, f, indent=2, ensure_ascii=False)
            
            logger.info(f"ElevenLabs JSON saved to: {json_filepath}")
            return str(json_filepath)
            
        except Exception as e:
            logger.error(f"Error saving ElevenLabs JSON: {str(e)}")
            raise
    
    def validate_json(self, eleven_json: Dict[str, Any]) -> bool:
        """
        Validate ElevenLabs JSON structure
        
        Args:
            eleven_json: JSON data to validate
            
        Returns:
            True if valid, False otherwise
        """
        required_fields = ["page_id", "scene_title", "characters", "dialogue"]
        
        for field in required_fields:
            if field not in eleven_json:
                logger.error(f"Missing required field: {field}")
                return False
        
        # Validate characters structure
        characters = eleven_json["characters"]
        if not isinstance(characters, dict):
            logger.error("Characters must be a dictionary")
            return False
        
        for char_name, char_data in characters.items():
            if not isinstance(char_data, dict) or "voice_id" not in char_data:
                logger.error(f"Invalid character data for {char_name}")
                return False
        
        # Validate dialogue structure
        dialogue = eleven_json["dialogue"]
        if not isinstance(dialogue, list):
            logger.error("Dialogue must be a list")
            return False
        
        for i, dialogue_item in enumerate(dialogue):
            if not isinstance(dialogue_item, dict):
                logger.error(f"Invalid dialogue item at index {i}")
                return False
            
            required_dialogue_fields = ["speaker", "voice_id", "text"]
            for field in required_dialogue_fields:
                if field not in dialogue_item:
                    logger.error(f"Missing dialogue field '{field}' at index {i}")
                    return False
        
        logger.info("ElevenLabs JSON validation passed")
        return True
    
    def get_json_summary(self, eleven_json: Dict[str, Any]) -> str:
        """
        Get summary of the ElevenLabs JSON
        
        Args:
            eleven_json: JSON data to summarize
            
        Returns:
            Summary string
        """
        characters = eleven_json.get("characters", {})
        dialogue = eleven_json.get("dialogue", [])
        
        # Count unique voices used
        unique_voices = set()
        for char_data in characters.values():
            unique_voices.add(char_data.get("voice_id", "unknown"))
        
        summary = f"""
ElevenLabs JSON Summary:
- Page ID: {eleven_json.get('page_id', 'unknown')}
- Scene Title: {eleven_json.get('scene_title', 'unknown')}
- Characters: {len(characters)}
- Dialogue Lines: {len(dialogue)}
- Unique Voices: {len(unique_voices)}
- Ambient: {eleven_json.get('ambient', 'none')}
        """
        return summary.strip()
    
    def export_voice_assignments(self, output_file: str = "voice_assignments.json"):
        """
        Export current voice assignments to a separate file
        
        Args:
            output_file: Path to export voice assignments
        """
        try:
            assignments = self.voice_registry.get_all_assignments()
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(assignments, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Voice assignments exported to: {output_file}")
        except Exception as e:
            logger.error(f"Error exporting voice assignments: {str(e)}")
    
    def load_voice_assignments(self, input_file: str):
        """
        Load voice assignments from a file
        
        Args:
            input_file: Path to voice assignments file
        """
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                assignments = json.load(f)
            
            # Update voice registry
            for char_name, char_data in assignments.items():
                voice_id = char_data.get("voice_id")
                if voice_id:
                    self.voice_registry.assign_voice(char_name, voice_id)
            
            logger.info(f"Voice assignments loaded from: {input_file}")
        except Exception as e:
            logger.error(f"Error loading voice assignments: {str(e)}")
