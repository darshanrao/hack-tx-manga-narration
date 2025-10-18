#!/bin/bash

# Manga-to-Audio Pipeline CLI
# Command-line interface for the complete manga processing pipeline

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎨 Manga-to-Audio Pipeline CLI${NC}"
echo "=================================="

# Check if virtual environment is activated
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo -e "${YELLOW}⚠️ Virtual environment not activated!${NC}"
    echo "Please run: source venv/bin/activate"
    echo "Or use: ./activate.sh"
    exit 1
fi

# Check for required files
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please run ./setup.sh first to create the environment"
    exit 1
fi

# Check for API key
if ! grep -q "GOOGLE_API_KEY=" .env || grep -q "GOOGLE_API_KEY=your_api_key_here" .env; then
    echo -e "${RED}❌ Google API key not configured!${NC}"
    echo "Please edit .env file and add your Google AI API key"
    echo "Get your API key from: https://makersuite.google.com/app/apikey"
    exit 1
fi

echo -e "${GREEN}✅ Environment ready${NC}"
echo ""

# Function to process single image
process_single_image() {
    local image_path="$1"
    local page_id="$2"
    local scene_title="$3"
    
    echo -e "${BLUE}Processing single image: $image_path${NC}"
    
    python3 -c "
from manga_to_audio_pipeline import MangaToAudioPipeline
import os
from dotenv import load_dotenv

load_dotenv()

pipeline = MangaToAudioPipeline(
    output_dir='scenes',
    gemini_api_key=os.getenv('GOOGLE_API_KEY')
)

try:
    result = pipeline.process_manga_page(
        '$image_path',
        page_id='$page_id' if '$page_id' else None,
        scene_title='$scene_title' if '$scene_title' else None
    )
    
    print(f'✅ Successfully processed: {result[\"page_id\"]}')
    print(f'📖 Scene: {result[\"scene_title\"]}')
    print(f'👥 Characters: {len(result[\"characters\"])}')
    print(f'💬 Dialogue lines: {len(result[\"dialogue\"])}')
    
except Exception as e:
    print(f'❌ Error: {e}')
    exit(1)
"
}

# Function to process directory
process_directory() {
    local image_dir="$1"
    local file_pattern="$2"
    
    echo -e "${BLUE}Processing directory: $image_dir${NC}"
    echo -e "${BLUE}File pattern: $file_pattern${NC}"
    
    python3 -c "
from manga_to_audio_pipeline import MangaToAudioPipeline
import os
from dotenv import load_dotenv

load_dotenv()

pipeline = MangaToAudioPipeline(
    output_dir='scenes',
    gemini_api_key=os.getenv('GOOGLE_API_KEY')
)

try:
    results = pipeline.process_multiple_pages(
        '$image_dir',
        file_pattern='$file_pattern'
    )
    
    successful = [r for r in results if 'error' not in r]
    failed = [r for r in results if 'error' in r]
    
    print(f'✅ Successfully processed: {len(successful)} pages')
    if failed:
        print(f'❌ Failed: {len(failed)} pages')
        for result in failed:
            print(f'  - {result[\"page_id\"]}: {result[\"error\"]}')
    
    print(f'📁 Output saved to: scenes/')
    
except Exception as e:
    print(f'❌ Error: {e}')
    exit(1)
"
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  single <image_path> [page_id] [scene_title]  Process a single manga page"
    echo "  directory <image_dir> [pattern]              Process all images in directory"
    echo "  status                                       Show pipeline status"
    echo "  voices                                       Show voice assignments"
    echo "  help                                         Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 single Chapters/scene-1_page_1.png ch01_p01 \"Opening Scene\""
    echo "  $0 directory Chapters/ \"*.png\""
    echo "  $0 directory extracted_pages/ \"*.jpg\""
    echo ""
    echo "File patterns:"
    echo "  *.png    - PNG images (default)"
    echo "  *.jpg    - JPEG images"
    echo "  *.jpeg   - JPEG images"
    echo "  *        - All image files"
}

# Function to show status
show_status() {
    echo -e "${BLUE}Pipeline Status${NC}"
    echo "==============="
    
    python3 -c "
from manga_to_audio_pipeline import MangaToAudioPipeline
import os
from dotenv import load_dotenv

load_dotenv()

pipeline = MangaToAudioPipeline(
    output_dir='scenes',
    gemini_api_key=os.getenv('GOOGLE_API_KEY')
)

status = pipeline.get_pipeline_status()
print(f'Output Directory: {status[\"output_directory\"]}')
print(f'Vision Model: {status[\"vision_model\"]}')
print(f'Enhancement Model: {status[\"enhancement_model\"]}')
print(f'Pipeline Ready: {status[\"pipeline_ready\"]}')

voice_stats = status['voice_registry_stats']
print(f'Total Characters: {voice_stats[\"total_characters\"]}')
print(f'Unique Voices Used: {voice_stats[\"total_voices_used\"]}')
"
}

# Function to show voices
show_voices() {
    echo -e "${BLUE}Voice Assignments${NC}"
    echo "=================="
    
    python3 -c "
from manga_to_audio_pipeline import MangaToAudioPipeline
import os
from dotenv import load_dotenv

load_dotenv()

pipeline = MangaToAudioPipeline(
    output_dir='scenes',
    gemini_api_key=os.getenv('GOOGLE_API_KEY')
)

assignments = pipeline.voice_registry.get_all_assignments()
if assignments:
    for char_name, char_data in assignments.items():
        print(f'{char_name}: {char_data[\"voice_id\"]} ({char_data[\"character_type\"]})')
else:
    print('No voice assignments yet.')
"
}

# Main command handling
case "$1" in
    "single")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: Image path required${NC}"
            show_help
            exit 1
        fi
        process_single_image "$2" "$3" "$4"
        ;;
    "directory")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: Directory path required${NC}"
            show_help
            exit 1
        fi
        pattern="${3:-*.png}"
        process_directory "$2" "$pattern"
        ;;
    "status")
        show_status
        ;;
    "voices")
        show_voices
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        echo -e "${YELLOW}No command specified${NC}"
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
