#!/usr/bin/env python3
"""
Example usage of the new PDF-to-Audio direct processing functionality
"""

import sys
import os

# Add the data_processing directory to the path
sys.path.append('../data_processing')

from generate_dialogue import process_pdf_to_audio

def example_pdf_to_audio():
    """
    Example of how to use the new PDF-to-Audio functionality
    """
    print("PDF-to-Audio Direct Processing Example")
    print("=" * 50)
    
    # Example 1: Process a PDF file directly
    pdf_path = "../data_processing/Chapters/scene-1.pdf"
    scene_id = "my_custom_scene"
    
    print(f"[INFO] Processing PDF: {pdf_path}")
    print(f"[INFO] Scene ID: {scene_id}")
    
    # Process the PDF directly to audio
    result = process_pdf_to_audio(
        pdf_path=pdf_path,
        scene_id=scene_id,
        gemini_api_key=None  # Uses environment variable GOOGLE_API_KEY if not provided
    )
    
    if result['success']:
        print(f"\n[SUCCESS] PDF processing complete!")
        print(f"[INFO] Scene ID: {result['scene_id']}")
        print(f"[INFO] Total pages: {result['total_pages']}")
        print(f"[INFO] Total duration: {result['total_duration']:.1f} seconds")
        print(f"[INFO] Generated {len(result['generated_files'])} file pairs")
        
        # List generated files
        for file_info in result['generated_files']:
            print(f"  - Page {file_info['page']}: {file_info['audio_file']} ({file_info['duration']:.1f}s)")
    else:
        print(f"\n[ERROR] PDF processing failed: {result['error']}")

def example_command_line_usage():
    """
    Example of command line usage
    """
    print("\nCommand Line Usage Examples:")
    print("=" * 50)
    
    print("1. Process a PDF file directly:")
    print("   python generate_dialogue.py path/to/your/file.pdf")
    print("   python generate_dialogue.py path/to/your/file.pdf custom_scene_id")
    
    print("\n2. Process existing JSON files (original functionality):")
    print("   python generate_dialogue.py scene2.json")
    print("   python generate_dialogue.py scene3.json")
    
    print("\n3. Use default file (scene2.json):")
    print("   python generate_dialogue.py")

if __name__ == "__main__":
    # Show command line usage examples
    example_command_line_usage()
    
    # Note: The actual PDF processing example is commented out because
    # it requires poppler to be installed for PDF processing
    print("\nNote: PDF processing requires poppler to be installed.")
    print("For now, you can use the existing JSON files or install poppler.")
    
    # Uncomment the line below to test PDF processing (requires poppler)
    # example_pdf_to_audio()
