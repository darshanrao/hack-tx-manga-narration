"""
Main Manga-to-Audio Pipeline
Orchestrates the complete workflow from manga page to ElevenLabs-ready JSON
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime

from manga_vision_analyzer import MangaVisionAnalyzer
from audio_tag_enhancer import AudioTagEnhancer
from eleven_json_builder import ElevenLabsJSONBuilder
from voice_registry import VoiceRegistry

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MangaToAudioPipeline:
    """Main pipeline for converting manga pages to ElevenLabs-ready audio JSON"""
    
    def __init__(self, 
                 output_dir: str = "scenes",
                 voice_registry_file: str = "voice_registry.json",
                 gemini_api_key: str = None,
                 vision_model: str = "gemini-1.5-pro",
                 enhancement_model: str = "gemini-1.5-flash"):
        """
        Initialize the manga-to-audio pipeline
        
        Args:
            output_dir: Directory for output JSON files
            voice_registry_file: Path to voice registry file
            gemini_api_key: Google AI API key
            vision_model: Gemini model for vision analysis
            enhancement_model: Gemini model for audio tag enhancement
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize components
        self.voice_registry = VoiceRegistry(voice_registry_file)
        self.vision_analyzer = MangaVisionAnalyzer(gemini_api_key, vision_model)
        self.audio_enhancer = AudioTagEnhancer(gemini_api_key, enhancement_model)
        self.json_builder = ElevenLabsJSONBuilder(self.voice_registry)
        
        logger.info("Manga-to-Audio Pipeline initialized")
    
    def process_manga_page(self, 
                          image_path: str, 
                          page_id: str = None,
                          scene_title: str = None,
                          add_narrator: bool = True,
                          save_json: bool = True) -> Dict[str, Any]:
        """
        Process a single manga page through the complete pipeline
        
        Args:
            image_path: Path to manga page image
            page_id: Optional page identifier
            scene_title: Optional scene title override
            add_narrator: Whether to add narrator dialogue
            save_json: Whether to save the output JSON
            
        Returns:
            Complete ElevenLabs-ready JSON
        """
        try:
            logger.info(f"Starting manga-to-audio pipeline for: {image_path}")
            
            # Step 1: Vision + OCR Analysis
            logger.info("Step 1: Vision + OCR Analysis...")
            scene_data = self.vision_analyzer.extract_scene_data(image_path, page_id)
            
            # Validate scene data
            if not self.vision_analyzer.validate_scene_data(scene_data):
                raise ValueError("Invalid scene data from vision analysis")
            
            logger.info(self.vision_analyzer.get_analysis_summary(scene_data))
            
            # Step 2: Audio Tag Enhancement
            logger.info("Step 2: Audio Tag Enhancement...")
            enhanced_dialogue = self.audio_enhancer.enhance_with_audio_tags(scene_data)
            
            logger.info(self.audio_enhancer.get_enhancement_summary(
                scene_data.get("dialogue_order", []),
                enhanced_dialogue.get("dialogue_order", [])
            ))
            
            # Step 3: Build ElevenLabs JSON
            logger.info("Step 3: Building ElevenLabs JSON...")
            eleven_json = self.json_builder.build_eleven_json(
                scene_data, 
                enhanced_dialogue, 
                scene_title, 
                add_narrator
            )
            
            # Validate final JSON
            if not self.json_builder.validate_json(eleven_json):
                raise ValueError("Invalid ElevenLabs JSON structure")
            
            logger.info(self.json_builder.get_json_summary(eleven_json))
            
            # Step 4: Save JSON if requested
            if save_json:
                json_filepath = self.json_builder.save_json(eleven_json, str(self.output_dir))
                logger.info(f"Pipeline completed. JSON saved to: {json_filepath}")
            else:
                logger.info("Pipeline completed. JSON not saved.")
            
            return eleven_json
            
        except Exception as e:
            logger.error(f"Error processing manga page {image_path}: {str(e)}")
            raise
    
    def process_multiple_pages(self, 
                              image_directory: str,
                              file_pattern: str = "*.png",
                              add_narrator: bool = True,
                              save_json: bool = True) -> List[Dict[str, Any]]:
        """
        Process multiple manga pages from a directory
        
        Args:
            image_directory: Directory containing manga page images
            file_pattern: File pattern to match (e.g., "*.png", "*.jpg")
            add_narrator: Whether to add narrator dialogue
            save_json: Whether to save output JSON files
            
        Returns:
            List of ElevenLabs-ready JSON objects
        """
        image_dir = Path(image_directory)
        if not image_dir.exists():
            raise FileNotFoundError(f"Image directory not found: {image_directory}")
        
        # Find all matching image files
        image_files = list(image_dir.glob(file_pattern))
        if not image_files:
            logger.warning(f"No {file_pattern} files found in {image_directory}")
            return []
        
        logger.info(f"Found {len(image_files)} image files to process")
        
        results = []
        for image_file in sorted(image_files):
            try:
                result = self.process_manga_page(
                    str(image_file),
                    add_narrator=add_narrator,
                    save_json=save_json
                )
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to process {image_file.name}: {str(e)}")
                results.append({
                    "page_id": image_file.stem,
                    "error": str(e),
                    "processing_timestamp": datetime.now().isoformat()
                })
        
        return results
    
    def get_pipeline_status(self) -> Dict[str, Any]:
        """
        Get current pipeline status and configuration
        
        Returns:
            Dictionary with pipeline status information
        """
        voice_stats = self.voice_registry.get_voice_statistics()
        
        return {
            "output_directory": str(self.output_dir),
            "vision_model": self.vision_analyzer.model.model_name,
            "enhancement_model": self.audio_enhancer.model.model_name,
            "voice_registry_stats": voice_stats,
            "pipeline_ready": True
        }
    
    def export_voice_assignments(self, export_path: str = None):
        """
        Export current voice assignments
        
        Args:
            export_path: Optional custom export path
        """
        if not export_path:
            export_path = self.output_dir / "voice_assignments.json"
        
        self.json_builder.export_voice_assignments(str(export_path))
    
    def load_voice_assignments(self, import_path: str):
        """
        Load voice assignments from file
        
        Args:
            import_path: Path to voice assignments file
        """
        self.json_builder.load_voice_assignments(import_path)
    
    def get_processing_summary(self, results: List[Dict[str, Any]]) -> str:
        """
        Get summary of processing results
        
        Args:
            results: List of processing results
            
        Returns:
            Summary string
        """
        successful = [r for r in results if "error" not in r]
        failed = [r for r in results if "error" in r]
        
        total_dialogue = sum(len(r.get("dialogue", [])) for r in successful)
        total_characters = len(set(
            char for r in successful 
            for char in r.get("characters", {}).keys()
        ))
        
        summary = f"""
Processing Summary:
- Total Pages Processed: {len(results)}
- Successful: {len(successful)}
- Failed: {len(failed)}
- Total Dialogue Lines: {total_dialogue}
- Unique Characters: {total_characters}
- Average Dialogue per Page: {total_dialogue / len(successful) if successful else 0:.1f}
        """
        return summary.strip()


def main():
    """Example usage of the Manga-to-Audio Pipeline"""
    
    # Initialize pipeline
    pipeline = MangaToAudioPipeline(
        output_dir="scenes",
        gemini_api_key=os.getenv("GOOGLE_API_KEY")
    )
    
    # Example: Process a single manga page
    image_path = "Chapters/scene-1_page_1.png"  # Assuming you have extracted pages
    if os.path.exists(image_path):
        try:
            result = pipeline.process_manga_page(image_path)
            print(f"Processed page: {result['page_id']}")
            print(f"Scene: {result['scene_title']}")
            print(f"Characters: {len(result['characters'])}")
            print(f"Dialogue lines: {len(result['dialogue'])}")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print(f"Image file not found: {image_path}")
        print("Make sure you have extracted manga pages as images first.")


if __name__ == "__main__":
    main()
