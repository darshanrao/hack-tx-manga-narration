"""
Scene-Level Character Analyzer
Analyzes all pages in a scene/chapter to understand character consistency and assign voices
"""

import json
import logging
from typing import Dict, List, Any, Set, Optional
from pathlib import Path
from collections import defaultdict, Counter
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SceneCharacterAnalyzer:
    """Analyzes all pages in a scene to understand character consistency"""
    
    def __init__(self, api_key: str = None, model_name: str = "gemini-2.5-pro"):
        """
        Initialize scene character analyzer
        
        Args:
            api_key: Google AI API key
            model_name: Gemini model to use
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key not provided. Set GOOGLE_API_KEY environment variable.")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(model_name)
        
        logger.info(f"Scene Character Analyzer initialized with model: {model_name}")
    
    def analyze_scene_characters(self, page_images: List[str], scene_id: str = None) -> Dict[str, Any]:
        """
        Analyze all pages in a scene to understand character consistency
        
        Args:
            page_images: List of image paths for all pages in the scene
            scene_id: Optional scene identifier
            
        Returns:
            Scene analysis with character consistency information
        """
        try:
            if not scene_id:
                scene_id = f"scene_{len(page_images)}_pages"
            
            logger.info(f"Analyzing scene '{scene_id}' with {len(page_images)} pages")
            
            # Step 1: Analyze each page individually
            page_analyses = []
            all_characters = set()
            character_appearances = defaultdict(list)
            
            for i, image_path in enumerate(page_images):
                logger.info(f"Analyzing page {i+1}/{len(page_images)}: {Path(image_path).name}")
                
                page_analysis = self._analyze_single_page(image_path, i+1)
                page_analyses.append(page_analysis)
                
                # Collect character information
                for char in page_analysis.get("characters", []):
                    char_name = char["name"]
                    all_characters.add(char_name)
                    character_appearances[char_name].append({
                        "page": i+1,
                        "expression": char.get("expression", "neutral"),
                        "context": page_analysis.get("scene", "")
                    })
            
            # Step 2: Character consistency analysis
            character_consistency = self._analyze_character_consistency(character_appearances)
            
            # Step 3: Generate scene-level summary
            scene_summary = self._generate_scene_summary(page_analyses, character_consistency)
            
            # Step 4: Compile final scene analysis
            scene_analysis = {
                "scene_id": scene_id,
                "total_pages": len(page_images),
                "page_analyses": page_analyses,
                "characters": {
                    "all_characters": list(all_characters),
                    "character_count": len(all_characters),
                    "appearances": dict(character_appearances),
                    "consistency": character_consistency
                },
                "scene_summary": scene_summary,
                "voice_assignment_recommendations": self._generate_voice_recommendations(character_consistency)
            }
            
            logger.info(f"Scene analysis complete: {len(all_characters)} unique characters found")
            return scene_analysis
            
        except Exception as e:
            logger.error(f"Error analyzing scene characters: {str(e)}")
            raise
    
    def _analyze_single_page(self, image_path: str, page_number: int) -> Dict[str, Any]:
        """
        Analyze a single page for character information
        
        Args:
            image_path: Path to page image
            page_number: Page number in the scene
            
        Returns:
            Page analysis data
        """
        from PIL import Image
        
        try:
            # Load image
            image = Image.open(image_path)
            
            # Create character-focused analysis prompt
            analysis_prompt = f"""
            Analyze this manga page (page {page_number}) and extract character information:

            1. CHARACTERS: List all characters visible with their current emotional state
            2. SCENE CONTEXT: Brief description of what's happening
            3. DIALOGUE: Extract all text from speech bubbles in reading order (right to left, top to bottom)
            4. CHARACTER INTERACTIONS: How characters relate to each other in this page

            IMPORTANT RULES:
            - Be consistent with character names across pages
            - Identify each character's current emotion/expression
            - Extract ALL text from speech bubbles
            - Note character relationships and interactions

            Return ONLY valid JSON in this exact format:
            {{
                "page_number": {page_number},
                "scene": "brief scene description",
                "characters": [
                    {{"name": "character_name", "expression": "emotion_state", "role": "main/supporting/background"}}
                ],
                "dialogue_order": [
                    {{"speaker": "character_name", "text": "exact dialogue text"}}
                ],
                "character_interactions": [
                    {{"character1": "name", "character2": "name", "interaction": "description"}}
                ]
            }}
            """
            
            # Analyze with Gemini Vision
            response = self.model.generate_content([analysis_prompt, image])
            
            if not response.text:
                raise ValueError("No response received from vision model")
            
            # Parse JSON response
            try:
                response_text = response.text.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                
                page_analysis = json.loads(response_text)
                return page_analysis
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response for page {page_number}: {e}")
                # Return minimal structure if parsing fails
                return {
                    "page_number": page_number,
                    "scene": "Analysis failed",
                    "characters": [],
                    "dialogue_order": [],
                    "character_interactions": []
                }
                
        except Exception as e:
            logger.error(f"Error analyzing page {page_number}: {str(e)}")
            return {
                "page_number": page_number,
                "scene": "Analysis failed",
                "characters": [],
                "dialogue_order": [],
                "character_interactions": []
            }
    
    def _analyze_character_consistency(self, character_appearances: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """
        Analyze character consistency across pages
        
        Args:
            character_appearances: Character appearance data
            
        Returns:
            Character consistency analysis
        """
        consistency_analysis = {}
        
        for char_name, appearances in character_appearances.items():
            # Count appearances
            appearance_count = len(appearances)
            
            # Analyze emotional range
            emotions = [app.get("expression", "neutral") for app in appearances]
            emotion_counter = Counter(emotions)
            dominant_emotion = emotion_counter.most_common(1)[0][0] if emotion_counter else "neutral"
            
            # Determine character importance
            if appearance_count >= len(appearances) * 0.7:  # Appears in 70%+ of pages
                importance = "main"
            elif appearance_count >= len(appearances) * 0.3:  # Appears in 30%+ of pages
                importance = "supporting"
            else:
                importance = "background"
            
            # Analyze character arc
            first_appearance = min(appearances, key=lambda x: x["page"])
            last_appearance = max(appearances, key=lambda x: x["page"])
            
            consistency_analysis[char_name] = {
                "appearance_count": appearance_count,
                "appearance_percentage": (appearance_count / len(appearances)) * 100,
                "dominant_emotion": dominant_emotion,
                "emotional_range": list(emotion_counter.keys()),
                "importance": importance,
                "first_appearance_page": first_appearance["page"],
                "last_appearance_page": last_appearance["page"],
                "character_arc": self._analyze_character_arc(appearances)
            }
        
        return consistency_analysis
    
    def _analyze_character_arc(self, appearances: List[Dict]) -> str:
        """
        Analyze character emotional arc across pages
        
        Args:
            appearances: List of character appearances
            
        Returns:
            Description of character arc
        """
        if len(appearances) < 2:
            return "single appearance"
        
        emotions = [app.get("expression", "neutral") for app in appearances]
        
        # Simple arc analysis
        if emotions[0] == emotions[-1]:
            return "stable"
        elif emotions[-1] in ["happy", "excited", "confident"]:
            return "positive development"
        elif emotions[-1] in ["sad", "angry", "worried"]:
            return "negative development"
        else:
            return "complex development"
    
    def _generate_scene_summary(self, page_analyses: List[Dict], character_consistency: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate scene-level summary
        
        Args:
            page_analyses: List of page analyses
            character_consistency: Character consistency data
            
        Returns:
            Scene summary
        """
        # Collect all dialogue
        all_dialogue = []
        for page in page_analyses:
            all_dialogue.extend(page.get("dialogue_order", []))
        
        # Analyze scene progression
        scene_progression = []
        for page in page_analyses:
            scene_progression.append({
                "page": page.get("page_number", 0),
                "scene": page.get("scene", ""),
                "dialogue_count": len(page.get("dialogue_order", []))
            })
        
        return {
            "total_dialogue_lines": len(all_dialogue),
            "scene_progression": scene_progression,
            "main_characters": [char for char, data in character_consistency.items() if data["importance"] == "main"],
            "supporting_characters": [char for char, data in character_consistency.items() if data["importance"] == "supporting"],
            "background_characters": [char for char, data in character_consistency.items() if data["importance"] == "background"]
        }
    
    def _generate_voice_recommendations(self, character_consistency: Dict[str, Any]) -> Dict[str, str]:
        """
        Generate voice assignment recommendations based on character analysis
        
        Args:
            character_consistency: Character consistency data
            
        Returns:
            Voice assignment recommendations
        """
        recommendations = {}
        
        # Male voices
        male_voices = [
            "5kMbtRSEKIkRZSdXxrZg",
            "wI49R6YUU5NNP1h0CECc", 
            "vBKc2FfBKJfcZNyEt1n6",
            "FIsP50cHv9JY47BkNVR7",
            "s0XGIcqmceN2l7kjsqoZ"
        ]
        
        # Female voices
        female_voices = [
            "CaT0A6YBELRBgT6Qa2lH",
            "bMxLr8fP6hzNRRi9nJxU",
            "Bn9xWp6PwkrqKRbq8cX2", 
            "iNwc1Lv2YQLywnCvjfn1",
            "uYXf8XasLslADfZ2MB4u"
        ]
        
        male_voice_index = 0
        female_voice_index = 0
        
        # Assign voices based on gender detection
        for char_name, char_data in character_consistency.items():
            # Simple gender detection based on name patterns
            name_lower = char_name.lower()
            
            # Female name patterns
            if any(keyword in name_lower for keyword in ["mikasa", "mrs", "miss", "lady", "woman", "girl", "female", "mother", "sister", "daughter"]):
                voice_id = female_voices[female_voice_index % len(female_voices)]
                female_voice_index += 1
            else:
                # Default to male for unknown
                voice_id = male_voices[male_voice_index % len(male_voices)]
                male_voice_index += 1
            
            recommendations[char_name] = voice_id
        
        return recommendations
    
    def get_character_summary(self, scene_analysis: Dict[str, Any]) -> str:
        """
        Get a summary of character analysis
        
        Args:
            scene_analysis: Scene analysis data
            
        Returns:
            Formatted summary string
        """
        characters = scene_analysis["characters"]
        summary = scene_analysis["scene_summary"]
        
        summary_text = f"""
Scene Character Analysis Summary:
- Scene ID: {scene_analysis['scene_id']}
- Total Pages: {scene_analysis['total_pages']}
- Total Characters: {characters['character_count']}
- Main Characters: {len(summary['main_characters'])} ({', '.join(summary['main_characters'])})
- Supporting Characters: {len(summary['supporting_characters'])} ({', '.join(summary['supporting_characters'])})
- Background Characters: {len(summary['background_characters'])} ({', '.join(summary['background_characters'])})
- Total Dialogue Lines: {summary['total_dialogue_lines']}
        """
        return summary_text.strip()
