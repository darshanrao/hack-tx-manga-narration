"""
Voice Registry Management System
Manages character-to-voice mapping for consistent voice assignment across pages
"""

import json
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VoiceRegistry:
    """Manages persistent voice assignments for characters"""
    
    def __init__(self, registry_file: str = "voice_registry.json"):
        """
        Initialize voice registry
        
        Args:
            registry_file: Path to voice registry JSON file
        """
        self.registry_file = Path(registry_file)
        self.registry = self._load_registry()
        
        # ElevenLabs voice IDs - Male voices
        self.male_voices = [
            "5kMbtRSEKIkRZSdXxrZg",
            "wI49R6YUU5NNP1h0CECc", 
            "vBKc2FfBKJfcZNyEt1n6",
            "FIsP50cHv9JY47BkNVR7",
            "s0XGIcqmceN2l7kjsqoZ"
        ]
        
        # ElevenLabs voice IDs - Female voices
        self.female_voices = [
            "CaT0A6YBELRBgT6Qa2lH",
            "bMxLr8fP6hzNRRi9nJxU",
            "Bn9xWp6PwkrqKRbq8cX2",
            "iNwc1Lv2YQLywnCvjfn1",
            "uYXf8XasLslADfZ2MB4u"
        ]
        
        # Voice assignment tracking
        self.male_voice_index = 0
        self.female_voice_index = 0
        
        logger.info(f"Voice Registry initialized with {len(self.registry)} existing assignments")
    
    def _load_registry(self) -> Dict[str, Any]:
        """Load voice registry from file"""
        try:
            if self.registry_file.exists():
                with open(self.registry_file, 'r', encoding='utf-8') as f:
                    registry = json.load(f)
                logger.info(f"Loaded voice registry from {self.registry_file}")
                return registry
            else:
                logger.info("No existing voice registry found, creating new one")
                return {"characters": {}, "voice_usage": {}}
        except Exception as e:
            logger.error(f"Error loading voice registry: {e}")
            return {"characters": {}, "voice_usage": {}}
    
    def _save_registry(self):
        """Save voice registry to file"""
        try:
            self.registry_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.registry_file, 'w', encoding='utf-8') as f:
                json.dump(self.registry, f, indent=2, ensure_ascii=False)
            logger.info(f"Voice registry saved to {self.registry_file}")
        except Exception as e:
            logger.error(f"Error saving voice registry: {e}")
    
    def assign_voice(self, character_name: str, voice_id: str = None, character_type: str = None) -> str:
        """
        Assign or retrieve voice for a character
        
        Args:
            character_name: Name of the character
            voice_id: Specific voice ID to assign (optional)
            character_type: Type hint for automatic assignment (male, female, narrator)
            
        Returns:
            Assigned voice ID
        """
        # Check if character already has a voice assigned
        if character_name in self.registry["characters"]:
            voice_id = self.registry["characters"][character_name]["voice_id"]
            logger.info(f"Character '{character_name}' already assigned voice: {voice_id}")
            return voice_id
        
        # Auto-assign voice if not specified
        if not voice_id:
            voice_id = self._auto_assign_voice(character_name, character_type)
        
        # Assign the voice
        self.registry["characters"][character_name] = {
            "voice_id": voice_id,
            "character_type": character_type or "unknown",
            "first_seen": self._get_timestamp()
        }
        
        # Update voice usage statistics
        if voice_id not in self.registry["voice_usage"]:
            self.registry["voice_usage"][voice_id] = {"count": 0, "characters": []}
        
        self.registry["voice_usage"][voice_id]["count"] += 1
        self.registry["voice_usage"][voice_id]["characters"].append(character_name)
        
        # Save registry
        self._save_registry()
        
        logger.info(f"Assigned voice '{voice_id}' to character '{character_name}'")
        return voice_id
    
    def _auto_assign_voice(self, character_name: str, character_type: str = None) -> str:
        """
        Automatically assign voice based on character type or name analysis
        
        Args:
            character_name: Name of the character
            character_type: Character type hint (male, female, narrator)
            
        Returns:
            Assigned voice ID
        """
        # Use provided character type
        if character_type == "male":
            voice_id = self.male_voices[self.male_voice_index % len(self.male_voices)]
            self.male_voice_index += 1
            return voice_id
        elif character_type == "female":
            voice_id = self.female_voices[self.female_voice_index % len(self.female_voices)]
            self.female_voice_index += 1
            return voice_id
        elif character_type == "narrator":
            return self.male_voices[0]  # Use first male voice for narrator
        
        # Analyze character name for gender hints
        name_lower = character_name.lower()
        
        # Female name patterns
        if any(keyword in name_lower for keyword in ["mikasa", "mrs", "miss", "lady", "woman", "girl", "female", "mother", "sister", "daughter"]):
            voice_id = self.female_voices[self.female_voice_index % len(self.female_voices)]
            self.female_voice_index += 1
            return voice_id
        
        # Male name patterns or default to male
        else:
            voice_id = self.male_voices[self.male_voice_index % len(self.male_voices)]
            self.male_voice_index += 1
            return voice_id
    
    def get_voice(self, character_name: str) -> Optional[str]:
        """
        Get assigned voice for a character
        
        Args:
            character_name: Name of the character
            
        Returns:
            Voice ID if assigned, None otherwise
        """
        if character_name in self.registry["characters"]:
            return self.registry["characters"][character_name]["voice_id"]
        return None
    
    def get_all_assignments(self) -> Dict[str, Any]:
        """
        Get all voice assignments
        
        Returns:
            Dictionary with all character voice assignments
        """
        return self.registry["characters"].copy()
    
    def get_voice_statistics(self) -> Dict[str, Any]:
        """
        Get voice usage statistics
        
        Returns:
            Dictionary with voice usage statistics
        """
        return {
            "total_characters": len(self.registry["characters"]),
            "total_voices_used": len(self.registry["voice_usage"]),
            "voice_usage": self.registry["voice_usage"].copy()
        }
    
    def reassign_voice(self, character_name: str, new_voice_id: str):
        """
        Reassign voice for an existing character
        
        Args:
            character_name: Name of the character
            new_voice_id: New voice ID to assign
        """
        if character_name not in self.registry["characters"]:
            logger.warning(f"Character '{character_name}' not found in registry")
            return
        
        old_voice_id = self.registry["characters"][character_name]["voice_id"]
        
        # Update character assignment
        self.registry["characters"][character_name]["voice_id"] = new_voice_id
        self.registry["characters"][character_name]["last_updated"] = self._get_timestamp()
        
        # Update voice usage statistics
        if old_voice_id in self.registry["voice_usage"]:
            self.registry["voice_usage"][old_voice_id]["count"] -= 1
            if character_name in self.registry["voice_usage"][old_voice_id]["characters"]:
                self.registry["voice_usage"][old_voice_id]["characters"].remove(character_name)
        
        if new_voice_id not in self.registry["voice_usage"]:
            self.registry["voice_usage"][new_voice_id] = {"count": 0, "characters": []}
        
        self.registry["voice_usage"][new_voice_id]["count"] += 1
        self.registry["voice_usage"][new_voice_id]["characters"].append(character_name)
        
        # Save registry
        self._save_registry()
        
        logger.info(f"Reassigned character '{character_name}' from '{old_voice_id}' to '{new_voice_id}'")
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def export_registry(self, export_path: str):
        """
        Export voice registry to a different location
        
        Args:
            export_path: Path to export the registry
        """
        try:
            export_file = Path(export_path)
            export_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(export_file, 'w', encoding='utf-8') as f:
                json.dump(self.registry, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Voice registry exported to {export_path}")
        except Exception as e:
            logger.error(f"Error exporting voice registry: {e}")
    
    def import_registry(self, import_path: str):
        """
        Import voice registry from a different location
        
        Args:
            import_path: Path to import the registry from
        """
        try:
            import_file = Path(import_path)
            if not import_file.exists():
                logger.error(f"Import file not found: {import_path}")
                return
            
            with open(import_file, 'r', encoding='utf-8') as f:
                imported_registry = json.load(f)
            
            # Merge with existing registry
            self.registry["characters"].update(imported_registry.get("characters", {}))
            self.registry["voice_usage"].update(imported_registry.get("voice_usage", {}))
            
            # Save merged registry
            self._save_registry()
            
            logger.info(f"Voice registry imported from {import_path}")
        except Exception as e:
            logger.error(f"Error importing voice registry: {e}")
