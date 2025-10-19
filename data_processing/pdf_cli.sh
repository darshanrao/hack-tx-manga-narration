#!/bin/bash

# Complete PDF-to-Audio Pipeline CLI
# Command-line interface for the full PDF-to-narration workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🎨 Complete PDF-to-Audio Pipeline CLI${NC}"
echo "============================================="

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

# Function to process single PDF
process_single_pdf() {
    local pdf_path="$1"
    local scene_id="$2"
    local extract_images="$3"
    
    echo -e "${BLUE}Processing PDF: $pdf_path${NC}"
    if [ "$scene_id" ]; then
        echo -e "${BLUE}Scene ID: $scene_id${NC}"
    fi
    
    python3 -c "
from pdf_to_audio_pipeline import PDFToAudioPipeline
import os
from dotenv import load_dotenv

load_dotenv()

pipeline = PDFToAudioPipeline(
    output_dir='scenes',
    gemini_api_key=os.getenv('GOOGLE_API_KEY'),
    batch_size=5
)

try:
    result = pipeline.process_pdf_scene(
        '$pdf_path',
        scene_id='$scene_id' if '$scene_id' else None,
        extract_images=$extract_images,
        cleanup_images=True
    )
    
    print(f'✅ Successfully processed scene: {result[\"scene_id\"]}')
    print(f'📄 Total pages: {result[\"total_pages\"]}')
    print(f'✅ Successful pages: {result[\"successful_pages\"]}')
    print(f'❌ Failed pages: {result[\"failed_pages\"]}')
    print(f'👥 Characters: {len(result[\"voice_assignments\"])}')
    print(f'📁 Output directory: {result[\"output_directory\"]}')
    
    # Show character voice assignments
    print(f'\\n🎭 Character Voice Assignments:')
    for char_name, voice_id in result['voice_assignments'].items():
        print(f'  {char_name}: {voice_id}')
    
except Exception as e:
    print(f'❌ Error: {e}')
    exit(1)
"
}

# Function to process directory
process_directory() {
    local pdf_dir="$1"
    local extract_images="$2"
    
    echo -e "${BLUE}Processing PDF directory: $pdf_dir${NC}"
    
    python3 -c "
from pdf_to_audio_pipeline import PDFToAudioPipeline
import os
from dotenv import load_dotenv

load_dotenv()

pipeline = PDFToAudioPipeline(
    output_dir='scenes',
    gemini_api_key=os.getenv('GOOGLE_API_KEY'),
    batch_size=5
)

try:
    results = pipeline.process_multiple_pdfs(
        '$pdf_dir',
        extract_images=$extract_images,
        cleanup_images=True
    )
    
    successful_scenes = [r for r in results if 'error' not in r]
    failed_scenes = [r for r in results if 'error' in r]
    
    print(f'✅ Successfully processed: {len(successful_scenes)} scenes')
    if failed_scenes:
        print(f'❌ Failed: {len(failed_scenes)} scenes')
        for result in failed_scenes:
            print(f'  - {result[\"scene_id\"]}: {result[\"error\"]}')
    
    # Show summary
    summary = pipeline.get_processing_summary(results)
    print(f'\\n📊 Processing Summary:')
    print(summary)
    
    print(f'📁 Output saved to: scenes/')
    
except Exception as e:
    print(f'❌ Error: {e}')
    exit(1)
"
}

# Function to show pipeline status
show_status() {
    echo -e "${BLUE}Pipeline Status${NC}"
    echo "==============="
    
    python3 -c "
from pdf_to_audio_pipeline import PDFToAudioPipeline
import os
from dotenv import load_dotenv

load_dotenv()

pipeline = PDFToAudioPipeline(
    output_dir='scenes',
    gemini_api_key=os.getenv('GOOGLE_API_KEY'),
    batch_size=5
)

status = pipeline.get_pipeline_status()
print(f'Output Directory: {status[\"output_directory\"]}')
print(f'Vision Model: {status[\"vision_model\"]}')
print(f'Enhancement Model: {status[\"enhancement_model\"]}')
print(f'PDF DPI: {status[\"pdf_processor_dpi\"]}')
print(f'Pipeline Ready: {status[\"pipeline_ready\"]}')

char_stats = status['character_statistics']
print(f'\\nCharacter Statistics:')
print(f'Total Characters: {char_stats[\"total_characters\"]}')
print(f'Total Scenes: {char_stats[\"total_scenes\"]}')
print(f'Unique Voices Used: {char_stats[\"unique_voices_used\"]}')
print(f'Most Appearing Character: {char_stats[\"most_appearing_character\"] or \"None\"}')
"
}

