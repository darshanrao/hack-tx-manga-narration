"""
Main Pipeline for PDF Processing and Gemini Analysis
Orchestrates the entire workflow from PDF input to AI analysis
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from pdf_processor import PDFProcessor
from gemini_analyzer import GeminiImageAnalyzer

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MangaAnalysisPipeline:
    """Main pipeline for processing manga PDFs with Gemini AI analysis"""
    
    def __init__(self, 
                 output_dir: str = "output",
                 gemini_api_key: str = None,
                 gemini_model: str = "gemini-1.5-flash",
                 pdf_dpi: int = 300):
        """
        Initialize the manga analysis pipeline
        
        Args:
            output_dir: Directory to save outputs
            gemini_api_key: Google AI API key
            gemini_model: Gemini model to use
            pdf_dpi: DPI for PDF to image conversion
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize components
        self.pdf_processor = PDFProcessor(dpi=pdf_dpi)
        self.gemini_analyzer = GeminiImageAnalyzer(
            api_key=gemini_api_key,
            model_name=gemini_model
        )
        
        logger.info("Manga Analysis Pipeline initialized")
    
    def process_pdf(self, 
                   pdf_path: str, 
                   custom_prompt: str = None,
                   save_images: bool = True,
                   save_analysis: bool = True) -> Dict[str, Any]:
        """
        Process a single PDF file through the entire pipeline
        
        Args:
            pdf_path: Path to the PDF file
            custom_prompt: Custom prompt for Gemini analysis
            save_images: Whether to save extracted images
            save_analysis: Whether to save analysis results
            
        Returns:
            Dictionary containing processing results
        """
        try:
            pdf_path = Path(pdf_path)
            if not pdf_path.exists():
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            logger.info(f"Starting pipeline processing for: {pdf_path.name}")
            
            # Create output subdirectory for this PDF
            pdf_output_dir = self.output_dir / pdf_path.stem
            if save_images:
                pdf_output_dir.mkdir(exist_ok=True)
            
            # Step 1: Extract pages as images
            logger.info("Step 1: Extracting pages from PDF...")
            images = self.pdf_processor.extract_pages_as_images(
                str(pdf_path), 
                str(pdf_output_dir) if save_images else None
            )
            
            # Step 2: Analyze each page with Gemini
            logger.info("Step 2: Analyzing pages with Gemini AI...")
            analyses = self.gemini_analyzer.analyze_multiple_images(images, custom_prompt)
            
            # Step 3: Compile results
            results = {
                "pdf_file": str(pdf_path),
                "processing_timestamp": datetime.now().isoformat(),
                "total_pages": len(images),
                "pages_analyzed": len(analyses),
                "analyses": []
            }
            
            for i, analysis in enumerate(analyses):
                page_result = {
                    "page_number": i + 1,
                    "analysis": analysis,
                    "image_saved": save_images,
                    "image_path": str(pdf_output_dir / f"{pdf_path.stem}_page_{i+1}.png") if save_images else None
                }
                results["analyses"].append(page_result)
            
            # Step 4: Save results if requested
            if save_analysis:
                results_file = pdf_output_dir / f"{pdf_path.stem}_analysis.json"
                with open(results_file, 'w', encoding='utf-8') as f:
                    json.dump(results, f, indent=2, ensure_ascii=False)
                logger.info(f"Analysis results saved to: {results_file}")
            
            logger.info(f"Pipeline processing completed for: {pdf_path.name}")
            return results
            
        except Exception as e:
            logger.error(f"Error processing PDF {pdf_path}: {str(e)}")
            raise
    
    def process_multiple_pdfs(self, 
                             pdf_directory: str,
                             custom_prompt: str = None,
                             save_images: bool = True,
                             save_analysis: bool = True) -> List[Dict[str, Any]]:
        """
        Process multiple PDF files from a directory
        
        Args:
            pdf_directory: Directory containing PDF files
            custom_prompt: Custom prompt for Gemini analysis
            save_images: Whether to save extracted images
            save_analysis: Whether to save analysis results
            
        Returns:
            List of processing results for each PDF
        """
        pdf_dir = Path(pdf_directory)
        if not pdf_dir.exists():
            raise FileNotFoundError(f"Directory not found: {pdf_directory}")
        
        # Find all PDF files
        pdf_files = list(pdf_dir.glob("*.pdf"))
        if not pdf_files:
            logger.warning(f"No PDF files found in {pdf_directory}")
            return []
        
        logger.info(f"Found {len(pdf_files)} PDF files to process")
        
        results = []
        for pdf_file in pdf_files:
            try:
                result = self.process_pdf(
                    str(pdf_file),
                    custom_prompt=custom_prompt,
                    save_images=save_images,
                    save_analysis=save_analysis
                )
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to process {pdf_file.name}: {str(e)}")
                results.append({
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
            "gemini_model_info": self.gemini_analyzer.get_model_info(),
            "pdf_processor_dpi": self.pdf_processor.dpi,
            "pipeline_ready": True
        }


def main():
    """Example usage of the Manga Analysis Pipeline"""
    
    # Initialize pipeline
    pipeline = MangaAnalysisPipeline(
        output_dir="output",
        gemini_api_key=os.getenv("GOOGLE_API_KEY"),
        gemini_model="gemini-1.5-flash"
    )
    
    # Example: Process a single PDF
    pdf_path = "Chapters/scene-1.pdf"
    if os.path.exists(pdf_path):
        try:
            results = pipeline.process_pdf(pdf_path)
            print(f"Processed {results['total_pages']} pages")
            print(f"First page analysis: {results['analyses'][0]['analysis'][:200]}...")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print(f"PDF file not found: {pdf_path}")


if __name__ == "__main__":
    main()
