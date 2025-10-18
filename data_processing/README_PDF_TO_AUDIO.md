# Complete PDF-to-Audio Pipeline

A comprehensive pipeline for converting manga PDFs to ElevenLabs-ready audio JSON with character consistency across entire scenes.

## 🎯 Key Features

- **Two-Pass Processing**: First analyzes all pages for character consistency, then processes each page individually
- **Character Consistency**: Maintains consistent voice assignments across entire scenes/chapters
- **PDF Processing**: Extracts pages from PDFs as high-quality images
- **Vision Analysis**: Uses Gemini Vision to understand manga pages and extract dialogue
- **Audio Enhancement**: Adds ElevenLabs v3 audio tags to dialogue
- **Voice Management**: Intelligent voice assignment with consistency tracking
- **Batch Processing**: Process single PDFs or entire directories

## 🔄 Workflow Overview

```
PDF Input
   ↓
Extract Pages as Images
   ↓
First Pass: Analyze ALL pages for character consistency
   ↓
Assign consistent voices to all characters
   ↓
Second Pass: Process each page individually
   ↓
Generate ElevenLabs-ready JSON for each page
```

## 📁 Pipeline Components

### Core Modules
- **`pdf_to_audio_pipeline.py`** - Main orchestrator for complete workflow
- **`scene_character_analyzer.py`** - Analyzes all pages for character consistency
- **`character_consistency_manager.py`** - Manages character consistency across scenes
- **`pdf_processor.py`** - Handles PDF to image conversion
- **`manga_vision_analyzer.py`** - Vision analysis for individual pages
- **`audio_tag_enhancer.py`** - Adds ElevenLabs v3 audio tags
- **`eleven_json_builder.py`** - Builds final ElevenLabs-ready JSON
- **`voice_registry.py`** - Manages voice assignments

### CLI Tools
- **`pdf_cli.sh`** - Complete PDF-to-audio CLI
- **`setup.sh`** - Environment setup script
- **`activate.sh`** - Environment activation script

## 🚀 Quick Start

### 1. Setup Environment
```bash
cd data_processing
./setup.sh
```

### 2. Activate Environment
```bash
./activate.sh
```

### 3. Configure API Key
```bash
# Edit .env file and add your Google AI API key
nano .env
# Get your API key from: https://makersuite.google.com/app/apikey
```

### 4. Process PDFs
```bash
# Process a single PDF
./pdf_cli.sh pdf Chapters/scene-1.pdf ch01 true

# Process all PDFs in directory
./pdf_cli.sh directory Chapters/ true

# Check status
./pdf_cli.sh status

# View character consistency
./pdf_cli.sh characters
```

## 📋 Detailed Usage

### Process Single PDF
```bash
./pdf_cli.sh pdf <pdf_path> [scene_id] [extract_images]
```

**Examples:**
```bash
# Process with automatic scene ID and extract images
./pdf_cli.sh pdf Chapters/scene-1.pdf

# Process with custom scene ID
./pdf_cli.sh pdf Chapters/scene-1.pdf ch01 true

# Process without extracting images (faster)
./pdf_cli.sh pdf Chapters/scene-1.pdf ch01 false
```

### Process Directory
```bash
./pdf_cli.sh directory <pdf_dir> [extract_images]
```

**Examples:**
```bash
# Process all PDFs in directory
./pdf_cli.sh directory Chapters/ true

# Process without extracting images
./pdf_cli.sh directory Chapters/ false
```

### View Reports
```bash
# Pipeline status
./pdf_cli.sh status

# Character consistency
./pdf_cli.sh characters

# Export all reports
./pdf_cli.sh export
```

## 📊 Output Structure

```
scenes/
├── page_ch01_p01.json          # Individual page JSON files
├── page_ch01_p02.json
├── ...
├── ch01_scene_summary.json     # Scene summary
├── character_consistency_report.json  # Character analysis
├── voice_assignments.json      # Voice assignments
└── ch01_images/               # Extracted page images (if enabled)
    ├── scene-1_page_1.png
    ├── scene-1_page_2.png
    └── ...
```

