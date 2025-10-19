#!/usr/bin/env python3
"""
Two-Pass Hybrid Scene Character Analyzer - Solves Both Issues
Pass 1: All pages together for character identification
Pass 2: Individual pages with character context
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
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TwoPassHybridAnalyzer:
    """Two-pass approach: character identification + individual dialogue extraction"""
    
    def __init__(self, api_key: str = None, pass1_model: str = "gemini-2.0-flash", pass2_model: str = "gemini-2.5-pro"):
        """
        Initialize two-pass hybrid analyzer with different models for each pass
        
        Args:
            api_key: Google AI API key
            pass1_model: Gemini model for Pass 1 (character identification) - default: gemini-2.0-flash
            pass2_model: Gemini model for Pass 2 (dialogue extraction) - default: gemini-2.5-pro
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key not provided. Set GOOGLE_API_KEY environment variable.")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.pass1_model = genai.GenerativeModel(pass1_model)  # Fast model for character identification
        self.pass2_model = genai.GenerativeModel(pass2_model)  # Powerful model for dialogue extraction
        
        logger.info(f"Two-Pass Hybrid Analyzer initialized with Pass 1 model: {pass1_model}, Pass 2 model: {pass2_model}")
    
    def analyze_scene_characters(self, page_images: List[str], scene_id: str = None) -> Dict[str, Any]:
        """
        Analyze scene using two-pass approach
        
        Args:
            page_images: List of image paths for all pages in the scene
            scene_id: Optional scene identifier
            
        Returns:
            Scene analysis with character consistency information
        """
        try:
            if not scene_id:
                scene_id = f"scene_{len(page_images)}_pages"
            
            logger.info(f"Analyzing scene '{scene_id}' with {len(page_images)} pages (TWO-PASS APPROACH)")
            
            # PASS 1: Analyze all pages together for character identification
            logger.info("PASS 1: Analyzing all pages together for character identification...")
            character_context = self._pass1_character_identification(page_images, scene_id)
            
            # PASS 2: Process each page individually with character context
            logger.info("PASS 2: Processing each page individually with character context...")
            individual_analyses = self._pass2_individual_dialogue_extraction(page_images, character_context)
            
            # Build final scene analysis
            scene_analysis = self._build_final_scene_analysis(individual_analyses, character_context, scene_id)
            
            logger.info(f"Scene analysis complete: {scene_analysis['characters']['character_count']} unique characters found")
            
            return scene_analysis
            
        except Exception as e:
            logger.error(f"Error analyzing scene characters: {str(e)}")
            raise
    
    def _pass1_character_identification(self, page_images: List[str], scene_id: str) -> Dict[str, Any]:
        """
        PASS 1: Analyze all pages together to identify characters consistently
        
        Args:
            page_images: List of image paths for all pages in the scene
            scene_id: Scene identifier
            
        Returns:
            Character identification context
        """
        
        # Load all images
        images = []
        for image_path in page_images:
            if Path(image_path).exists():
                with open(image_path, 'rb') as f:
                    image_data = f.read()
                images.append({
                    "mime_type": "image/png",
                    "data": image_data
                })
                logger.info(f"Loaded: {Path(image_path).name}")
            else:
                logger.warning(f"Image not found: {image_path}")
        
        if not images:
            raise ValueError("No images found to analyze")
        
        # Create focused prompt for character identification only
        prompt = f"""
        Analyze these {len(page_images)} manga pages together to identify characters consistently across all pages.

        CRITICAL CHARACTER IDENTIFICATION RULES:
        1. TRY TO IDENTIFY ACTUAL CHARACTER NAMES from the manga (e.g., "Eren", "Mikasa", "Hannes")
        2. ONLY use generic names (Person A, Person B, Person C) if you cannot identify the actual character
        3. MAIN TASK: Identify the SAME character with the SAME identifier across ALL pages
        4. Use visual features to identify characters consistently (hair color, clothing, facial features)
        5. Focus on characters who speak (have dialogue) across the pages
        6. Ignore background characters without dialogue
        7. DISTINGUISH between speaking characters and sound effects/onomatopoeia
        8. Sound effects like "SNIFF", "fwOOO", "THUD" are NOT characters - they are environmental sounds

        Return ONLY valid JSON in this exact format:
        {{
            "character_identification": {{
                "total_unique_characters": 0,
                "characters": [
                    {{
                        "name": "Character_A",
                        "appears_in_pages": [1, 2, 3],
                        "visual_description": "consistent visual features across all pages",
                        "gender_hint": "male/female/unknown",
                        "importance": "main/supporting/background"
                    }}
                ]
            }},
            "character_consistency_rules": {{
                "Character_A": "Use this exact name for this character across all pages",
                "Character_B": "Use this exact name for this character across all pages"
            }}
        }}

        Focus ONLY on:
        - Character identification across pages
        - Visual consistency
        - Speaking characters only
        - Generic naming (Character_A, Character_B, etc.)
        """
        
        try:
            logger.info(f"PASS 1: Sending all {len(page_images)} pages to Gemini for character identification...")
            
            # Send all images together using Pass 1 model (fast Flash)
            response = self.pass1_model.generate_content([prompt] + images)
            
            if not response.text:
                raise ValueError("No response received from Gemini in Pass 1")
            
            # Parse response
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            result = json.loads(response_text)
            
            logger.info(f"PASS 1: Character identification complete - {result['character_identification']['total_unique_characters']} characters identified")
            return result
            
        except Exception as e:
            logger.error(f"Error in Pass 1 character identification: {str(e)}")
            raise
    
    def _pass2_individual_dialogue_extraction(self, page_images: List[str], character_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        PASS 2: Process each page individually with character context for accurate dialogue
        
        Args:
            page_images: List of image paths for all pages in the scene
            character_context: Character identification from Pass 1
            
        Returns:
            List of individual page analyses with accurate dialogue
        """
        
        # Extract character consistency rules
        character_rules = character_context.get("character_consistency_rules", {})
        character_list = character_context.get("character_identification", {}).get("characters", [])
        
        # Build character context string for the prompt
        character_context_str = "CHARACTER IDENTIFICATION CONTEXT:\n"
        for char in character_list:
            char_name = char.get("name", "")
            pages = char.get("appears_in_pages", [])
            visual_desc = char.get("visual_description", "")
            gender = char.get("gender_hint", "unknown")
            character_context_str += f"- {char_name}: appears in pages {pages}, {visual_desc}, gender: {gender}\n"
        
        character_context_str += "\nCRITICAL: Use these EXACT character names when they appear on pages.\n"
        
        individual_analyses = []
        
        for i, image_path in enumerate(page_images):
            page_number = i + 1
            logger.info(f"PASS 2: Analyzing page {page_number}/{len(page_images)}: {Path(image_path).name}")
            
            page_analysis = self._analyze_single_page_with_context(
                image_path, page_number, character_context_str, character_rules
            )
            individual_analyses.append(page_analysis)
        
        logger.info(f"PASS 2: Individual dialogue extraction complete for {len(page_images)} pages")
        return individual_analyses
    
    def _analyze_single_page_with_context(self, image_path: str, page_number: int, character_context: str, character_rules: Dict[str, str]) -> Dict[str, Any]:
        """
        Analyze a single page with character context for accurate dialogue extraction
        
        Args:
            image_path: Path to the image file
            page_number: Page number
            character_context: Character identification context from Pass 1
            character_rules: Character consistency rules
            
        Returns:
            Page analysis with accurate dialogue
        """
        
        # Load image
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        # Create focused prompt for single page with character context
        prompt = f"""
        Analyze this manga page (page {page_number}) and extract dialogue information using the character context provided.

        {character_context}

        CRITICAL SPEAKER IDENTIFICATION RULES:
        1. CAREFULLY examine each speech bubble to identify WHO is actually speaking
        2. Look at the speech bubble's position, tail direction, and visual connection to characters
        3. PAY SPECIAL ATTENTION to speech bubble tails - they point to the character who is speaking
        4. If multiple speech bubbles are connected or sequential, they likely belong to the SAME speaker
        5. Use the EXACT character names from the context above (try to identify actual names like "Eren", "Mikasa", "Hannes")
        6. Extract ALL dialogue text from speech bubbles in reading order (right to left, top to bottom)
        7. Provide detailed emotion analysis with confidence levels for each dialogue line
        8. Include visual cues (facial expressions, body language) for emotion detection
        9. Provide ambient context (environmental sounds, atmosphere)
        10. Focus on speaking characters only
        11. DOUBLE-CHECK speaker attribution by examining speech bubble connections to characters

        SOUND EFFECTS AND ONOMATOPOEIA RULES:
        1. Onomatopoeia (sound effects) like "SNIFF", "fwOOO", "THUD", "CRASH" should be treated as SOUND EFFECTS
        2. Sound effects should be placed in [brackets] format: "[SNIFF]", "[fwOOO]", "[THUD]"
        3. Sound effects should have speaker: "Sound Effect" and NOT be attributed to characters
        4. Only actual spoken dialogue should be attributed to characters
        5. Distinguish between character dialogue and environmental sound effects

        Emotion categories to consider:
        - happy, excited, joyful, cheerful, delighted
        - sad, depressed, melancholy, tearful, sorrowful
        - angry, furious, enraged, frustrated, irritated
        - surprised, shocked, amazed, startled, bewildered
        - fearful, scared, terrified, anxious, worried
        - calm, peaceful, serene, relaxed, composed
        - confused, puzzled, bewildered, uncertain
        - determined, resolute, focused, serious
        - sarcastic, mocking, dismissive, condescending
        - curious, interested, questioning, intrigued
        - embarrassed, ashamed, guilty, sheepish
        - proud, confident, arrogant, smug
        - neutral, expressionless, blank, stoic

        Return ONLY valid JSON in this exact format:
        {{
            "page_number": {page_number},
            "scene": "brief description of what's happening",
            "speaking_characters": [
                {{"name": "Character_A", "expression": "detailed emotional state", "visual_cues": "facial expression, body language", "dialogue_count": number_of_speech_bubbles}}
            ],
            "dialogue_order": [
                {{"speaker": "Character_A", "text": "exact dialogue text", "emotion": "primary emotion", "confidence": "high/medium/low", "visual_analysis": "what you see in the image"}},
                {{"speaker": "Sound Effect", "text": "[SNIFF]", "emotion": "neutral", "confidence": "high", "visual_analysis": "onomatopoeia sound effect"}}
            ],
            "ambient": "environmental context and atmosphere"
        }}

        EXAMPLES OF CORRECT FORMATTING:
        - Character dialogue: {{"speaker": "Eren", "text": "I will destroy all Titans!", "emotion": "determined"}}
        - Sound effects: {{"speaker": "Sound Effect", "text": "[SNIFF]", "emotion": "neutral"}}
        - Sound effects: {{"speaker": "Sound Effect", "text": "[fwOOO]", "emotion": "neutral"}}
        - Sound effects: {{"speaker": "Sound Effect", "text": "[THUD]", "emotion": "neutral"}}

        Focus on:
        - CAREFULLY identifying WHO is speaking in each speech bubble (examine bubble position and tail direction)
        - Using EXACT character names from context (prefer actual names like Eren, Mikasa, Hannes)
        - Separating character dialogue from sound effects/onomatopoeia
        - Putting sound effects in [brackets] format with speaker: "Sound Effect"
        - Accurate dialogue extraction from speech bubbles in right-to-left reading order
        - Detailed emotion detection based on visual cues
        - Comprehensive analysis for audio narration generation
        """
        
        try:
            # Send single page using Pass 2 model (powerful Pro)
            response = self.pass2_model.generate_content([
                prompt,
                {
                    "mime_type": "image/png",
                    "data": image_data
                }
            ])
            
            if not response.text:
                raise ValueError(f"No response received for page {page_number}")
            
            # Parse response
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            result = json.loads(response_text)
            
            logger.info(f"✓ Page {page_number} analyzed: {len(result.get('dialogue_order', []))} dialogue lines")
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing page {page_number}: {str(e)}")
            # Return empty analysis for failed pages
            return {
                "page_number": page_number,
                "scene": "Analysis failed",
                "speaking_characters": [],
                "dialogue_order": [],
                "ambient": ""
            }
    
    def _build_final_scene_analysis(self, individual_analyses: List[Dict[str, Any]], character_context: Dict[str, Any], scene_id: str) -> Dict[str, Any]:
        """
        Build final scene analysis combining both passes
        
        Args:
            individual_analyses: List of individual page analyses from Pass 2
            character_context: Character identification from Pass 1
            scene_id: Scene identifier
            
        Returns:
            Final scene analysis
        """
        
        # Extract character information
        character_identification = character_context.get("character_identification", {})
        characters = character_identification.get("characters", [])
        
        # Build character consistency data
        character_consistency = {}
        for char in characters:
            char_name = char.get("name", "")
            character_consistency[char_name] = {
                "appearance_count": len(char.get("appears_in_pages", [])),
                "pages_appeared": char.get("appears_in_pages", []),
                "visual_description": char.get("visual_description", ""),
                "gender_hint": char.get("gender_hint", "unknown"),
                "importance": char.get("importance", "background")
            }
        
        # Generate scene summary
        scene_summary = self._generate_scene_summary(individual_analyses, character_consistency)
        
        # Extract ambient context
        ambient_context = self._extract_ambient_context(individual_analyses)
        
        # Build final result
        scene_analysis = {
            "scene_id": scene_id,
            "total_pages": len(individual_analyses),
            "page_analyses": individual_analyses,  # Accurate dialogue from Pass 2
            "characters": {
                "all_characters": [char.get("name", "") for char in characters],
                "character_count": len(characters),
                "consistency": character_consistency
            },
            "scene_summary": scene_summary,
            "ambient_context": ambient_context,
            "analysis_method": "two_pass_hybrid",
            "character_context": character_context  # Keep original context
        }
        
        return scene_analysis
    
    def _generate_scene_summary(self, individual_analyses: List[Dict[str, Any]], character_consistency: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate scene summary from individual analyses
        
        Args:
            individual_analyses: List of individual page analyses
            character_consistency: Character consistency data
            
        Returns:
            Scene summary
        """
        
        # Find main characters (appear in multiple pages)
        main_characters = [char for char, data in character_consistency.items() if data["importance"] == "main"]
        supporting_characters = [char for char, data in character_consistency.items() if data["importance"] == "supporting"]
        
        # Extract scene descriptions
        scene_descriptions = [page.get("scene", "") for page in individual_analyses if page.get("scene")]
        
        return {
            "main_characters": main_characters,
            "supporting_characters": supporting_characters,
            "total_characters": len(character_consistency),
            "scene_descriptions": scene_descriptions,
            "character_consistency_score": len(main_characters) / max(len(character_consistency), 1)
        }
    
    def _extract_ambient_context(self, individual_analyses: List[Dict[str, Any]]) -> str:
        """
        Extract ambient context from all pages
        
        Args:
            individual_analyses: List of individual page analyses
            
        Returns:
            Combined ambient context
        """
        
        ambient_contexts = [page.get("ambient", "") for page in individual_analyses if page.get("ambient")]
        
        if ambient_contexts:
            # Combine unique ambient contexts
            unique_contexts = list(set(ambient_contexts))
            return " | ".join(unique_contexts)
        
        return ""
    
    def get_character_summary(self, scene_analysis: Dict[str, Any]) -> str:
        """
        Get character summary for logging
        
        Args:
            scene_analysis: Scene analysis result
            
        Returns:
            Formatted character summary
        """
        
        characters = scene_analysis.get("characters", {})
        scene_summary = scene_analysis.get("scene_summary", {})
        
        main_chars = scene_summary.get("main_characters", [])
        supporting_chars = scene_summary.get("supporting_characters", [])
        
        summary = f"""
Two-Pass Hybrid Scene Character Analysis Summary:
- Scene ID: {scene_analysis.get('scene_id', 'unknown')}
- Total Pages: {scene_analysis.get('total_pages', 0)}
- Total Characters: {characters.get('character_count', 0)}
- Main Characters: {len(main_chars)} ({', '.join(main_chars[:3])}{'...' if len(main_chars) > 3 else ''})
- Supporting Characters: {len(supporting_chars)} ({', '.join(supporting_chars[:3])}{'...' if len(supporting_chars) > 3 else ''})
- Character Consistency Score: {scene_summary.get('character_consistency_score', 0):.2f}
- Analysis Method: {scene_analysis.get('analysis_method', 'unknown')}
        """
        
        return summary.strip()


def main():
    """Test the two-pass hybrid analyzer"""
    
    # Test with existing images
    image_dir = Path("scenes/ch01_images")
    image_paths = sorted([str(image_dir / f"scene-1_page_{i+1}.png") for i in range(7)])
    
    analyzer = TwoPassHybridAnalyzer()
    
    try:
        result = analyzer.analyze_scene_characters(image_paths, "ch01_two_pass_test")
        
        print(analyzer.get_character_summary(result))
        
        # Save result
        output_file = Path("scenes/two_pass_scene_analysis.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Results saved to: {output_file}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
