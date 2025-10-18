"""
Audio Tag Enhancement Module
Step 2: Enhance dialogue with ElevenLabs v3 audio tags using LLM
"""

import json
import logging
from typing import Dict, List, Any
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AudioTagEnhancer:
    """Handles enhancement of dialogue with ElevenLabs v3 audio tags"""
    
    def __init__(self, api_key: str = None, model_name: str = "gemini-2.5-flash"):
        """
        Initialize audio tag enhancer
        
        Args:
            api_key: Google AI API key
            model_name: Gemini model to use for text enhancement
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key not provided. Set GOOGLE_API_KEY environment variable.")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(model_name)
        
        # ElevenLabs v3 audio tags reference
        self.audio_tags_reference = """
        ElevenLabs v3 Audio Tags Reference:
        
        EMOTION TAGS:
        [happy], [sad], [angry], [excited], [calm], [confused], [surprised], [worried], [gentle], [serious]
        
        VOICE MODIFIERS:
        [whispers], [shouts], [screams], [laughs], [cries], [sighs], [gasps], [groans], [chuckles]
        
        PACING & RHYTHM:
        [slow], [fast], [pause], [short pause], [long pause], [breath], [inhale], [exhale]
        
        VOLUME & TONE:
        [softly], [loudly], [quietly], [firmly], [tenderly], [harshly], [warmly], [coldly]
        
        SPECIAL EFFECTS:
        [echo], [reverb], [telephone], [radio], [narrator], [monologue], [aside]
        
        RULES:
        1. NEVER remove or alter original words
        2. Tags can appear at start, middle, or end of dialogue
        3. Use tags sparingly - only when they add meaningful expression
        4. Match tags to the character's detected emotion
        5. Use [pause] for natural speech breaks
        6. Use [breath] for emotional moments
        """
        
        logger.info(f"Initialized Audio Tag Enhancer with model: {model_name}")
    
    def enhance_with_audio_tags(self, dialogue_json: Dict[str, Any]) -> Dict[str, Any]:
        """
        Step 2: Enhance dialogue with ElevenLabs v3 audio tags
        
        Args:
            dialogue_json: Scene data with dialogue_order
            
        Returns:
            Enhanced scene data with audio-tagged dialogue
        """
        try:
            logger.info("Enhancing dialogue with audio tags...")
            
            # Extract dialogue for enhancement
            dialogue_order = dialogue_json.get("dialogue_order", [])
            characters = dialogue_json.get("characters", [])
            
            if not dialogue_order:
                logger.warning("No dialogue found to enhance")
                return dialogue_json
            
            # Create character emotion mapping
            emotion_map = {char["name"]: char["expression"] for char in characters}
            
            # Enhance each dialogue line
            enhanced_dialogue = []
            for dialogue in dialogue_order:
                enhanced_line = self._enhance_single_dialogue(dialogue, emotion_map)
                enhanced_dialogue.append(enhanced_line)
            
            # Create enhanced result
            enhanced_result = dialogue_json.copy()
            enhanced_result["dialogue_order"] = enhanced_dialogue
            
            logger.info(f"Enhanced {len(enhanced_dialogue)} dialogue lines")
            return enhanced_result
            
        except Exception as e:
            logger.error(f"Error enhancing dialogue with audio tags: {str(e)}")
            raise
    
    def _enhance_single_dialogue(self, dialogue: Dict[str, Any], emotion_map: Dict[str, str]) -> Dict[str, Any]:
        """
        Enhance a single dialogue line with audio tags
        
        Args:
            dialogue: Single dialogue entry
            emotion_map: Character name to emotion mapping
            
        Returns:
            Enhanced dialogue entry
        """
        speaker = dialogue["speaker"]
        text = dialogue["text"]
        emotion = emotion_map.get(speaker, "neutral")
        
        # Create enhancement prompt
        enhancement_prompt = f"""
        Enhance this manga dialogue with ElevenLabs v3 audio tags:

        Speaker: {speaker}
        Emotion: {emotion}
        Original Text: "{text}"

        {self.audio_tags_reference}

        RULES:
        1. Keep ALL original words exactly as they are
        2. Add appropriate audio tags based on the emotion and context
        3. Use tags sparingly - only when they add meaningful expression
        4. Place tags naturally within or around the dialogue
        5. Consider the speaker's emotional state: {emotion}

        Return ONLY the enhanced dialogue text with audio tags, nothing else.
        Example: "[gentle] Are you crying? [short pause]"
        """
        
        try:
            # Get enhancement from LLM
            response = self.model.generate_content(enhancement_prompt)
            
            if not response.text:
                logger.warning(f"No enhancement received for: {text}")
                return dialogue
            
            enhanced_text = response.text.strip().strip('"')
            
            # Validate enhancement (should contain original text)
            if text.lower() not in enhanced_text.lower():
                logger.warning(f"Enhanced text doesn't contain original: {text}")
                return dialogue
            
            # Return enhanced dialogue
            enhanced_dialogue = dialogue.copy()
            enhanced_dialogue["text"] = enhanced_text
            
            return enhanced_dialogue
            
        except Exception as e:
            logger.error(f"Error enhancing dialogue '{text}': {str(e)}")
            return dialogue
    
    def validate_audio_tags(self, enhanced_text: str) -> bool:
        """
        Validate that audio tags are properly formatted
        
        Args:
            enhanced_text: Text with audio tags
            
        Returns:
            True if tags are valid, False otherwise
        """
        # Check for proper bracket formatting
        import re
        
        # Find all audio tags
        tags = re.findall(r'\[([^\]]+)\]', enhanced_text)
        
        # Valid tag patterns
        valid_patterns = [
            r'^(happy|sad|angry|excited|calm|confused|surprised|worried|gentle|serious)$',
            r'^(whispers|shouts|screams|laughs|cries|sighs|gasps|groans|chuckles)$',
            r'^(slow|fast|pause|short pause|long pause|breath|inhale|exhale)$',
            r'^(softly|loudly|quietly|firmly|tenderly|harshly|warmly|coldly)$',
            r'^(echo|reverb|telephone|radio|narrator|monologue|aside)$'
        ]
        
        for tag in tags:
            tag_valid = any(re.match(pattern, tag.strip()) for pattern in valid_patterns)
            if not tag_valid:
                logger.warning(f"Potentially invalid audio tag: [{tag}]")
        
        return True
    
    def get_enhancement_summary(self, original_dialogue: List[Dict], enhanced_dialogue: List[Dict]) -> str:
        """
        Get summary of enhancement results
        
        Args:
            original_dialogue: Original dialogue list
            enhanced_dialogue: Enhanced dialogue list
            
        Returns:
            Summary string
        """
        import re
        
        total_tags = 0
        for dialogue in enhanced_dialogue:
            tags = re.findall(r'\[([^\]]+)\]', dialogue["text"])
            total_tags += len(tags)
        
        summary = f"""
Audio Enhancement Summary:
- Lines Enhanced: {len(enhanced_dialogue)}
- Total Audio Tags Added: {total_tags}
- Average Tags per Line: {total_tags / len(enhanced_dialogue) if enhanced_dialogue else 0:.1f}
        """
        return summary.strip()
