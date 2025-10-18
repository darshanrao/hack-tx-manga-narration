# ElevenLabs v3 Dialogue Generation Backend

A robust Python backend for converting JSON manga dialogue scripts into immersive audio experiences with synchronized transcripts using the ElevenLabs Text-to-Dialogue API with the eleven_v3 model.

## Features

- **JSON Input Format**: Accepts structured JSON scripts with character and dialogue data
- **Multi-Speaker Dialogue**: Generate natural conversations with multiple characters
- **Audio Tags Support**: Direct AI performance with tags like `[whispers]`, `[excitedly]`, `[sighs]`
- **Synchronized Transcripts**: Generates timestamped transcript files for frontend sync
- **High-Quality Output**: Generates MP3 files at 44.1kHz/128kbps
- **Dual Output**: Creates both audio and transcript files with matching UUIDs
- **Unique File Generation**: Prevents overwriting with UUID-based filenames
- **Error Handling**: Comprehensive error handling and user feedback

## Project Structure

```
backend/
├── elevenlabs/
│   ├── generate_dialogue.py    # Main script
│   ├── input.json              # JSON dialogue script
│   ├── dialogue_output_*.mp3   # Generated audio files
│   └── transcript_*.txt        # Generated transcript files
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Get ElevenLabs API Key

1. Sign up for an ElevenLabs account at [https://elevenlabs.io](https://elevenlabs.io)
2. Go to your profile settings to find your API key
3. Copy `env_template.txt` to `.env` in the backend directory:
   ```bash
   cd backend
   copy env_template.txt .env
   ```
4. Edit the `.env` file and replace `your_api_key_here` with your actual API key:
   ```
   ELEVENLABS_API_KEY="your_actual_api_key_here"
   ```

### 3. JSON Script Format

The system now accepts JSON input with structured dialogue data. No hardcoded voice mappings are needed - all voice IDs are specified in the JSON file.

**JSON Structure:**
```json
{
  "page_id": "unknown",
  "scene_title": "Scene Title",
  "ambient": "",
  "characters": {
    "Character Name": {
      "voice_id": "ElevenLabsVoiceID",
      "expression": "emotional description"
    }
  },
  "dialogue": [
    {
      "speaker": "Character Name",
      "voice_id": "ElevenLabsVoiceID", 
      "text": "[emotion] Dialogue text with audio tags"
    }
  ],
  "metadata": {
    "generated_at": "timestamp",
    "total_dialogue_lines": 12,
    "total_characters": 6,
    "has_narrator": true
  }
}
```

## Usage

### Basic Usage

```bash
cd backend/elevenlabs
python generate_dialogue.py
```

### Input Format

The system expects a JSON file (`input.json`) with the following structure:

**Required Fields:**
- `dialogue`: Array of dialogue entries
- Each dialogue entry must have: `speaker`, `voice_id`, `text`

**Optional Fields:**
- `page_id`, `scene_title`, `ambient`: Metadata
- `characters`: Character definitions with voice IDs and expressions
- `metadata`: Generation information

### Audio Tags

Use square brackets to add performance directions that the AI will interpret but not speak aloud:

- `[whispers]` - Quiet, intimate delivery
- `[excitedly]` - Energetic, enthusiastic tone
- `[sad]` - Melancholic, emotional delivery
- `[confused]` - Uncertain, questioning tone
- `[short pause]` - Brief silence
- `[sighs softly]` - Breathing, emotional expression

### Example JSON Script

```json
{
  "page_id": "unknown",
  "scene_title": "Citizens - Page 7",
  "dialogue": [
    {
      "speaker": "Narrator",
      "voice_id": "Z3R5wn05IrDiVCyEkUrK",
      "text": "[calm] Under the tree, the wind drifts through the leaves."
    },
    {
      "speaker": "Mikasa",
      "voice_id": "AZnzlk1XvdvUeBnXmlld", 
      "text": "[gentle] Are you crying? [short pause]"
    },
    {
      "speaker": "Eren",
      "voice_id": "IKne3meq5aSn9XLyUdCD",
      "text": "[confused] Huh...? [sighs softly]"
    }
  ]
}
```

## Output

The script generates **two files** with matching UUIDs:

1. **Audio File**: `dialogue_output_{uuid}.mp3`
   - High-quality MP3 audio with multi-speaker dialogue
   - Natural pacing and emotional delivery

2. **Transcript File**: `transcript_{uuid}.txt`
   - Timestamped transcript for frontend synchronization
   - Clean text without audio tags
   - Format: `MM:SS Speaker: Dialogue text`

**Example Transcript:**
```
00:00 Narrator: On a town street, Eren overhears Hannes...
00:09 Garrison Soldier 1: IT'S JUST LIKE HANNES SAYS.
00:13 Hannes: HELL... I CAN'T UNDERSTAND THOSE GUYS...
```

## Error Handling

The script includes comprehensive error handling for:

- Missing API key
- Invalid voice IDs
- Script parsing errors
- API authentication issues
- Network connectivity problems

## Technical Details

### ElevenLabs v3 Model

The script uses the `eleven_v3` model specifically designed for:
- **Dramatic delivery and performance**
- **Multi-speaker dialogue generation**
- **Audio tag interpretation**
- **Natural conversation flow**

### API Endpoint

Uses the `/v1/text-to-dialogue` endpoint with:
- Model: `eleven_v3`
- Output format: `mp3_44100_128`
- Input: List of dictionaries with `text` and `voice_id` keys

## Troubleshooting

### Common Issues

1. **"ELEVENLABS_API_KEY not found"**
   - Ensure you've created a `.env` file in the project root
   - Check that your API key is correctly formatted

2. **"Line X missing voice ID. Expected format: CharacterName|VoiceID: Dialogue"**
   - Ensure your script follows the format: `CharacterName|VoiceID: Dialogue`
   - Each line must include both character name and voice ID separated by a pipe (|)

3. **"Error generating audio"**
   - Check your ElevenLabs account has sufficient credits
   - Verify your voice IDs are correct
   - Ensure your API key is valid

### Getting Voice IDs

1. Go to [ElevenLabs VoiceLab](https://elevenlabs.io/voice-lab)
2. Find or create voices for your characters
3. Copy the voice ID from the URL or voice details
4. Include the voice ID directly in your script file using the format: `CharacterName|VoiceID: Dialogue`

## License

This project is part of the HackTX25 Manga Narration system.
