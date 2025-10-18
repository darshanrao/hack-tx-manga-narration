"""
Vision + OCR Module for Manga Page Analysis
Step 1: Extract scene data, characters, dialogue, and emotions from manga pages
"""

import json
import logging
from typing import Dict, List, Any, Optional
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MangaVisionAnalyzer:
    """Handles vision analysis and OCR for manga pages using Gemini Vision"""
    
    def __init__(self, api_key: str = None, model_name: str = "gemini-1.5-pro"):
        """
        Initialize manga vision analyzer
        
        Args:
            api_key: Google AI API key
            model_name: Gemini model to use (recommend gemini-1.5-pro for vision)
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key not provided. Set GOOGLE_API_KEY environment variable.")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(model_name)
        
        logger.info(f"Initialized Manga Vision Analyzer with model: {model_name}")
    
    def extract_scene_data(self, image_path: str, page_id: str = None) -> Dict[str, Any]:
        """
        Step 1: Extract comprehensive scene data from manga page
        
        Args:
            image_path: Path to manga page image
            page_id: Optional page identifier
            
        Returns:
            Dictionary with scene data, characters, dialogue, and ambient context
        """
        try:
            # Load image
            image = Image.open(image_path)
            
            # Generate page_id if not provided
            if not page_id:
                page_id = os.path.splitext(os.path.basename(image_path))[0]
            
            logger.info(f"Analyzing manga page: {page_id}")
            
            # Create comprehensive analysis prompt
            analysis_prompt = """
            Analyze this manga page and extract the following information in JSON format:

            1. SCENE DESCRIPTION: Brief description of what's happening
            2. CHARACTERS: List all characters visible with their current emotional state
            3. DIALOGUE: Extract all text from speech bubbles in reading order (right to left, top to bottom)
            4. AMBIENT CONTEXT: Environmental sounds or atmosphere (wind, footsteps, etc.)

            IMPORTANT RULES:
            - Read dialogue RIGHT TO LEFT, TOP TO BOTTOM (manga reading order)
            - Identify each character's current emotion/expression
            - Extract ALL text from speech bubbles, sound effects, and narration
            - Include ambient environmental context
            - Be precise with character names and dialogue attribution

            Return ONLY valid JSON in this exact format:
            {
                "page_id": "string",
                "scene": "brief scene description",
                "characters": [
                    {"name": "character_name", "expression": "emotion_state"}
                ],
                "dialogue_order": [
                    {"speaker": "character_name", "text": "exact dialogue text"}
                ],
                "ambient": "environmental context"
            }
            """
            
            # Analyze with Gemini Vision
            logger.info("Running vision analysis...")
            response = self.model.generate_content([analysis_prompt, image])
            
            if not response.text:
                raise ValueError("No response received from vision model")
            
            # Parse JSON response
            try:
                # Clean response text (remove markdown formatting if present)
                response_text = response.text.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                
                scene_data = json.loads(response_text)
                
                # Add page_id if not present
                if "page_id" not in scene_data:
                    scene_data["page_id"] = page_id
                
                logger.info(f"Successfully extracted scene data for {page_id}")
                return scene_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.error(f"Raw response: {response.text}")
                raise ValueError(f"Invalid JSON response from vision model: {e}")
                
        except Exception as e:
            logger.error(f"Error analyzing manga page {image_path}: {str(e)}")
            raise
    
    def validate_scene_data(self, scene_data: Dict[str, Any]) -> bool:
        """
        Validate extracted scene data structure
        
        Args:
            scene_data: Scene data dictionary to validate
            
        Returns:
            True if valid, False otherwise
        """
        required_fields = ["page_id", "scene", "characters", "dialogue_order", "ambient"]
        
        for field in required_fields:
            if field not in scene_data:
                logger.error(f"Missing required field: {field}")
                return False
        
        # Validate characters structure
        if not isinstance(scene_data["characters"], list):
            logger.error("Characters must be a list")
            return False
        
        for char in scene_data["characters"]:
            if not isinstance(char, dict) or "name" not in char or "expression" not in char:
                logger.error("Invalid character structure")
                return False
        
        # Validate dialogue structure
        if not isinstance(scene_data["dialogue_order"], list):
            logger.error("Dialogue_order must be a list")
            return False
        
        for dialogue in scene_data["dialogue_order"]:
            if not isinstance(dialogue, dict) or "speaker" not in dialogue or "text" not in dialogue:
                logger.error("Invalid dialogue structure")
                return False
        
        return True
    
    def get_analysis_summary(self, scene_data: Dict[str, Any]) -> str:
        """
        Get a summary of the analysis results
        
        Args:
            scene_data: Scene data dictionary
            
        Returns:
            Formatted summary string
        """
        summary = f"""
Page Analysis Summary:
- Page ID: {scene_data.get('page_id', 'Unknown')}
- Scene: {scene_data.get('scene', 'No description')}
- Characters: {len(scene_data.get('characters', []))} detected
- Dialogue Lines: {len(scene_data.get('dialogue_order', []))}
- Ambient: {scene_data.get('ambient', 'None')}
        """
        return summary.strip()