# Function to show character consistency
show_characters() {
    echo -e "${BLUE}Character Consistency Report${NC}"
    echo "============================="
    
    python3 -c "
from character_consistency_manager import CharacterConsistencyManager

manager = CharacterConsistencyManager()
summary = manager.get_consistency_summary()
print(summary)

print(f'\\n🎭 Character Details:')
characters = manager.consistency_data['characters']
for char_name, char_data in characters.items():
    print(f'  {char_name}:')
    print(f'    Voice: {char_data[\"voice_id\"]}')
    print(f'    Type: {char_data[\"character_type\"]}')
    print(f'    Scenes: {len(char_data[\"scenes\"])}')
    print(f'    Last Seen: {char_data[\"last_seen\"]}')
    print()
"
}

# Function to export reports
export_reports() {
    echo -e "${BLUE}Exporting Reports${NC}"
    echo "=================="
    
    python3 -c "
from pdf_to_audio_pipeline import PDFToAudioPipeline
import os
from dotenv import load_dotenv

load_dotenv()

pipeline = PDFToAudioPipeline(
    output_dir='scenes',
    gemini_api_key=os.getenv('GOOGLE_API_KEY'),
    batch_size=5
)

# Export character consistency report
pipeline.export_character_report('scenes/character_consistency_report.json')
print('✅ Character consistency report exported to: scenes/character_consistency_report.json')

# Export voice assignments
pipeline.consistency_manager.voice_registry.export_registry('scenes/voice_assignments.json')
print('✅ Voice assignments exported to: scenes/voice_assignments.json')
"
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  pdf <pdf_path> [scene_id] [extract_images]     Process a single PDF"
    echo "  directory <pdf_dir> [extract_images]           Process all PDFs in directory"
    echo "  status                                          Show pipeline status"
    echo "  characters                                      Show character consistency"
    echo "  export                                          Export reports"
    echo "  help                                            Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 pdf Chapters/scene-1.pdf ch01 true"
    echo "  $0 pdf Chapters/scene-1.pdf ch01 false"
    echo "  $0 directory Chapters/ true"
    echo "  $0 directory Chapters/ false"
    echo ""
    echo "Options:"
    echo "  extract_images: true/false (default: true)"
    echo "    - true: Extract and save page images"
    echo "    - false: Process images in memory only"
    echo ""
    echo "Workflow:"
    echo "  1. First pass: Analyze all pages for character consistency"
    echo "  2. Assign consistent voices to all characters"
    echo "  3. Second pass: Process each page with audio tags"
    echo "  4. Generate ElevenLabs-ready JSON for each page"
    echo ""
    echo "Output:"
    echo "  - scenes/page_*.json: Individual page JSON files"
    echo "  - scenes/*_scene_summary.json: Scene summaries"
    echo "  - scenes/character_consistency_report.json: Character report"
    echo "  - scenes/voice_assignments.json: Voice assignments"
}

# Main command handling
case "$1" in
    "pdf")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: PDF path required${NC}"
            show_help
            exit 1
        fi
        extract_images="${4:-True}"
        process_single_pdf "$2" "$3" "$extract_images"
        ;;
    "directory")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: Directory path required${NC}"
            show_help
            exit 1
        fi
        extract_images="${3:-True}"
        process_directory "$2" "$extract_images"
        ;;
    "status")
        show_status
        ;;
    "characters")
        show_characters
        ;;
    "export")
        export_reports
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
