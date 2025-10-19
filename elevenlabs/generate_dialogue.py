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
from dotenv import load_dotenv

# Load environment variables from .env files
# 1) Try repo root .env (../../.env)
_repo_root_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(_repo_root_env)
# 2) Also try agent-api/.env if present, so the API's env works for CLI modules
_agent_api_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'agent-api', '.env')
if os.path.exists(_agent_api_env):
    load_dotenv(_agent_api_env)

# Import config from same directory
from config import ELEVENLABS_API_KEY as ELEVENLABS_API_KEY_CONFIG

def _get_eleven_api_key() -> str:
    # Prefer environment, fallback to config file value
    env_key = os.getenv("ELEVENLABS_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()
    return ELEVENLABS_API_KEY_CONFIG


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
        tuple: (pages_data, scene_id) where:
            - pages_data: Dict with page numbers as keys, each containing dialogue_payload and transcript_data
            - scene_id: Title of the scene for output naming
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"JSON script file not found: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {str(e)}")
    
    # Group dialogue by page number
    pages_data = {}
    
    for entry in data.get('dialogue', []):
        speaker = entry.get('speaker', 'Unknown')
        voice_id = entry.get('voice_id', '')
        text = entry.get('text', '')
        page_number = entry.get('page_number', 1)
        
        if not voice_id:
            print(f"Warning: No voice_id for speaker '{speaker}', skipping")
            continue
        
        if not text.strip():
            print(f"Warning: Empty text for speaker '{speaker}', skipping")
            continue
        
        # Initialize page data if not exists
        if page_number not in pages_data:
            pages_data[page_number] = {
                'dialogue_payload': [],
                'transcript_data': []
            }
        
        # Add to dialogue payload for ElevenLabs
        pages_data[page_number]['dialogue_payload'].append({
            "text": text,
            "voice_id": voice_id
        })
        
        # Clean text for transcript (remove audio tags)
        clean_text = clean_audio_tags(text)
        
        # Add to transcript data
        pages_data[page_number]['transcript_data'].append({
            "speaker": speaker,
            "text": clean_text,
            "original_text": text,
            "voice_id": voice_id
        })
        
        print(f"Parsed Page {page_number}: {speaker} ({voice_id[:8]}...) -> {text[:50]}{'...' if len(text) > 50 else ''}")
    
    if not pages_data:
        raise ValueError("No valid dialogue found in JSON file")
    
    # Extract scene_id for output naming
    scene_id = data.get('scene_id', 'Unknown_Scene')
    
    total_entries = sum(len(page['dialogue_payload']) for page in pages_data.values())
    print(f"Successfully parsed {total_entries} dialogue entries across {len(pages_data)} pages")
    print(f"Scene ID: {scene_id}")
    return pages_data, scene_id


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
        ELEVENLABS_API_KEY = _get_eleven_api_key()
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
    
    # Check if we're processing a PDF file directly
    import sys
    if len(sys.argv) > 1 and sys.argv[1].endswith('.pdf'):
        # Process PDF directly to audio
        pdf_path = sys.argv[1]
        scene_id = sys.argv[2] if len(sys.argv) > 2 else None
        
        print(f"\n[INFO] Processing PDF directly: {pdf_path}")
        result = process_pdf_to_audio(pdf_path, scene_id)
        
        if result['success']:
            print(f"\n[OK] PDF processing complete!")
            print(f"[INFO] Scene ID: {result['scene_id']}")
            print(f"[INFO] Total pages: {result['total_pages']}")
            print(f"[INFO] Total duration: {result['total_duration']:.1f} seconds")
            print(f"[INFO] Generated {len(result['generated_files'])} file pairs")
        else:
            print(f"[ERROR] PDF processing failed: {result['error']}")
        return
    
    # Parse the JSON script file - accept any filename
    if len(sys.argv) > 1:
        # Use filename from command line argument
        script_filename = sys.argv[1]
    else:
        # Default to scene2.json
        script_filename = 'scene2.json'
    
    script_path = os.path.join(os.path.dirname(__file__), 'input', script_filename)
    try:
        print(f"\n[INFO] Parsing JSON script from: {script_path}")
        pages_data, scene_id = parse_json_script(script_path)
        
    except Exception as e:
        print(f"[ERROR] Error parsing JSON script: {str(e)}")
        return
    
    # Generate audio for each page separately
    try:
        print("\n[INFO] Generating audio with precise timing for each page...")
        print("This will take longer but provides accurate timestamps...")
        
        # Create output directory if it doesn't exist
        output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets')
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate timestamp for all files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Clean scene_id for filename (remove special characters)
        clean_scene_id = re.sub(r'[^\w\s-]', '', scene_id).strip()
        clean_scene_id = re.sub(r'[-\s]+', '_', clean_scene_id)
        
        total_duration = 0.0
        total_lines = 0
        
        # Process each page separately
        for page_number in sorted(pages_data.keys()):
            print(f"\n[INFO] Processing Page {page_number}...")
            
            page_data = pages_data[page_number]
            dialogue_payload = page_data['dialogue_payload']
            transcript_data = page_data['transcript_data']
            
            if not dialogue_payload:
                print(f"[WARNING] No dialogue found for page {page_number}, skipping")
                continue
            
            # Generate individual audio segments for precise timing
            audio_data, precise_timestamps = generate_individual_audio_segments(
                client, dialogue_payload, transcript_data
            )
            
            # Generate filenames with page number
            audio_filename = f"{clean_scene_id}_page{page_number:02d}_dialogue_{timestamp}.mp3"
            transcript_filename = f"{clean_scene_id}_page{page_number:02d}_transcript_{timestamp}.txt"
            
            audio_path = os.path.join(output_dir, audio_filename)
            transcript_path = os.path.join(output_dir, transcript_filename)
            
            print(f"[INFO] Saving page {page_number} audio to: assets/{audio_filename}")
            
            # Save the audio data
            with open(audio_path, 'wb') as audio_file:
                audio_file.write(audio_data)
            
            # Get page duration
            page_duration = get_audio_duration_from_mp3(audio_data)
            total_duration += page_duration
            
            print(f"[INFO] Generating precise transcript with timestamps for page {page_number}...")
            print(f"[INFO] Page {page_number} audio duration: {page_duration:.1f} seconds")
            
            # Generate transcript with precise timestamps
            transcript_content = generate_precise_transcript(precise_timestamps)
            
            # Save transcript file
            with open(transcript_path, 'w', encoding='utf-8') as transcript_file:
                transcript_file.write(transcript_content)
            
            total_lines += len(precise_timestamps)
            print(f"[OK] Page {page_number} complete!")
            print(f"[INFO] Audio file: assets/{audio_filename}")
            print(f"[INFO] Transcript file: assets/{transcript_filename}")
            print(f"[INFO] Page {page_number} duration: {page_duration:.1f} seconds")
            print(f"[INFO] Precise timestamps generated for {len(precise_timestamps)} lines")
        
        print(f"\n[OK] All pages audio generation complete!")
        print(f"[INFO] Total pages processed: {len(pages_data)}")
        print(f"[INFO] Total duration: {total_duration:.1f} seconds")
        print(f"[INFO] Total lines processed: {total_lines}")
        print(f"[INFO] Files saved to organized output folder")
        print(f"[INFO] You can now play the generated audio files and view the transcripts")
        
    except Exception as e:
        print(f"[ERROR] Error generating audio: {str(e)}")
        print("\nCommon issues:")
        print("- Check your ElevenLabs API key is valid")
        print("- Ensure you have sufficient credits in your ElevenLabs account")
        print("- Verify your voice IDs are correct")
        return


