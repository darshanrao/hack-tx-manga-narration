#!/usr/bin/env python3
"""
Test PDF Processing
Simple test to verify PDF to image conversion works
"""

import os
import sys
from pathlib import Path
from pdf_processor import PDFProcessor

def test_pdf_processing():
    """Test PDF processing functionality"""
    
    print("📄 Testing PDF Processing...")
    print("=" * 40)
    
    # Test with scene-1.pdf
    pdf_path = "Chapters/scene-1.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"❌ PDF file not found: {pdf_path}")
        return False
    
    print(f"✅ Found PDF: {pdf_path}")
    
    try:
        # Initialize PDF processor
        processor = PDFProcessor(dpi=300)
        print("✅ PDF Processor initialized")
        
        # Get page count
        page_count = processor.get_page_count(pdf_path)
        print(f"✅ PDF has {page_count} pages")
        
        # Extract first page as test
        print("🖼️ Extracting first page as test...")
        first_page = processor.process_single_page(pdf_path, 1)
        print(f"✅ First page extracted: {first_page.size}")
        
        # Save test image
        test_output_dir = "test_output"
        os.makedirs(test_output_dir, exist_ok=True)
        
        test_image_path = os.path.join(test_output_dir, "test_page_1.png")
        first_page.save(test_image_path, "PNG")
        print(f"✅ Test image saved: {test_image_path}")
        
        print("🎉 PDF processing test successful!")
        return True
        
    except Exception as e:
        print(f"❌ Error processing PDF: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_pdf_processing()
    if success:
        print("\n✅ Ready to test full pipeline!")
        print("Next: ./pdf_cli.sh pdf Chapters/scene-1.pdf ch01 true")
    else:
        print("\n❌ PDF processing test failed")
        sys.exit(1)
