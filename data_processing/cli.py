"""
Simple CLI interface for the Manga Analysis Pipeline
"""

import argparse
import os
import sys
from pathlib import Path

from manga_pipeline import MangaAnalysisPipeline


def main():
    parser = argparse.ArgumentParser(description="Manga Analysis Pipeline - Process PDFs with Gemini AI")
    
    parser.add_argument("input", help="PDF file or directory containing PDFs")
    parser.add_argument("--api-key", help="Google AI API key (or set GOOGLE_API_KEY env var)")
    parser.add_argument("--model", default="gemini-1.5-flash", help="Gemini model to use")
    parser.add_argument("--output-dir", default="output", help="Output directory for results")
    parser.add_argument("--dpi", type=int, default=300, help="DPI for PDF to image conversion")
    parser.add_argument("--prompt", help="Custom prompt for analysis")
    parser.add_argument("--no-images", action="store_true", help="Don't save extracted images")
    parser.add_argument("--no-analysis", action="store_true", help="Don't save analysis results")
    
    args = parser.parse_args()
    
    # Get API key
    api_key = args.api_key or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: Google API key not provided. Use --api-key or set GOOGLE_API_KEY environment variable.")
        print("Get your API key from: https://makersuite.google.com/app/apikey")
        sys.exit(1)
    
    # Initialize pipeline
    try:
        pipeline = MangaAnalysisPipeline(
            output_dir=args.output_dir,
            gemini_api_key=api_key,
            gemini_model=args.model,
            pdf_dpi=args.dpi
        )
        print(f"Pipeline initialized with model: {args.model}")
    except Exception as e:
        print(f"Error initializing pipeline: {e}")
        sys.exit(1)
    
    # Process input
    input_path = Path(args.input)
    
    if not input_path.exists():
        print(f"Error: Input path does not exist: {input_path}")
        sys.exit(1)
    
    try:
        if input_path.is_file() and input_path.suffix.lower() == '.pdf':
            # Process single PDF
            print(f"Processing single PDF: {input_path.name}")
            results = pipeline.process_pdf(
                str(input_path),
                custom_prompt=args.prompt,
                save_images=not args.no_images,
                save_analysis=not args.no_analysis
            )
            print(f"✓ Processed {results['total_pages']} pages successfully")
            
        elif input_path.is_dir():
            # Process directory of PDFs
            print(f"Processing PDFs in directory: {input_path}")
            results = pipeline.process_multiple_pdfs(
                str(input_path),
                custom_prompt=args.prompt,
                save_images=not args.no_images,
                save_analysis=not args.no_analysis
            )
            successful = sum(1 for r in results if 'error' not in r)
            print(f"✓ Processed {successful}/{len(results)} PDFs successfully")
            
        else:
            print(f"Error: Input must be a PDF file or directory containing PDFs")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error during processing: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
