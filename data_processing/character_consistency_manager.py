"""
Character Consistency Manager
Manages character consistency and voice assignments across entire scenes/chapters
"""

import json
import logging
from typing import Dict, List, Any, Optional, Set
from pathlib import Path
from datetime import datetime
from collections import defaultdict

from voice_registry import VoiceRegistry

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CharacterConsistencyManager:
    """Manages character consistency across scenes and chapters"""
    
    def __init__(self, registry_file: str = "character_consistency.json"):
        """
        Initialize character consistency manager
        
        Args:
            registry_file: Path to character consistency registry file
        """
        self.registry_file = Path(registry_file)
        self.consistency_data = self._load_consistency_data()
        self.voice_registry = VoiceRegistry()
        
        logger.info("Character Consistency Manager initialized")
    
    def _load_consistency_data(self) -> Dict[str, Any]:
        """Load character consistency data from file"""
        try:
            if self.registry_file.exists():
                with open(self.registry_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                logger.info(f"Loaded character consistency data from {self.registry_file}")
                return data
            else:
                logger.info("No existing character consistency data found, creating new registry")
                return {
                    "scenes": {},
                    "characters": {},
                    "voice_assignments": {},
                    "consistency_rules": {}
                }
        except Exception as e:
            logger.error(f"Error loading character consistency data: {e}")
            return {
                "scenes": {},
                "characters": {},
                "voice_assignments": {},
                "consistency_rules": {}
            }
    
    def _save_consistency_data(self):
        """Save character consistency data to file"""
        try:
            self.registry_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.registry_file, 'w', encoding='utf-8') as f:
                json.dump(self.consistency_data, f, indent=2, ensure_ascii=False)
            logger.info(f"Character consistency data saved to {self.registry_file}")
        except Exception as e:
            logger.error(f"Error saving character consistency data: {e}")
    
    def register_scene_characters(self, scene_id: str, scene_analysis: Dict[str, Any]) -> Dict[str, str]:
        """
        Register characters from a scene analysis and assign consistent voices
        
        Args:
            scene_id: Unique scene identifier
            scene_analysis: Scene analysis data from SceneCharacterAnalyzer
            
        Returns:
            Dictionary mapping character names to voice IDs
        """
        try:
            logger.info(f"Registering characters for scene: {scene_id}")
            
            # Extract character information
            characters = scene_analysis["characters"]["all_characters"]
            character_consistency = scene_analysis["characters"]["consistency"]
            
            # Handle voice recommendations - may not exist in new analyzer
            voice_recommendations = scene_analysis.get("voice_assignment_recommendations", {})
            
            # Register scene
            self.consistency_data["scenes"][scene_id] = {
                "scene_id": scene_id,
                "total_pages": scene_analysis["total_pages"],
                "characters": characters,
                "registered_at": datetime.now().isoformat(),
                "character_count": len(characters)
            }
            
            # Process each character
            voice_assignments = {}
            for char_name in characters:
                char_data = character_consistency.get(char_name, {})
                recommended_voice = voice_recommendations.get(char_name, "Cameron")
                
                # Check if character already exists
                if char_name in self.consistency_data["characters"]:
                    # Character exists - maintain consistency
                    existing_voice = self.consistency_data["characters"][char_name]["voice_id"]
                    voice_assignments[char_name] = existing_voice
                    
                    # Update character data
                    self.consistency_data["characters"][char_name]["scenes"].append(scene_id)
                    self.consistency_data["characters"][char_name]["last_seen"] = datetime.now().isoformat()
                    
                    logger.info(f"Character '{char_name}' already exists with voice '{existing_voice}'")
                else:
                    # Detect gender for voice assignment
                    gender = self._detect_character_gender(char_name)
                    
                    # New character - assign voice
                    assigned_voice = self._assign_voice_to_character(char_name, char_data, recommended_voice, gender)
                    voice_assignments[char_name] = assigned_voice
                    
                    # Register new character
                    self.consistency_data["characters"][char_name] = {
                        "voice_id": assigned_voice,
                        "character_type": char_data.get("importance", "background"),
                        "gender": gender,
                        "first_seen": datetime.now().isoformat(),
                        "last_seen": datetime.now().isoformat(),
                        "scenes": [scene_id],
                        "appearance_count": char_data.get("appearance_count", 1),
                        "dominant_emotion": char_data.get("dominant_emotion", "neutral")
                    }
                    
                    logger.info(f"New character '{char_name}' assigned voice '{assigned_voice}'")
            
            # Update voice assignments
            self.consistency_data["voice_assignments"][scene_id] = voice_assignments
            
            # Save data
            self._save_consistency_data()
            
            logger.info(f"Registered {len(characters)} characters for scene '{scene_id}'")
            return voice_assignments
            
        except Exception as e:
            logger.error(f"Error registering scene characters: {str(e)}")
            raise
    
    def _detect_character_gender(self, char_name: str) -> str:
        """
        Detect character gender based on name patterns
        
        Args:
            char_name: Character name
            
        Returns:
            Gender: "male" or "female"
        """
        name_lower = char_name.lower()
        
        # Female name patterns
        if any(keyword in name_lower for keyword in ["mikasa", "mrs", "miss", "lady", "woman", "girl", "female", "mother", "sister", "daughter"]):
            return "female"
        
        # Default to male for unknown
        return "male"
    
    def _assign_voice_to_character(self, char_name: str, char_data: Dict[str, Any], recommended_voice: str, gender: str) -> str:
        """
        Assign voice to a character with consistency considerations
        
        Args:
            char_name: Character name
            char_data: Character data from analysis
            recommended_voice: Recommended voice from analysis
            gender: Character gender (male/female)
            
        Returns:
            Assigned voice ID
        """
        # Check for existing similar characters
        similar_characters = self._find_similar_characters(char_name, char_data)
        
        if similar_characters:
            # Use voice from most similar character
            most_similar = max(similar_characters, key=lambda x: x["similarity"])
            assigned_voice = most_similar["voice_id"]
            logger.info(f"Assigned voice '{assigned_voice}' to '{char_name}' based on similar character '{most_similar['name']}'")
        else:
            # Use recommended voice or assign new one based on gender
            assigned_voice = self.voice_registry.assign_voice(char_name, character_type=gender)
            logger.info(f"Assigned voice '{assigned_voice}' to '{char_name}' (gender: {gender})")
        
        return assigned_voice
    
    def _find_similar_characters(self, char_name: str, char_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Find characters similar to the given character
        
        Args:
            char_name: Character name
            char_data: Character data
            
        Returns:
            List of similar characters with similarity scores
        """
        similar_characters = []
        
        for existing_char, existing_data in self.consistency_data["characters"].items():
            similarity_score = self._calculate_character_similarity(char_name, char_data, existing_char, existing_data)
            
            if similarity_score > 0.7:  # Threshold for similarity
                similar_characters.append({
                    "name": existing_char,
                    "voice_id": existing_data["voice_id"],
                    "similarity": similarity_score
                })
        
        return similar_characters
    
    def _calculate_character_similarity(self, char1_name: str, char1_data: Dict[str, Any], 
                                     char2_name: str, char2_data: Dict[str, Any]) -> float:
        """
        Calculate similarity between two characters
        
        Args:
            char1_name: First character name
            char1_data: First character data
            char2_name: Second character name
            char2_data: Second character data
            
        Returns:
            Similarity score (0.0 to 1.0)
        """
        similarity_score = 0.0
        
        # Name similarity (simple string matching)
        if char1_name.lower() == char2_name.lower():
            similarity_score += 0.4
        elif char1_name.lower() in char2_name.lower() or char2_name.lower() in char1_name.lower():
            similarity_score += 0.2
        
        # Character type similarity
        char1_type = char1_data.get("importance", "background")
        char2_type = char2_data.get("character_type", "background")
        if char1_type == char2_type:
            similarity_score += 0.3
        
        # Emotional similarity
        char1_emotion = char1_data.get("dominant_emotion", "neutral")
        char2_emotion = char2_data.get("dominant_emotion", "neutral")
        if char1_emotion == char2_emotion:
            similarity_score += 0.2
        
        # Appearance count similarity
        char1_count = char1_data.get("appearance_count", 1)
        char2_count = char2_data.get("appearance_count", 1)
        count_ratio = min(char1_count, char2_count) / max(char1_count, char2_count)
        similarity_score += count_ratio * 0.1
        
        return min(similarity_score, 1.0)
    
    def get_character_voice(self, char_name: str, scene_id: str = None) -> Optional[str]:
        """
        Get voice assignment for a character
        
        Args:
            char_name: Character name
            scene_id: Optional scene ID for context
            
        Returns:
            Voice ID if assigned, None otherwise
        """
        if char_name in self.consistency_data["characters"]:
            return self.consistency_data["characters"][char_name]["voice_id"]
        
        # Check scene-specific assignments
        if scene_id and scene_id in self.consistency_data["voice_assignments"]:
            return self.consistency_data["voice_assignments"][scene_id].get(char_name)
        
        return None
    
    def get_scene_voice_assignments(self, scene_id: str) -> Dict[str, str]:
        """
        Get all voice assignments for a scene
        
        Args:
            scene_id: Scene identifier
            
        Returns:
            Dictionary mapping character names to voice IDs
        """
        return self.consistency_data["voice_assignments"].get(scene_id, {})
    
    def get_character_statistics(self) -> Dict[str, Any]:
        """
        Get character statistics across all scenes
        
        Returns:
            Character statistics
        """
        characters = self.consistency_data["characters"]
        scenes = self.consistency_data["scenes"]
        
        # Count characters by type
        character_types = defaultdict(int)
        for char_data in characters.values():
            character_types[char_data.get("character_type", "unknown")] += 1
        
        # Count voices used
        voices_used = set()
        for char_data in characters.values():
            voices_used.add(char_data.get("voice_id", "unknown"))
        
        return {
            "total_characters": len(characters),
            "total_scenes": len(scenes),
            "character_types": dict(character_types),
            "unique_voices_used": len(voices_used),
            "voices_list": list(voices_used),
            "most_appearing_character": self._get_most_appearing_character(),
            "voice_distribution": self._get_voice_distribution()
        }
    
    def _get_most_appearing_character(self) -> Optional[str]:
        """Get the character that appears in the most scenes"""
        if not self.consistency_data["characters"]:
            return None
        
        most_scenes = 0
        most_appearing = None
        
        for char_name, char_data in self.consistency_data["characters"].items():
            scene_count = len(char_data.get("scenes", []))
            if scene_count > most_scenes:
                most_scenes = scene_count
                most_appearing = char_name
        
        return most_appearing
    
    def _get_voice_distribution(self) -> Dict[str, int]:
        """Get distribution of characters per voice"""
        voice_distribution = defaultdict(int)
        
        for char_data in self.consistency_data["characters"].values():
            voice_id = char_data.get("voice_id", "unknown")
            voice_distribution[voice_id] += 1
        
        return dict(voice_distribution)
    
    def export_consistency_report(self, output_file: str = "character_consistency_report.json"):
        """
        Export a comprehensive character consistency report
        
        Args:
            output_file: Path to export the report
        """
        try:
            report = {
                "generated_at": datetime.now().isoformat(),
                "statistics": self.get_character_statistics(),
                "scenes": self.consistency_data["scenes"],
                "characters": self.consistency_data["characters"],
                "voice_assignments": self.consistency_data["voice_assignments"]
            }
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Character consistency report exported to: {output_file}")
        except Exception as e:
            logger.error(f"Error exporting consistency report: {str(e)}")
    
    def get_consistency_summary(self) -> str:
        """
        Get a summary of character consistency
        
        Returns:
            Formatted summary string
        """
        stats = self.get_character_statistics()
        
        summary = f"""
Character Consistency Summary:
- Total Characters: {stats['total_characters']}
- Total Scenes: {stats['total_scenes']}
- Unique Voices Used: {stats['unique_voices_used']}
- Most Appearing Character: {stats['most_appearing_character'] or 'None'}
- Character Types: {stats['character_types']}
- Voice Distribution: {stats['voice_distribution']}
        """
        return summary.strip()
