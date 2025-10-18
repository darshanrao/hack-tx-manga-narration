# Manga Analysis Pipeline

A comprehensive pipeline for processing manga PDFs and analyzing them with Google's Gemini AI model.

## Features

- **PDF Processing**: Extract pages from PDFs as high-quality images
- **AI Analysis**: Use Gemini AI to understand and describe manga pages
- **Batch Processing**: Process single PDFs or entire directories
- **Flexible Output**: Save images, analysis results, or both
- **Custom Prompts**: Use custom analysis prompts for specific needs

## Installation

### Quick Setup (Recommended)

1. **Run the automated setup script:**
```bash
cd data_processing
chmod +x setup.sh
./setup.sh
```

This script will:
- Create a Python virtual environment
- Install all required dependencies
- Check for system dependencies
- Create configuration files
- Set up the output directory

2. **Activate the environment:**
```bash
# Option 1: Use the activation script
./activate.sh

# Option 2: Manual activation
source venv/bin/activate
```

3. **Configure your API key:**
```bash
# Edit the .env file and add your Google AI API key
nano .env
# Get your API key from: https://makersuite.google.com/app/apikey
```

### Manual Setup

If you prefer manual setup:

1. **Create virtual environment:**
```bash
python3 -m venv venv
source venv/bin/activate
```

2. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

3. **Install system dependencies for PDF processing:**
```bash
# On macOS
brew install poppler

# On Ubuntu/Debian
sudo apt-get install poppler-utils

# On Windows
# Download poppler from: https://github.com/oschwartz10612/poppler-windows
```

4. **Set up your Google AI API key:**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API key
# Get your API key from: https://makersuite.google.com/app/apikey
```

## Usage

### Command Line Interface

**Make sure to activate the virtual environment first:**
```bash
source venv/bin/activate
# or use: ./activate.sh
```

Process a single PDF:
```bash
python cli.py Chapters/scene-1.pdf --api-key YOUR_API_KEY
```

Process all PDFs in a directory:
```bash
python cli.py Chapters/ --api-key YOUR_API_KEY
```

With custom analysis prompt:
```bash
python cli.py Chapters/scene-1.pdf --prompt "Describe the characters and their emotions in this manga page" --api-key YOUR_API_KEY
```

**Note:** If you've set up the `.env` file with your API key, you can omit the `--api-key` parameter:
```bash
python cli.py Chapters/scene-1.pdf
```

### Python API

**Make sure to activate the virtual environment first:**
```bash
source venv/bin/activate
# or use: ./activate.sh
```

```python
from manga_pipeline import MangaAnalysisPipeline

# Initialize pipeline
pipeline = MangaAnalysisPipeline(
    output_dir="output",
    gemini_api_key="your_api_key",  # or None if using .env file
    gemini_model="gemini-1.5-flash"
)

# Process a single PDF
results = pipeline.process_pdf("Chapters/scene-1.pdf")

# Process multiple PDFs
results = pipeline.process_multiple_pdfs("Chapters/")
```

## Configuration

### Environment Variables

- `GOOGLE_API_KEY`: Your Google AI API key (required)
- `GEMINI_MODEL`: Gemini model to use (default: gemini-1.5-flash)
- `PDF_DPI`: DPI for PDF to image conversion (default: 300)
- `OUTPUT_DIRECTORY`: Output directory for results (default: output)

### Available Gemini Models

- `gemini-1.5-flash`: Fast and efficient (recommended)
- `gemini-1.5-pro`: More capable but slower
- `gemini-1.0-pro`: Legacy model

## Output Structure

```
output/
├── scene-1/
│   ├── scene-1_page_1.png
│   ├── scene-1_page_2.png
│   └── scene-1_analysis.json
└── scene-2/
    ├── scene-2_page_1.png
    └── scene-2_analysis.json
```

## API Reference

### MangaAnalysisPipeline

Main pipeline class that orchestrates PDF processing and AI analysis.

#### Methods

- `process_pdf(pdf_path, custom_prompt=None, save_images=True, save_analysis=True)`: Process a single PDF
- `process_multiple_pdfs(pdf_directory, ...)`: Process multiple PDFs from a directory
- `get_pipeline_status()`: Get current pipeline status and configuration

### PDFProcessor

Handles PDF to image conversion.

#### Methods

- `extract_pages_as_images(pdf_path, output_dir=None)`: Extract all pages as PIL Images
- `get_page_count(pdf_path)`: Get number of pages in PDF
- `process_single_page(pdf_path, page_number)`: Extract a single page

### GeminiImageAnalyzer

Handles communication with Google's Gemini AI model.

#### Methods

- `analyze_image(image, prompt=None)`: Analyze a single image
- `analyze_multiple_images(images, prompt=None)`: Analyze multiple images
- `analyze_with_custom_prompt(image, custom_prompt)`: Analyze with custom prompt

## Examples

### Basic Usage

```python
from manga_pipeline import MangaAnalysisPipeline

pipeline = MangaAnalysisPipeline(gemini_api_key="your_key")
results = pipeline.process_pdf("manga.pdf")
print(f"Analyzed {results['total_pages']} pages")
```

### Custom Analysis Prompt

```python
custom_prompt = """
Analyze this manga page and focus on:
1. Character emotions and expressions
2. Action sequences and movement
3. Dialogue and speech bubbles
4. Setting and background details
"""

results = pipeline.process_pdf("manga.pdf", custom_prompt=custom_prompt)
```

### Batch Processing

```python
# Process all PDFs in a directory
results = pipeline.process_multiple_pdfs("manga_chapters/")

for result in results:
    if 'error' not in result:
        print(f"✓ {result['pdf_file']}: {result['total_pages']} pages")
    else:
        print(f"✗ {result['pdf_file']}: {result['error']}")
```

## Troubleshooting

### Common Issues

1. **API Key Error**: Make sure your Google AI API key is valid and has proper permissions
2. **PDF Processing Error**: Ensure poppler is installed correctly
3. **Memory Issues**: For large PDFs, consider reducing DPI or processing pages individually
4. **Rate Limiting**: Gemini API has rate limits; add delays between requests if needed

### Getting Help

- Check the logs for detailed error messages
- Verify your API key at: https://makersuite.google.com/app/apikey
- Ensure all dependencies are installed correctly
