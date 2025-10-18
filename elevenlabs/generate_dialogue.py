#!/usr/bin/env python3
"""
ElevenLabs v3 Dialogue Generation Backend

This script converts manga dialogue scripts into immersive audio experiences using
the ElevenLabs Text-to-Dialogue API with the eleven_v3 model. It reads specially
formatted script files and generates multi-speaker audio conversations.

Author: HackTX25 Manga Narration Project
"""

import os
import uuid
import sys
import json
import re
import wave
import io
import time
from datetime import datetime, timedelta
from elevenlabs.client import ElevenLabs

# Import config from same directory
from config import ELEVENLABS_API_KEY


def parse_json_script(file_path):
    """
    Parse a JSON script file into the format required by the ElevenLabs API.
    
    The JSON file should contain:
    - page_id, scene_title, ambient (metadata)
    - characters: dict with voice_id and expression for each character
    - dialogue: list of dialogue entries with speaker, voice_id, and text
    - metadata: generation info
    
    Args:
        file_path (str): Path to the JSON script file
        
    Returns:
        tuple: (dialogue_payload, transcript_data) where:
            - dialogue_payload: List of dicts for ElevenLabs API
            - transcript_data: List of dicts with speaker, text, and timing info
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"JSON script file not found: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {str(e)}")
    
    # Extract dialogue data
    dialogue_payload = []
    transcript_data = []
    
    for entry in data.get('dialogue', []):
        speaker = entry.get('speaker', 'Unknown')
        voice_id = entry.get('voice_id', '')
        text = entry.get('text', '')
        
        if not voice_id:
            print(f"Warning: No voice_id for speaker '{speaker}', skipping")
            continue
        
        if not text.strip():
            print(f"Warning: Empty text for speaker '{speaker}', skipping")
            continue
        
        # Add to dialogue payload for ElevenLabs
        dialogue_payload.append({
            "text": text,
            "voice_id": voice_id
        })
        
        # Clean text for transcript (remove audio tags)
        clean_text = clean_audio_tags(text)
        
        # Add to transcript data
        transcript_data.append({
            "speaker": speaker,
            "text": clean_text,
            "original_text": text,
            "voice_id": voice_id
        })
        
        print(f"Parsed: {speaker} ({voice_id[:8]}...) -> {text[:50]}{'...' if len(text) > 50 else ''}")
    
    if not dialogue_payload:
        raise ValueError("No valid dialogue found in JSON file")
    
    print(f"Successfully parsed {len(dialogue_payload)} dialogue entries")
    return dialogue_payload, transcript_data


def clean_audio_tags(text):
    """
    Remove audio tags from text for clean transcript.
    
    Args:
        text (str): Text with audio tags like [calm], [angry], etc.
        
    Returns:
        str: Clean text without audio tags
    """
    # Remove audio tags in square brackets
    clean_text = re.sub(r'\[.*?\]', '', text)
    
    # Clean up extra whitespace
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    
    return clean_text


def get_audio_duration_from_mp3(audio_data):
    """
    Get the actual duration of MP3 audio data.
    
    Args:
        audio_data (bytes): Raw MP3 audio data
        
    Returns:
        float: Duration in seconds
    """
    try:
        # For MP3 files, we can estimate duration based on bitrate
        # 128kbps = 128 * 1000 / 8 = 16000 bytes per second
        # This is more accurate than the previous method
        bitrate_bps = 128 * 1000  # 128kbps in bits per second
        bytes_per_second = bitrate_bps / 8  # Convert to bytes per second
        
        duration = len(audio_data) / bytes_per_second
        return duration
    except Exception as e:
        print(f"Warning: Could not calculate audio duration: {e}")
        # Fallback: estimate based on file size
        return len(audio_data) / (128 * 1024 / 8)


def calculate_speech_timing(text, base_rate=3.0):
    """
    Calculate estimated speech timing based on text content.
    
    Args:
        text (str): Text to be spoken
        base_rate (float): Base words per second rate
        
    Returns:
        float: Estimated duration in seconds
    """
    # Count words (rough estimate)
    words = len(text.split())
    
    # Adjust rate based on text characteristics
    if '...' in text or '…' in text:
        # Pauses in text
        words += 1
    
    if text.isupper():
        # Shouting might be slower
        base_rate *= 0.8
    
    if len(text) > 100:
        # Longer text might have natural pauses
        base_rate *= 0.9
    
    # Calculate duration
    duration = words / base_rate
    
    # Minimum duration for very short text
    return max(duration, 0.5)


def generate_transcript_with_timestamps(transcript_data, audio_duration_seconds):
    """
    Generate a transcript file with accurate timestamps based on actual audio duration.
    
    Args:
        transcript_data (list): List of transcript entries
        audio_duration_seconds (float): Total audio duration in seconds
        
    Returns:
        str: Formatted transcript with timestamps
    """
    if not transcript_data:
        return ""
    
    # Calculate individual line durations based on text content
    line_durations = []
    total_estimated_duration = 0.0
    
    for entry in transcript_data:
        text = entry['text']
        duration = calculate_speech_timing(text)
        line_durations.append(duration)
        total_estimated_duration += duration
    
    # Scale durations to match actual audio length
    if total_estimated_duration > 0:
        scale_factor = audio_duration_seconds / total_estimated_duration
        line_durations = [d * scale_factor for d in line_durations]
    
    transcript_lines = []
    current_time = 0.0
    
    for i, entry in enumerate(transcript_data):
        speaker = entry['speaker']
        text = entry['text']
        
        # Format timestamp as MM:SS
        minutes = int(current_time // 60)
        seconds = int(current_time % 60)
        timestamp = f"{minutes:02d}:{seconds:02d}"
        
        # Add transcript line
        transcript_lines.append(f"{timestamp} {speaker}: {text}")
        
        # Move to next line timing
        if i < len(line_durations):
            current_time += line_durations[i]
    
    return "\n".join(transcript_lines)


def generate_individual_audio_segments(client, dialogue_payload, transcript_data):
    """
    Generate individual audio segments for each dialogue line to get precise timing.
    
    Args:
        client: ElevenLabs client
        dialogue_payload (list): List of dialogue entries for API
        transcript_data (list): List of transcript entries
        
    Returns:
        tuple: (combined_audio_data, precise_timestamps)
    """
    print(f"[INFO] Generating individual audio segments for precise timing...")
    
    individual_audio_segments = []
    precise_timestamps = []
    current_time = 0.0
    
    for i, (dialogue_entry, transcript_entry) in enumerate(zip(dialogue_payload, transcript_data)):
        speaker = transcript_entry['speaker']
        text = transcript_entry['text']
        
        print(f"[INFO] Processing line {i+1}/{len(dialogue_payload)}: {speaker}")
        
        try:
            # Generate individual audio for this line
            audio_stream = client.text_to_dialogue.convert(
                inputs=[dialogue_entry],  # Single line
                model_id="eleven_v3",
                output_format="mp3_44100_128"
            )
            
            # Collect audio data
            audio_data = b""
            for chunk in audio_stream:
                audio_data += chunk
            
            # Calculate precise duration for this segment
            segment_duration = get_audio_duration_from_mp3(audio_data)
            
            # Store segment and timing
            individual_audio_segments.append(audio_data)
            precise_timestamps.append({
                'speaker': speaker,
                'text': text,
                'start_time': current_time,
                'duration': segment_duration,
                'end_time': current_time + segment_duration
            })
            
            # Update current time for next segment
            current_time += segment_duration
            
            print(f"[INFO] Line {i+1} duration: {segment_duration:.2f}s (total: {current_time:.2f}s)")
            
        except Exception as e:
            print(f"[WARNING] Error generating audio for line {i+1}: {e}")
            # Add placeholder timing
            precise_timestamps.append({
                'speaker': speaker,
                'text': text,
                'start_time': current_time,
                'duration': 1.0,  # Fallback duration
                'end_time': current_time + 1.0
            })
            current_time += 1.0
    
    # Combine all audio segments
    combined_audio = b"".join(individual_audio_segments)
    
    return combined_audio, precise_timestamps


def generate_precise_transcript(precise_timestamps):
    """
    Generate transcript with precise timestamps from individual audio segments.
    
    Args:
        precise_timestamps (list): List of timing data for each line
        
    Returns:
        str: Formatted transcript with precise timestamps
    """
    transcript_lines = []
    
    for entry in precise_timestamps:
        speaker = entry['speaker']
        text = entry['text']
        start_time = entry['start_time']
        
        # Format timestamp as MM:SS
        minutes = int(start_time // 60)
        seconds = int(start_time % 60)
        timestamp = f"{minutes:02d}:{seconds:02d}"
        
        # Add transcript line
        transcript_lines.append(f"{timestamp} {speaker}: {text}")
    
    return "\n".join(transcript_lines)


def main():
    """
    Main function that orchestrates the dialogue generation process.
    
    This function:
    1. Loads environment variables and initializes the ElevenLabs client
    2. Parses the script file into the required API format
    3. Calls the ElevenLabs Text-to-Dialogue API
    4. Saves the generated audio stream to a unique MP3 file
    """
    print("ElevenLabs v3 Dialogue Generation Backend")
    print("=" * 50)
    
    # Initialize ElevenLabs client
    try:
        if not ELEVENLABS_API_KEY or ELEVENLABS_API_KEY == "your_api_key_here":
            raise ValueError("ELEVENLABS_API_KEY not configured. "
                           "Please update the config.py file with your API key.")
        
        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        print("[OK] ElevenLabs client initialized successfully")
        
    except Exception as e:
        print(f"[ERROR] Error initializing ElevenLabs client: {str(e)}")
        print("\nPlease ensure you have:")
        print("1. Updated the config.py file in the elevenlabs directory")
        print("2. Added your ElevenLabs API key to the ELEVENLABS_API_KEY variable")
        return
    
    # Parse the JSON script file
    script_path = os.path.join(os.path.dirname(__file__), 'input', 'input.json')
    try:
        print(f"\n[INFO] Parsing JSON script from: {script_path}")
        dialogue_payload, transcript_data = parse_json_script(script_path)
        
    except Exception as e:
        print(f"[ERROR] Error parsing JSON script: {str(e)}")
        return
    
    # Generate audio using precise individual segments for accurate timing
    try:
        print("\n[INFO] Generating audio with precise timing using individual segments...")
        print("This will take longer but provides accurate timestamps...")
        
        # Generate individual audio segments for precise timing
        audio_data, precise_timestamps = generate_individual_audio_segments(
            client, dialogue_payload, transcript_data
        )
        
        # Generate timestamp-based filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        audio_filename = f"dialogue_output_{timestamp}.mp3"
        transcript_filename = f"transcript_{timestamp}.txt"
        
        # Create output directory if it doesn't exist
        output_dir = os.path.join(os.path.dirname(__file__), 'output')
        os.makedirs(output_dir, exist_ok=True)
        
        audio_path = os.path.join(output_dir, audio_filename)
        transcript_path = os.path.join(output_dir, transcript_filename)
        
        print(f"[INFO] Saving combined audio to: output/{audio_filename}")
        
        # Save the combined audio data
        with open(audio_path, 'wb') as audio_file:
            audio_file.write(audio_data)
        
        # Get total duration
        total_duration = get_audio_duration_from_mp3(audio_data)
        
        print(f"[INFO] Generating precise transcript with timestamps...")
        print(f"[INFO] Total audio duration: {total_duration:.1f} seconds")
        
        # Generate transcript with precise timestamps
        transcript_content = generate_precise_transcript(precise_timestamps)
        
        # Save transcript file
        with open(transcript_path, 'w', encoding='utf-8') as transcript_file:
            transcript_file.write(transcript_content)
        
        print(f"[OK] Audio generation complete!")
        print(f"[INFO] Audio file: output/{audio_filename}")
        print(f"[INFO] Transcript file: output/{transcript_filename}")
        print(f"[INFO] Total duration: {total_duration:.1f} seconds")
        print(f"[INFO] Precise timestamps generated for {len(precise_timestamps)} lines")
        print(f"[INFO] Files saved to organized output folder")
        print(f"[INFO] You can now play the generated audio file and view the transcript")
        
    except Exception as e:
        print(f"[ERROR] Error generating audio: {str(e)}")
        print("\nCommon issues:")
        print("- Check your ElevenLabs API key is valid")
        print("- Ensure you have sufficient credits in your ElevenLabs account")
        print("- Verify your voice IDs are correct")
        return


if __name__ == "__main__":
    main()