def process_pdf_to_audio(pdf_path, scene_id=None, gemini_api_key=None):
    """
    Process a PDF file directly to audio files without creating intermediate JSON files.
    
    This function:
    1. Processes PDF with Gemini to get JSON data
    2. Converts JSON to audio-ready format
    3. Generates audio files for each page
    4. Saves audio and transcript files to assets folder
    
    Args:
        pdf_path (str): Path to the PDF file
        scene_id (str, optional): Scene identifier (auto-generated if not provided)
        gemini_api_key (str, optional): Google AI API key (uses env var if not provided)
    
    Returns:
        dict: Processing results with file paths and metadata
    """
    print("PDF-to-Audio Direct Processing")
    print("=" * 50)
    
    try:
    # Import data_processing module (absolute import so it works from API context)
    from data_processing.standalone_pipeline import process_pdf
        
        # Step 1: Process PDF with Gemini to get JSON data
        print(f"[INFO] Processing PDF with Gemini: {pdf_path}")
        json_data = process_pdf(
            pdf_path=pdf_path,
            scene_id=scene_id,
            gemini_api_key=gemini_api_key
        )
        
        print(f"[INFO] Gemini processing complete")
        print(f"[INFO] Scene ID: {json_data.get('scene_id', 'Unknown')}")
        print(f"[INFO] Characters: {len(json_data.get('characters', {}))}")
        print(f"[INFO] Dialogue lines: {len(json_data.get('dialogue', []))}")
        
        # Step 2: Process the JSON data directly (no file I/O)
        print(f"[INFO] Converting JSON to audio format...")
        pages_data, scene_id = parse_json_data(json_data)
        
        # Step 3: Initialize ElevenLabs client
        ELEVENLABS_API_KEY = _get_eleven_api_key()
        if not ELEVENLABS_API_KEY or ELEVENLABS_API_KEY == "your_api_key_here":
            raise ValueError("ELEVENLABS_API_KEY not configured. "
                           "Please update the config.py file with your API key.")
        
        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        print("[OK] ElevenLabs client initialized successfully")
        
        # Step 4: Generate audio for each page
        print(f"\n[INFO] Generating audio for {len(pages_data)} pages...")
        
        # Generate timestamp for all files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Clean scene_id for filename (remove special characters)
        clean_scene_id = re.sub(r'[^\w\s-]', '', scene_id).strip()
        clean_scene_id = re.sub(r'[-\s]+', '_', clean_scene_id)
        
        total_duration = 0.0
        total_lines = 0
        generated_files = []
        
        # Process each page separately
        for page_number in sorted(pages_data.keys()):
            print(f"\n[INFO] Processing Page {page_number}...")
            
            page_data = pages_data[page_number]
            dialogue_payload = page_data['dialogue_payload']
            transcript_data = page_data['transcript_data']
            
            if not dialogue_payload:
                print(f"[WARNING] No dialogue found for page {page_number}, skipping")
                continue
            
            # Generate individual audio segments for precise timing
            audio_data, precise_timestamps = generate_individual_audio_segments(
                client, dialogue_payload, transcript_data
            )
            
            # Generate filenames with page number
            audio_filename = f"{clean_scene_id}_page{page_number:02d}_dialogue_{timestamp}.mp3"
            transcript_filename = f"{clean_scene_id}_page{page_number:02d}_transcript_{timestamp}.txt"
            
            print(f"[INFO] Generated page {page_number} audio in memory: {audio_filename}")
            
            # Get page duration
            page_duration = get_audio_duration_from_mp3(audio_data)
            total_duration += page_duration
            
            print(f"[INFO] Generating precise transcript with timestamps for page {page_number}...")
            print(f"[INFO] Page {page_number} audio duration: {page_duration:.1f} seconds")
            
            # Generate transcript with precise timestamps
            transcript_content = generate_precise_transcript(precise_timestamps)
            
            # Transcript generated in memory
            
            total_lines += len(precise_timestamps)
            generated_files.append({
                'page': page_number,
                'audio_file': audio_filename,
                'transcript_file': transcript_filename,
                'duration': page_duration,
                'audio_bytes_len': len(audio_data),
                'transcript_preview': transcript_content[:80]
            })
            
            print(f"[OK] Page {page_number} complete!")
            print(f"[INFO] Audio file: assets/{audio_filename}")
            print(f"[INFO] Transcript file: assets/{transcript_filename}")
            print(f"[INFO] Page {page_number} duration: {page_duration:.1f} seconds")
            print(f"[INFO] Precise timestamps generated for {len(precise_timestamps)} lines")
        
        print(f"\n[OK] All pages audio generation complete!")
        print(f"[INFO] Total pages processed: {len(pages_data)}")
        print(f"[INFO] Total duration: {total_duration:.1f} seconds")
        print(f"[INFO] Total lines processed: {total_lines}")
        print(f"[INFO] Files generated in memory (not saved to local assets in this function)")
        
        return {
            'success': True,
            'scene_id': scene_id,
            'total_pages': len(pages_data),
            'total_duration': total_duration,
            'total_lines': total_lines,
            'generated_files': generated_files
        }
        
    except Exception as e:
        print(f"[ERROR] Error processing PDF: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def process_pdf_to_audio_uploading(pdf_path, scene_id=None, gemini_api_key=None, upload_fn=None, progress_fn=None):
    """
    Process a PDF and upload generated audio/transcripts via a provided upload_fn.

    upload_fn signature: (object_name: str, data: bytes | str, content_type: str) -> str
      - object_name: filename to place under a folder decided by caller
      - data: bytes for mp3, str for txt (we will encode as utf-8 if str provided)
      - content_type: e.g., "audio/mpeg" or "text/plain"
      - returns: an identifier or URL for the uploaded object (ignored here)

    Returns a dict similar to process_pdf_to_audio but with uploaded object names.
    """
    if upload_fn is None:
        raise ValueError("upload_fn is required to upload outputs instead of saving locally")

    print("PDF-to-Audio Direct Processing (uploading outputs)")
    print("=" * 50)

    try:
    # Import data_processing module (absolute import so it works from API context)
    from data_processing.standalone_pipeline import process_pdf

        # Step 1: Process PDF with Gemini to get JSON data
        print(f"[INFO] Processing PDF with Gemini: {pdf_path}")
        json_data = process_pdf(
            pdf_path=pdf_path,
            scene_id=scene_id,
            gemini_api_key=gemini_api_key
        )

        print(f"[INFO] Gemini processing complete")
        print(f"[INFO] Scene ID: {json_data.get('scene_id', 'Unknown')}")
        print(f"[INFO] Characters: {len(json_data.get('characters', {}))}")
        print(f"[INFO] Dialogue lines: {len(json_data.get('dialogue', []))}")

        # Step 2: Process the JSON data directly (no file I/O)
        print(f"[INFO] Converting JSON to audio format...")
        pages_data, scene_id = parse_json_data(json_data)
        if progress_fn:
            try:
                progress_fn({
                    'event': 'start',
                    'scene_id': scene_id,
                    'total_pages': len(pages_data)
                })
            except Exception:
                pass

        # Step 3: Initialize ElevenLabs client
        ELEVENLABS_API_KEY = _get_eleven_api_key()
        if not ELEVENLABS_API_KEY or ELEVENLABS_API_KEY == "your_api_key_here":
            raise ValueError("ELEVENLABS_API_KEY not configured. "
                           "Please update the config.py file with your API key.")

        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        print("[OK] ElevenLabs client initialized successfully")

        # Step 4: Generate audio for each page and upload
        print(f"\n[INFO] Generating audio for {len(pages_data)} pages (uploading)...")

        # Generate timestamp for all files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Clean scene_id for filename (remove special characters)
        clean_scene_id = re.sub(r'[^\w\s-]', '', scene_id).strip()
        clean_scene_id = re.sub(r'[-\s]+', '_', clean_scene_id)

        total_duration = 0.0
        total_lines = 0
        generated_files = []

        # Process each page separately
        for page_number in sorted(pages_data.keys()):
            print(f"\n[INFO] Processing Page {page_number}...")
            if progress_fn:
                try:
                    progress_fn({'event': 'page_start', 'page': page_number})
                except Exception:
                    pass

            page_data = pages_data[page_number]
            dialogue_payload = page_data['dialogue_payload']
            transcript_data = page_data['transcript_data']

            if not dialogue_payload:
                print(f"[WARNING] No dialogue found for page {page_number}, skipping")
                continue

            # Generate individual audio segments for precise timing
            audio_data, precise_timestamps = generate_individual_audio_segments(
                client, dialogue_payload, transcript_data
            )

            # Generate filenames with page number
            audio_filename = f"{clean_scene_id}_page{page_number:02d}_dialogue_{timestamp}.mp3"
            transcript_filename = f"{clean_scene_id}_page{page_number:02d}_transcript_{timestamp}.txt"

            print(f"[INFO] Uploading page {page_number} audio: {audio_filename}")

            # Upload the audio data
            audio_ref = upload_fn(audio_filename, audio_data, "audio/mpeg")

            # Get page duration
            page_duration = get_audio_duration_from_mp3(audio_data)
            total_duration += page_duration

            print(f"[INFO] Generating precise transcript with timestamps for page {page_number}...")
            print(f"[INFO] Page {page_number} audio duration: {page_duration:.1f} seconds")

            # Generate transcript with precise timestamps
            transcript_content = generate_precise_transcript(precise_timestamps)

            # Upload transcript file
            transcript_ref = upload_fn(transcript_filename, transcript_content.encode('utf-8'), "text/plain")

            total_lines += len(precise_timestamps)
            generated_files.append({
                'page': page_number,
                'audio_file': audio_filename,
                'transcript_file': transcript_filename,
                'duration': page_duration,
                'audio_uploaded': audio_ref,
                'transcript_uploaded': transcript_ref
            })

            print(f"[OK] Page {page_number} uploaded!")
            if progress_fn:
                try:
                    progress_fn({
                        'event': 'page_uploaded',
                        'page': page_number,
                        'audio_file': audio_filename,
                        'transcript_file': transcript_filename,
                        'duration': page_duration
                    })
                except Exception:
                    pass
            print(f"[INFO] Audio file: {audio_filename}")
            print(f"[INFO] Transcript file: {transcript_filename}")
            print(f"[INFO] Page {page_number} duration: {page_duration:.1f} seconds")
            print(f"[INFO] Precise timestamps generated for {len(precise_timestamps)} lines")

        print(f"\n[OK] All pages audio generation complete and uploaded!")
        print(f"[INFO] Total pages processed: {len(pages_data)}")
        print(f"[INFO] Total duration: {total_duration:.1f} seconds")
        print(f"[INFO] Total lines processed: {total_lines}")
        if progress_fn:
            try:
                progress_fn({
                    'event': 'complete',
                    'scene_id': scene_id,
                    'total_pages': len(pages_data),
                    'total_duration': total_duration
                })
            except Exception:
                pass

        return {
            'success': True,
            'scene_id': scene_id,
            'total_pages': len(pages_data),
            'total_duration': total_duration,
            'total_lines': total_lines,
            'generated_files': generated_files
        }

    except Exception as e:
        print(f"[ERROR] Error processing PDF (upload path): {str(e)}")
        if progress_fn:
            try:
                progress_fn({'event': 'error', 'error': str(e)})
            except Exception:
                pass
        return {
            'success': False,
            'error': str(e)
        }


def parse_json_data(json_data):
    """
    Parse JSON data directly (no file I/O) into the format required by the ElevenLabs API.
    
    Args:
        json_data (dict): JSON data from Gemini processing
        
    Returns:
        tuple: (pages_data, scene_id) where:
            - pages_data: Dict with page numbers as keys, each containing dialogue_payload and transcript_data
            - scene_id: Title of the scene for output naming
    """
    # Group dialogue by page number
    pages_data = {}
    
    for entry in json_data.get('dialogue', []):
        speaker = entry.get('speaker', 'Unknown')
        voice_id = entry.get('voice_id', '')
        text = entry.get('text', '')
        page_number = entry.get('page_number', 1)
        
        if not voice_id:
            print(f"Warning: No voice_id for speaker '{speaker}', skipping")
            continue
        
        if not text.strip():
            print(f"Warning: Empty text for speaker '{speaker}', skipping")
            continue
        
        # Initialize page data if not exists
        if page_number not in pages_data:
            pages_data[page_number] = {
                'dialogue_payload': [],
                'transcript_data': []
            }
        
        # Add to dialogue payload for ElevenLabs
        pages_data[page_number]['dialogue_payload'].append({
            "text": text,
            "voice_id": voice_id
        })
        
        # Clean text for transcript (remove audio tags)
        clean_text = clean_audio_tags(text)
        
        # Add to transcript data
        pages_data[page_number]['transcript_data'].append({
            "speaker": speaker,
            "text": clean_text,
            "original_text": text,
            "voice_id": voice_id
        })
        
        print(f"Parsed Page {page_number}: {speaker} ({voice_id[:8]}...) -> {text[:50]}{'...' if len(text) > 50 else ''}")
    
    if not pages_data:
        raise ValueError("No valid dialogue found in JSON data")
    
    # Extract scene_id for output naming
    scene_id = json_data.get('scene_id', 'Unknown_Scene')
    
    total_entries = sum(len(page['dialogue_payload']) for page in pages_data.values())
    print(f"Successfully parsed {total_entries} dialogue entries across {len(pages_data)} pages")
    print(f"Scene ID: {scene_id}")
    return pages_data, scene_id


if __name__ == "__main__":
    main()
