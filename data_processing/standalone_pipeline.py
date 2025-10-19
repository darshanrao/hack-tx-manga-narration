#!/usr/bin/env python3
"""
Standalone PDF-to-Audio Pipeline Function
Simple function that takes PDF input and returns JSON output
"""

import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables from root .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Import pipeline components
from pdf_to_audio_pipeline import PDFToAudioPipeline

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def process_pdf(
    pdf_path: str,
    scene_id: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
    pass1_model: str = "gemini-2.0-flash-lite",
    pass2_model: str = "gemini-2.5-pro",
    enhancement_model: str = "gemini-2.0-flash-lite",
    pdf_dpi: int = 300,
    cleanup_images: bool = True,
    output_dir: str = "pipeline_output/intermediate"
) -> Dict[str, Any]:
    """
    Standalone function to process PDF and return audio-ready JSON
    
    Args:
        pdf_path: Path to the PDF file
        scene_id: Optional scene identifier (auto-generated if not provided)
        gemini_api_key: Google AI API key (uses env var if not provided)
        pass1_model: Gemini model for Pass 1 character identification (default: gemini-2.0-flash)
        pass2_model: Gemini model for Pass 2 dialogue extraction (default: gemini-2.5-pro)
        enhancement_model: Gemini model for audio enhancement (default: gemini-2.5-flash-lite)
        pdf_dpi: DPI for PDF to image conversion (default: 300)
        cleanup_images: Whether to clean up extracted images (default: True)
        output_dir: Directory to save outputs (default: "scenes")
    
    Returns:
        Dictionary containing the complete audio-ready JSON
        
    Raises:
        ValueError: If PDF file doesn't exist or API key is missing
        Exception: If processing fails
    """
    
    try:
        # Validate inputs
        pdf_file = Path(pdf_path)
        if not pdf_file.exists():
            raise ValueError(f"PDF file not found: {pdf_path}")
        
        if not pdf_file.suffix.lower() == '.pdf':
            raise ValueError(f"File must be a PDF: {pdf_path}")
        
        # Get API key
        api_key = gemini_api_key or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("Google API key not provided. Set GOOGLE_API_KEY environment variable or pass gemini_api_key parameter.")
        
        # Generate scene ID if not provided
        if not scene_id:
            scene_id = f"scene_{pdf_file.stem}"
        
        logger.info(f"Processing PDF: {pdf_path}")
        logger.info(f"Scene ID: {scene_id}")
        logger.info(f"Pass 1 Model (Character ID): {pass1_model}")
        logger.info(f"Pass 2 Model (Dialogue): {pass2_model}")
        logger.info(f"Enhancement Model: {enhancement_model}")
        
        # Initialize pipeline
        pipeline = PDFToAudioPipeline(
            output_dir=output_dir,
            gemini_api_key=api_key,
            vision_model=pass2_model,  # Use pass2_model for backward compatibility
            enhancement_model=enhancement_model,
            pdf_dpi=pdf_dpi
        )
        
        # Process the PDF
        result = pipeline.process_pdf_scene(
            pdf_path=str(pdf_file),
            scene_id=scene_id,
            extract_images=True,
            cleanup_images=cleanup_images
        )
        
        # Load the generated JSON
        json_file = Path(output_dir) / "page_unknown.json"
        if not json_file.exists():
            raise Exception("JSON output file was not created")
        
        with open(json_file, 'r', encoding='utf-8') as f:
            audio_json = json.load(f)
        
        logger.info(f"✅ Successfully processed PDF: {pdf_path}")
        logger.info(f"📄 Total pages: {result.get('total_pages', 'unknown')}")
        logger.info(f"👥 Characters: {result.get('characters', 'unknown')}")
        logger.info(f"📁 Output: {json_file}")
        
        return audio_json
        
    except Exception as e:
        logger.error(f"Error processing PDF {pdf_path}: {str(e)}")
        raise


def process_multiple_pdfs_to_json(
    pdf_directory: str,
    gemini_api_key: Optional[str] = None,
    vision_model: str = "gemini-2.5-pro",
    enhancement_model: str = "gemini-2.5-flash-lite",
    pdf_dpi: int = 300,
    cleanup_images: bool = True,
    output_dir: str = "pipeline_output/intermediate"
) -> Dict[str, Dict[str, Any]]:
    """
    Process multiple PDFs and return all JSON outputs
    
    Args:
        pdf_directory: Directory containing PDF files
        gemini_api_key: Google AI API key (uses env var if not provided)
        vision_model: Gemini model for vision analysis
        enhancement_model: Gemini model for audio enhancement
        pdf_dpi: DPI for PDF to image conversion
        cleanup_images: Whether to clean up extracted images
        output_dir: Directory to save outputs
    
    Returns:
        Dictionary mapping PDF filenames to their JSON outputs
    """
    
    try:
        pdf_dir = Path(pdf_directory)
        if not pdf_dir.exists():
            raise ValueError(f"Directory not found: {pdf_directory}")
        
        # Find all PDF files
        pdf_files = list(pdf_dir.glob("*.pdf"))
        if not pdf_files:
            raise ValueError(f"No PDF files found in: {pdf_directory}")
        
        logger.info(f"Found {len(pdf_files)} PDF files to process")
        
        results = {}
        
        for pdf_file in sorted(pdf_files):
            try:
                logger.info(f"Processing: {pdf_file.name}")
                
                # Process each PDF
                json_output = process_pdf(
                    pdf_path=str(pdf_file),
                    scene_id=f"scene_{pdf_file.stem}",
                    gemini_api_key=gemini_api_key,
                    vision_model=vision_model,
                    enhancement_model=enhancement_model,
                    pdf_dpi=pdf_dpi,
                    cleanup_images=cleanup_images,
                    output_dir=output_dir
                )
                
                results[pdf_file.name] = json_output
                logger.info(f"Completed: {pdf_file.name}")
                
            except Exception as e:
                logger.error(f"Failed to process {pdf_file.name}: {str(e)}")
                results[pdf_file.name] = {"error": str(e)}
        
        logger.info(f"📊 Processed {len(results)} PDFs total")
        return results
        
    except Exception as e:
        logger.error(f"Error processing PDF directory {pdf_directory}: {str(e)}")
        raise


# Example usage
if __name__ == "__main__":
    # Example 1: Process single PDF
    try:
        result = process_pdf(
            pdf_path="Chapters/scene-1.pdf",
            scene_id="test_scene",
            cleanup_images=True
        )
        
        print("Success!")
        print(f"Scene ID: {result.get('scene_id')}")
        print(f"Characters: {list(result.get('characters', {}).keys())}")
        print(f"Total dialogue lines: {len(result.get('dialogue', []))}")
        
    except Exception as e:
        print(f"Error: {e}")
    
    # Example 2: Process multiple PDFs
    try:
        results = process_multiple_pdfs_to_json(
            pdf_directory="Chapters",
            cleanup_images=True
        )
        
        print(f"Processed {len(results)} PDFs")
        for pdf_name, json_data in results.items():
            if "error" not in json_data:
                print(f"  {pdf_name}: {len(json_data.get('dialogue', []))} dialogue lines")
            else:
                print(f"  {pdf_name}: ERROR - {json_data['error']}")
                
    except Exception as e:
        print(f"Error: {e}")
