"""
Gemini Integration Module
Handles communication with Google's Gemini AI model for image understanding
"""

import os
import logging
from typing import List, Dict, Any, Optional
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GeminiImageAnalyzer:
    """Handles image analysis using Google's Gemini AI model"""
    
    def __init__(self, api_key: str = None, model_name: str = "gemini-1.5-flash"):
        """
        Initialize Gemini analyzer
        
        Args:
            api_key: Google AI API key (if None, will try to get from environment)
            model_name: Name of the Gemini model to use
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key not provided. Set GOOGLE_API_KEY environment variable or pass api_key parameter.")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(model_name)
        
        logger.info(f"Initialized Gemini analyzer with model: {model_name}")
    
    def analyze_image(self, image: Image.Image, prompt: str = None) -> str:
        """
        Analyze a single image using Gemini
        
        Args:
            image: PIL Image object to analyze
            prompt: Custom prompt for analysis (optional)
            
        Returns:
            Analysis result as string
        """
        try:
            # Default prompt for manga/image analysis
            default_prompt = """
            Analyze this image and provide a detailed description. If this appears to be a manga or comic page, 
            describe the visual elements, characters, setting, actions, and any text or dialogue visible. 
            Focus on the narrative elements and visual storytelling aspects.
            """
            
            analysis_prompt = prompt or default_prompt
            
            logger.info("Analyzing image with Gemini...")
            
            # Generate content using Gemini
            response = self.model.generate_content([analysis_prompt, image])
            
            if response.text:
                logger.info("Image analysis completed successfully")
                return response.text
            else:
                logger.warning("No text response received from Gemini")
                return "No analysis available"
                
        except Exception as e:
            logger.error(f"Error analyzing image with Gemini: {str(e)}")
            raise
    
    def analyze_multiple_images(self, images: List[Image.Image], prompt: str = None) -> List[str]:
        """
        Analyze multiple images using Gemini
        
        Args:
            images: List of PIL Image objects to analyze
            prompt: Custom prompt for analysis (optional)
            
        Returns:
            List of analysis results
        """
        results = []
        
        for i, image in enumerate(images):
            logger.info(f"Analyzing image {i+1}/{len(images)}")
            try:
                result = self.analyze_image(image, prompt)
                results.append(result)
            except Exception as e:
                logger.error(f"Error analyzing image {i+1}: {str(e)}")
                results.append(f"Error analyzing image {i+1}: {str(e)}")
        
        return results
    
    def analyze_with_custom_prompt(self, image: Image.Image, custom_prompt: str) -> str:
        """
        Analyze image with a completely custom prompt
        
        Args:
            image: PIL Image object to analyze
            custom_prompt: Custom analysis prompt
            
        Returns:
            Analysis result as string
        """
        return self.analyze_image(image, custom_prompt)
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current Gemini model
        
        Returns:
            Dictionary with model information
        """
        try:
            # Get model details
            model_info = {
                "model_name": self.model.model_name,
                "api_key_configured": bool(self.api_key),
                "api_key_length": len(self.api_key) if self.api_key else 0
            }
            return model_info
        except Exception as e:
            logger.error(f"Error getting model info: {str(e)}")
            return {"error": str(e)}
