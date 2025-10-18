# Gemini Script Generation Format

## Overview
This document explains how to generate script.txt files for the ElevenLabs v3 Dialogue Generation Backend.

## Script Format

Each line in the script file should follow this exact format:

```
CharacterName|VoiceID: Dialogue text with optional [audio tags]
```

### Format Rules:
1. **Character Name**: Any name (e.g., "Narrator", "Hero", "Villain", "Mikasa", "Eren")
2. **Pipe Separator**: Use `|` to separate character name from voice ID
3. **Voice ID**: Valid ElevenLabs voice ID (e.g., "Z3R5wn05IrDiVCyEkUrK")
4. **Colon**: Use `:` to separate character|voice from dialogue
5. **Dialogue**: The text to be spoken, with optional audio tags

### Audio Tags
Use square brackets for performance directions (AI interprets but doesn't speak):
- `[calm]`, `[excited]`, `[sad]`, `[angry]` - Emotional tone
- `[whispers]`, `[shouts]`, `[sighs]` - Delivery style
- `[short pause]`, `[long pause]` - Timing
- `[confused]`, `[determined]` - Character state

### Example Script:

```
# This is a comment and will be ignored
# Format: CharacterName|VoiceID: Dialogue text

Narrator|Z3R5wn05IrDiVCyEkUrK: [calm] The story begins in a distant land.
Hero|21m00Tcm4TlvDq8ikWAM: [confident] I will protect everyone!
Villain|AZnzlk1XvdvUeBnXmlld: [menacing] You cannot stop me, hero!
Hero|21m00Tcm4TlvDq8ikWAM: [determined] We'll see about that!
Narrator|Z3R5wn05IrDiVCyEkUrK: [dramatic] The battle begins...
```

## Important Notes:

1. **No Hardcoded Characters**: The system works with ANY character names
2. **Voice IDs Required**: Every line must include a valid ElevenLabs voice ID
3. **Comments Supported**: Lines starting with `#` are ignored
4. **Empty Lines Ignored**: Blank lines are skipped
5. **Audio Tags Preserved**: All `[tag]` content is passed to ElevenLabs for interpretation

## Voice ID Sources:

Common ElevenLabs voice IDs (you can use any valid voice ID):
- `Z3R5wn05IrDiVCyEkUrK` - Deep, narrator voice
- `21m00Tcm4TlvDq8ikWAM` - Male, confident voice  
- `AZnzlk1XvdvUeBnXmlld` - Female, clear voice
- `IKne3meq5aSn9XLyUdCD` - Male, warm voice

## Generation Guidelines for Gemini:

1. **Character Consistency**: Use the same voice ID for the same character throughout the script
2. **Voice Variety**: Use different voice IDs for different characters
3. **Audio Tags**: Add appropriate emotional and performance tags
4. **Format Compliance**: Always use `CharacterName|VoiceID: Dialogue` format
5. **Comments**: Add helpful comments with `#` for context

## Example Generation Prompt:

"Generate a script.txt file for a manga dialogue between a hero and villain. Use different voice IDs for each character and include audio tags for emotion and performance. Format each line as CharacterName|VoiceID: Dialogue text."
