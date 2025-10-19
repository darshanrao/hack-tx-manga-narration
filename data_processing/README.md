# PDF-to-Audio Pipeline

A comprehensive pipeline that processes manga PDFs and generates audio-ready JSON for ElevenLabs voice generation.

## 🚀 Quick Start

### Prerequisites

1. **Python 3.8+**
2. **Google AI API Key** - Get one from [Google AI Studio](https://aistudio.google.com/)
3. **PDF files** to process

### Setup

1. **Clone and navigate to the data processing folder:**
   ```bash
   cd data_processing
   ```

2. **Set up virtual environment:**
   ```bash
   source venv/bin/activate
   ```

3. **Set your Google API key:**
   ```bash
   export GOOGLE_API_KEY="your_api_key_here"
   ```

### Basic Usage

```python
from standalone_pipeline import process_pdf

# Process a single PDF
result = process_pdf("Chapters/scene-1.pdf")

print(f"Scene: {result['scene_title']}")
print(f"Characters: {list(result['characters'].keys())}")
print(f"Dialogue lines: {len(result['dialogue'])}")
```

## 📖 Function Reference

### `process_pdf()`

The main function to process PDFs and return audio-ready JSON.

```python
def process_pdf(
    pdf_path: str,
    scene_id: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
    pass1_model: str = "gemini-2.0-flash",
    pass2_model: str = "gemini-2.5-pro", 
    enhancement_model: str = "gemini-2.5-flash-lite",
    pdf_dpi: int = 300,
    cleanup_images: bool = True,
    output_dir: str = "scenes"
) -> Dict[str, Any]:
```

#### Parameters

- **`pdf_path`** (str): Path to the PDF file
- **`scene_id`** (Optional[str]): Scene identifier (auto-generated if not provided)
- **`gemini_api_key`** (Optional[str]): Google AI API key (uses env var if not provided)
- **`pass1_model`** (str): Gemini model for Pass 1 character identification (default: `gemini-2.0-flash`)
- **`pass2_model`** (str): Gemini model for Pass 2 dialogue extraction (default: `gemini-2.5-pro`)
- **`enhancement_model`** (str): Gemini model for audio enhancement (default: `gemini-2.5-flash-lite`)
- **`pdf_dpi`** (int): DPI for PDF to image conversion (default: 300)
- **`cleanup_images`** (bool): Whether to clean up extracted images (default: True)
- **`output_dir`** (str): Directory to save outputs (default: "scenes")

#### Returns

Dictionary containing the complete audio-ready JSON with:
- `scene_id`: Scene identifier
- `scene_title`: Generated scene title
- `ambient`: Environmental context
- `characters`: Character voice assignments
- `dialogue`: Enhanced dialogue with audio tags

#### Raises

- `ValueError`: If PDF file doesn't exist or API key is missing
- `Exception`: If processing fails

## 🎯 Usage Examples

### Example 1: Basic Processing

```python
from standalone_pipeline import process_pdf

# Simple processing
result = process_pdf("Chapters/scene-1.pdf")

# Check results
print(f"✅ Processed: {result['scene_id']}")
print(f"📄 Pages: {len(set(d['page_number'] for d in result['dialogue']))}")
print(f"👥 Characters: {len(result['characters'])}")
print(f"💬 Dialogue lines: {len(result['dialogue'])}")
```

### Example 2: Advanced Configuration

```python
from standalone_pipeline import process_pdf

# Advanced processing with custom models
result = process_pdf(
    pdf_path="Chapters/scene-1.pdf",
    scene_id="my_custom_scene",
    pass1_model="gemini-2.0-flash",      # Fast character identification
    pass2_model="gemini-2.5-pro",        # Powerful dialogue extraction
    enhancement_model="gemini-2.5-flash-lite",  # Lite audio enhancement
    pdf_dpi=300,
    cleanup_images=True,
    output_dir="my_output"
)

# Save custom output
import json
with open("my_scene.json", "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)
```

### Example 3: Process Multiple PDFs

```python
from standalone_pipeline import process_multiple_pdfs_to_json
import os

# Process all PDFs in a directory
results = process_multiple_pdfs_to_json(
    pdf_directory="Chapters",
    cleanup_images=True
)

# Check results
for pdf_name, json_data in results.items():
    if "error" not in json_data:
        print(f"✅ {pdf_name}: {len(json_data['dialogue'])} dialogue lines")
    else:
        print(f"❌ {pdf_name}: {json_data['error']}")
```

### Example 4: Command Line Usage

```bash
# Using the CLI script
./pdf_cli.sh pdf Chapters/scene-1.pdf my_scene

# Process all PDFs in directory
./pdf_cli.sh dir Chapters
```

## 🧠 How It Works

### Two-Pass Hybrid Algorithm

The pipeline uses an optimized two-pass approach:

1. **Pass 1 (Character Identification)**: 
   - Uses `gemini-2.0-flash` (fast model)
   - Analyzes all pages together
   - Identifies characters consistently across pages
   - Creates character context for Pass 2

2. **Pass 2 (Dialogue Extraction)**:
   - Uses `gemini-2.5-pro` (powerful model)
   - Processes each page individually
   - Uses character context from Pass 1
   - Extracts dialogue with proper speaker attribution

3. **Audio Enhancement**:
   - Uses `gemini-2.5-flash-lite` (lite model)
   - Enhances all dialogue with ElevenLabs v3 audio tags
   - Single API call for all dialogue

### Output Format

The generated JSON follows this structure:

```json
{
  "scene_id": "scene_1",
  "scene_title": "Eren - Complete Scene",
  "ambient": "Environmental context and atmosphere",
  "characters": {
    "Eren": {
      "voice_id": "5kMbtRSEKIkRZSdXxrZg",
      "expression": "determined, frustrated"
    },
    "Mikasa": {
      "voice_id": "CaT0A6YBELRBgT6Qa2lH", 
      "expression": "stoic, concerned"
    },
    "Narrator": {
      "voice_id": "L1aJrPa7pLJEyYlh3Ilq",
      "expression": "neutral"
    }
  },
  "dialogue": [
    {
      "speaker": "Eren",
      "voice_id": "5kMbtRSEKIkRZSdXxrZg",
      "text": "[angry] I will destroy all Titans!",
      "page_number": 1,
      "emotion": "angry",
      "confidence": "high"
    }
  ]
}
```

## 🎭 Voice Management

### Voice IDs

The pipeline uses ElevenLabs voice IDs:

**Male Voices:**
- `UgBBYS2sOqTuMpoF3BR0`
- `vBKc2FfBKJfcZNyEt1n6`
- `XA2bIQ92TabjGbpO2xRr`
- `s3TPKV1kjDlVtZbl4Ksh`
- `2BJW5coyhAzSr8STdHbE`
- `3jR9BuQAOPMWUjWpi0ll`
- `TWUKKXAylkYxxlPe4gx0`

**Female Voices:**
- `OYTbf65OHHFELVut7v2H`
- `uYXf8XasLslADfZ2MB4u`
- `bMxLr8fP6hzNRRi9nJxU`
- `TbMNBJ27fH2U0VgpSNko`

**Narrator Voice:**
- `asDeXBMC8hUkhqqL7agO`

### Character Consistency

- Characters maintain the same voice ID across all scenes
- Voice assignments are stored in `voice_registry.json`
- Gender-based voice assignment (male/female)
- Special narrator voice for all narration

## 🔧 Configuration

### Model Selection

**For Speed (Faster Processing):**
```python
result = process_pdf(
    pdf_path="file.pdf",
    pass1_model="gemini-2.0-flash",
    pass2_model="gemini-2.0-flash", 
    enhancement_model="gemini-2.5-flash-lite"
)
```

**For Quality (Better Results):**
```python
result = process_pdf(
    pdf_path="file.pdf",
    pass1_model="gemini-2.0-flash",
    pass2_model="gemini-2.5-pro",
    enhancement_model="gemini-2.5-flash-lite"
)
```

### Performance Optimization

- **Pass 1**: Use Flash model for speed (character identification)
- **Pass 2**: Use Pro model for accuracy (dialogue extraction)
- **Enhancement**: Use Lite model for efficiency (audio tags)
- **Cleanup**: Enable `cleanup_images=True` to save disk space

## 📁 File Structure

```
data_processing/
├── standalone_pipeline.py      # Main function
├── pdf_to_audio_pipeline.py   # Core pipeline
├── two_pass_hybrid_analyzer.py # Two-pass algorithm
├── audio_tag_enhancer.py      # Audio enhancement
├── voice_registry.py          # Voice management
├── pdf_cli.sh                # CLI script
├── example_usage.py          # Usage examples
├── quick_test.py             # Quick test script
├── scenes/                   # Output directory
├── voice_registry.json       # Voice assignments
└── character_consistency.json # Character data
```

## 🐛 Troubleshooting

### Common Issues

1. **API Key Error**:
   ```bash
   export GOOGLE_API_KEY="your_key_here"
   ```

2. **PDF Not Found**:
   - Check file path is correct
   - Ensure file is a PDF

3. **Processing Slow**:
   - Use faster models (`gemini-2.0-flash`)
   - Process fewer pages for testing

4. **Memory Issues**:
   - Reduce PDF DPI: `pdf_dpi=150`
   - Enable cleanup: `cleanup_images=True`

### Error Handling

```python
try:
    result = process_pdf("file.pdf")
except ValueError as e:
    print(f"Input error: {e}")
except Exception as e:
    print(f"Processing error: {e}")
```

## 📊 Performance Metrics

**Typical Processing Times:**
- **7-page PDF**: ~2-3 minutes
- **API Calls**: 8 total (1 + 7)
- **Models Used**: 3 different Gemini models
- **Output Size**: ~500 lines JSON

**Optimization Results:**
- **Pass 1**: Fast character identification with Flash
- **Pass 2**: Accurate dialogue with Pro
- **Enhancement**: Efficient audio tags with Lite

## 🎯 Best Practices

1. **Use appropriate models** for your needs (speed vs quality)
2. **Enable image cleanup** to save disk space
3. **Process in batches** for multiple PDFs
4. **Check voice assignments** in `voice_registry.json`
5. **Monitor API usage** to avoid quotas

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the example usage
3. Check API key and file paths
4. Monitor logs for detailed error messages

---

**Happy Processing!** 🚀
