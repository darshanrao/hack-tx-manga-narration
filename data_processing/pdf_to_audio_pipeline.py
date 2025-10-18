"""
Complete PDF-to-Audio Pipeline
Two-pass processing: First analyze all pages for character consistency, then process each page individually
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime

from pdf_processor import PDFProcessor
from scene_character_analyzer import SceneCharacterAnalyzer
from character_consistency_manager import CharacterConsistencyManager
from audio_tag_enhancer import AudioTagEnhancer
from eleven_json_builder import ElevenLabsJSONBuilder

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PDFToAudioPipeline:
    """Complete pipeline for converting PDF manga to ElevenLabs-ready audio JSON"""
    
    def __init__(self, 
                 output_dir: str = "scenes",
                 gemini_api_key: str = None,
                 vision_model: str = "gemini-2.5-pro",
                 enhancement_model: str = "gemini-2.5-flash",
                 pdf_dpi: int = 300):
        """
        Initialize the complete PDF-to-audio pipeline
        
        Args:
            output_dir: Directory for output files
            gemini_api_key: Google AI API key
            vision_model: Gemini model for vision analysis
            enhancement_model: Gemini model for audio tag enhancement
            pdf_dpi: DPI for PDF to image conversion
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize components
        self.pdf_processor = PDFProcessor(dpi=pdf_dpi)
        self.scene_analyzer = SceneCharacterAnalyzer(gemini_api_key, vision_model)
        self.consistency_manager = CharacterConsistencyManager()
        self.audio_enhancer = AudioTagEnhancer(gemini_api_key, enhancement_model)
        self.json_builder = ElevenLabsJSONBuilder(self.consistency_manager.voice_registry)
        
        logger.info("PDF-to-Audio Pipeline initialized")
    
    def process_pdf_scene(self, 
                        pdf_path: str, 
                        scene_id: str = None,
                        extract_images: bool = True,
                        image_output_dir: str = None) -> Dict[str, Any]:
        """
        Process a complete PDF scene through two-pass analysis
        
        Args:
            pdf_path: Path to PDF file
            scene_id: Optional scene identifier
            extract_images: Whether to extract and save page images
            image_output_dir: Directory for extracted images
            
        Returns:
            Complete processing results
        """
        try:
            pdf_path = Path(pdf_path)
            if not pdf_path.exists():
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            # Generate scene ID if not provided
            if not scene_id:
                scene_id = pdf_path.stem
            
            logger.info(f"Starting PDF-to-Audio processing for: {pdf_path.name}")
            logger.info(f"Scene ID: {scene_id}")
            
            # Step 1: Extract PDF pages as images
            logger.info("Step 1: Extracting PDF pages as images...")
            if image_output_dir:
                image_dir = Path(image_output_dir)
            else:
                image_dir = self.output_dir / f"{scene_id}_images"
            
            images = self.pdf_processor.extract_pages_as_images(str(pdf_path), str(image_dir))
            image_paths = [str(image_dir / f"{pdf_path.stem}_page_{i+1}.png") for i in range(len(images))]
            
            logger.info(f"Extracted {len(images)} pages as images")
            
            # Step 2: Scene-level character analysis (First Pass)
            logger.info("Step 2: Scene-level character analysis (First Pass)...")
            scene_analysis = self.scene_analyzer.analyze_scene_characters(image_paths, scene_id)
            
            logger.info(self.scene_analyzer.get_character_summary(scene_analysis))
            
            # Step 3: Register characters and assign consistent voices
            logger.info("Step 3: Registering characters and assigning consistent voices...")
            voice_assignments = self.consistency_manager.register_scene_characters(scene_id, scene_analysis)
            
            logger.info(f"Assigned voices to {len(voice_assignments)} characters")
            
            # Step 4: Process each page individually (Second Pass)
            logger.info("Step 4: Processing each page individually (Second Pass)...")
            page_results = []
            
            for i, page_analysis in enumerate(scene_analysis["page_analyses"]):
                page_number = i + 1
                image_path = image_paths[i]
                
                logger.info(f"Processing page {page_number}/{len(image_paths)}")
                
                try:
                    # Enhance dialogue with audio tags
                    enhanced_dialogue = self.audio_enhancer.enhance_with_audio_tags(page_analysis)
                    
                    # Build ElevenLabs JSON with consistent voice assignments
                    page_id = f"{scene_id}_p{page_number:02d}"
                    eleven_json = self.json_builder.build_eleven_json(
                        page_analysis,
                        enhanced_dialogue,
                        scene_title=f"{scene_analysis['scene_summary'].get('main_characters', ['Scene'])[0]} - Page {page_number}",
                        add_narrator=True
                    )
                    
                    # Override voice assignments with scene-level consistency
                    for dialogue_item in eleven_json["dialogue"]:
                        char_name = dialogue_item["speaker"]
                        if char_name in voice_assignments:
                            dialogue_item["voice_id"] = voice_assignments[char_name]
                    
                    # Update characters dictionary with consistent voices
                    for char_name, voice_id in voice_assignments.items():
                        if char_name in eleven_json["characters"]:
                            eleven_json["characters"][char_name]["voice_id"] = voice_id
                    
                    # Save page JSON
                    json_filepath = self.json_builder.save_json(eleven_json, str(self.output_dir))
                    
                    page_results.append({
                        "page_number": page_number,
                        "page_id": page_id,
                        "json_file": json_filepath,
                        "success": True,
                        "dialogue_lines": len(eleven_json["dialogue"]),
                        "characters": len(eleven_json["characters"])
                    })
                    
                    logger.info(f"✓ Page {page_number} processed successfully")
                    
                except Exception as e:
                    logger.error(f"✗ Error processing page {page_number}: {str(e)}")
                    page_results.append({
                        "page_number": page_number,
                        "page_id": f"{scene_id}_p{page_number:02d}",
                        "success": False,
                        "error": str(e)
                    })
            
            # Step 5: Compile final results
            successful_pages = [p for p in page_results if p["success"]]
            failed_pages = [p for p in page_results if not p["success"]]
            
            final_results = {
                "scene_id": scene_id,
                "pdf_file": str(pdf_path),
                "processing_timestamp": datetime.now().isoformat(),
                "total_pages": len(images),
                "successful_pages": len(successful_pages),
                "failed_pages": len(failed_pages),
                "page_results": page_results,
                "scene_analysis": scene_analysis,
                "voice_assignments": voice_assignments,
                "character_statistics": self.consistency_manager.get_character_statistics(),
                "output_directory": str(self.output_dir)
            }
            
            # Save scene summary
            scene_summary_file = self.output_dir / f"{scene_id}_scene_summary.json"
            with open(scene_summary_file, 'w', encoding='utf-8') as f:
                json.dump(final_results, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Scene processing complete!")
            logger.info(f"✓ Successful pages: {len(successful_pages)}")
            logger.info(f"✗ Failed pages: {len(failed_pages)}")
            logger.info(f"📁 Output saved to: {self.output_dir}")
            
            return final_results
            
        except Exception as e:
            logger.error(f"Error processing PDF scene: {str(e)}")
            raise
    
    def process_multiple_pdfs(self, 
                             pdf_directory: str,
                             extract_images: bool = True) -> List[Dict[str, Any]]:
        """
        Process multiple PDF files from a directory
        
        Args:
            pdf_directory: Directory containing PDF files
            extract_images: Whether to extract and save page images
            
        Returns:
            List of processing results for each PDF
        """
        pdf_dir = Path(pdf_directory)
        if not pdf_dir.exists():
            raise FileNotFoundError(f"PDF directory not found: {pdf_directory}")
        
        # Find all PDF files
        pdf_files = list(pdf_dir.glob("*.pdf"))
        if not pdf_files:
            logger.warning(f"No PDF files found in {pdf_directory}")
            return []
        
        logger.info(f"Found {len(pdf_files)} PDF files to process")
        
        results = []
        for pdf_file in sorted(pdf_files):
            try:
                result = self.process_pdf_scene(
                    str(pdf_file),
                    extract_images=extract_images
                )
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to process {pdf_file.name}: {str(e)}")
                results.append({
                    "scene_id": pdf_file.stem,
                    "pdf_file": str(pdf_file),
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
        return {
            "output_directory": str(self.output_dir),
            "vision_model": self.scene_analyzer.model.model_name,
            "enhancement_model": self.audio_enhancer.model.model_name,
            "pdf_processor_dpi": self.pdf_processor.dpi,
            "character_statistics": self.consistency_manager.get_character_statistics(),
            "pipeline_ready": True
        }
    
    def export_character_report(self, output_file: str = None):
        """
        Export character consistency report
        
        Args:
            output_file: Optional custom output file path
        """
        if not output_file:
            output_file = self.output_dir / "character_consistency_report.json"
        
        self.consistency_manager.export_consistency_report(str(output_file))
    
    def get_processing_summary(self, results: List[Dict[str, Any]]) -> str:
        """
        Get summary of processing results
        
        Args:
            results: List of processing results
            
        Returns:
            Summary string
        """
        successful_scenes = [r for r in results if "error" not in r]
        failed_scenes = [r for r in results if "error" in r]
        
        total_pages = sum(r.get("total_pages", 0) for r in successful_scenes)
        successful_pages = sum(r.get("successful_pages", 0) for r in successful_scenes)
        failed_pages = sum(r.get("failed_pages", 0) for r in successful_scenes)
        
        summary = f"""
PDF-to-Audio Processing Summary:
- Total Scenes Processed: {len(results)}
- Successful Scenes: {len(successful_scenes)}
- Failed Scenes: {len(failed_scenes)}
- Total Pages: {total_pages}
- Successful Pages: {successful_pages}
- Failed Pages: {failed_pages}
- Success Rate: {(successful_pages / total_pages * 100) if total_pages > 0 else 0:.1f}%
        """
        return summary.strip()


def main():
    """Example usage of the PDF-to-Audio Pipeline"""
    
    # Initialize pipeline
    pipeline = PDFToAudioPipeline(
        output_dir="scenes",
        gemini_api_key=os.getenv("GOOGLE_API_KEY")
    )
    
    # Example: Process a single PDF
    pdf_path = "Chapters/scene-1.pdf"
    if os.path.exists(pdf_path):
        try:
            result = pipeline.process_pdf_scene(pdf_path)
            print(f"Processed scene: {result['scene_id']}")
            print(f"Total pages: {result['total_pages']}")
            print(f"Successful pages: {result['successful_pages']}")
            print(f"Characters: {len(result['voice_assignments'])}")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print(f"PDF file not found: {pdf_path}")


if __name__ == "__main__":
    main()
