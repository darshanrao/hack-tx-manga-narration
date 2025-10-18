"""
PDF Processing Module
Handles PDF to image conversion and page extraction
"""

import os
from typing import List, Tuple
from pdf2image import convert_from_path
from PIL import Image
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PDFProcessor:
    """Handles PDF processing and page extraction"""
    
    def __init__(self, dpi: int = 300):
        """
        Initialize PDF processor
        
        Args:
            dpi: Resolution for PDF to image conversion
        """
        self.dpi = dpi
        
    def extract_pages_as_images(self, pdf_path: str, output_dir: str = None) -> List[Image.Image]:
        """
        Extract all pages from PDF as PIL Images
        
        Args:
            pdf_path: Path to the PDF file
            output_dir: Optional directory to save images
            
        Returns:
            List of PIL Image objects
        """
        try:
            logger.info(f"Processing PDF: {pdf_path}")
            
            # Convert PDF to images
            images = convert_from_path(pdf_path, dpi=self.dpi)
            
            logger.info(f"Successfully extracted {len(images)} pages")
            
            # Save images if output directory is specified
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
                pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
                
                for i, image in enumerate(images):
                    image_path = os.path.join(output_dir, f"{pdf_name}_page_{i+1}.png")
                    image.save(image_path, "PNG")
                    logger.info(f"Saved page {i+1} to {image_path}")
            
            return images
            
        except Exception as e:
            logger.error(f"Error processing PDF {pdf_path}: {str(e)}")
            raise
    
    def get_page_count(self, pdf_path: str) -> int:
        """
        Get the number of pages in a PDF
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Number of pages
        """
        try:
            images = convert_from_path(pdf_path, dpi=self.dpi)
            return len(images)
        except Exception as e:
            logger.error(f"Error getting page count for {pdf_path}: {str(e)}")
            raise
    
    def process_single_page(self, pdf_path: str, page_number: int) -> Image.Image:
        """
        Extract a single page from PDF as PIL Image
        
        Args:
            pdf_path: Path to the PDF file
            page_number: Page number to extract (1-indexed)
            
        Returns:
            PIL Image object
        """
        try:
            logger.info(f"Extracting page {page_number} from {pdf_path}")
            
            # Convert specific page to image
            images = convert_from_path(pdf_path, dpi=self.dpi, first_page=page_number, last_page=page_number)
            
            if not images:
                raise ValueError(f"Page {page_number} not found in PDF")
            
            return images[0]
            
        except Exception as e:
            logger.error(f"Error extracting page {page_number} from {pdf_path}: {str(e)}")
            raise