## 🎭 Character Consistency Features

### Two-Pass Analysis
1. **First Pass**: Analyzes all pages to understand:
   - All characters in the scene
   - Character importance (main/supporting/background)
   - Character emotional arcs
   - Character relationships

2. **Second Pass**: Processes each page with:
   - Consistent voice assignments
   - Character-aware audio tags
   - Scene context

### Voice Assignment Logic
- **Main Characters**: Get priority voices (Antoni, Rachel)
- **Supporting Characters**: Get secondary voices (Cameron, Sarah)
- **Background Characters**: Get utility voices (George, Dorothy)
- **Consistency**: Same character = same voice across all pages
- **Gender Detection**: Simple heuristic-based gender detection
- **Similarity Matching**: Matches similar characters to same voices

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Required
GOOGLE_API_KEY=your_api_key_here

# Optional
GEMINI_MODEL=gemini-1.5-pro
ENHANCEMENT_MODEL=gemini-1.5-flash
PDF_DPI=300
OUTPUT_DIRECTORY=scenes
```

### Voice Customization
Edit `scene_character_analyzer.py` to customize voice assignments:
```python
voice_mapping = {
    "male_main": "Antoni",
    "female_main": "Rachel", 
    "male_supporting": "Cameron",
    "female_supporting": "Sarah",
    # ... customize as needed
}
```

## 📈 Performance Tips

### For Large PDFs
- Use `extract_images=false` for faster processing
- Process PDFs in smaller batches
- Monitor API usage and rate limits

### For Better Results
- Use high-quality PDFs (300+ DPI)
- Ensure clear text in speech bubbles
- Use consistent character names across pages

## 🐛 Troubleshooting

### Common Issues
1. **API Key Error**: Ensure Google AI API key is valid and has proper permissions
2. **PDF Processing Error**: Install poppler: `brew install poppler`
3. **Memory Issues**: Use `extract_images=false` for large PDFs
4. **Character Inconsistency**: Check character names for typos across pages

### Debug Mode
```bash
# Enable debug logging
export PYTHONPATH=.
python3 -c "
import logging
logging.basicConfig(level=logging.DEBUG)
from pdf_to_audio_pipeline import PDFToAudioPipeline
# ... your code
"
```

## 🔄 Integration with ElevenLabs

The generated JSON files are ready for ElevenLabs API:

```json
{
  "page_id": "ch01_p01",
  "scene_title": "Opening Scene",
  "characters": {
    "Eren": {"voice_id": "Antoni"},
    "Mikasa": {"voice_id": "Rachel"}
  },
  "dialogue": [
    {
      "speaker": "Mikasa",
      "voice_id": "Rachel", 
      "text": "[gentle] Are you crying? [short pause]"
    }
  ]
}
```

## 📚 API Reference

### PDFToAudioPipeline
Main pipeline class for complete PDF processing.

#### Methods
- `process_pdf_scene(pdf_path, scene_id=None, extract_images=True)` - Process single PDF
- `process_multiple_pdfs(pdf_directory, extract_images=True)` - Process multiple PDFs
- `get_pipeline_status()` - Get pipeline status
- `export_character_report(output_file=None)` - Export character report

### SceneCharacterAnalyzer
Analyzes all pages for character consistency.

#### Methods
- `analyze_scene_characters(page_images, scene_id=None)` - Analyze scene characters
- `get_character_summary(scene_analysis)` - Get character summary

### CharacterConsistencyManager
Manages character consistency across scenes.

#### Methods
- `register_scene_characters(scene_id, scene_analysis)` - Register scene characters
- `get_character_voice(char_name, scene_id=None)` - Get character voice
- `get_character_statistics()` - Get character statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the hack-tx-manga-narration project.
