#!/bin/bash

# Manga Analysis Pipeline - Environment Activation Script
# This script activates the virtual environment and provides helpful commands

echo "🎨 Manga Analysis Pipeline Environment"
echo "======================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "   Run ./setup.sh first to create the environment"
    exit 1
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️ .env file not found!"
    echo "   Run ./setup.sh first to create the environment"
    exit 1
fi

echo "✅ Environment activated!"
echo ""
echo "Available commands:"
echo "  python cli.py --help                    # Show CLI help"
echo "  python cli.py Chapters/scene-1.pdf     # Process a single PDF"
echo "  python cli.py Chapters/                # Process all PDFs in directory"
echo "  python manga_pipeline.py                # Run example pipeline"
echo ""
echo "To deactivate, run: deactivate"
echo ""

# Keep the shell active
exec bash
