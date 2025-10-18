#!/bin/bash

# Manga Analysis Pipeline - Environment Setup Script
# This script sets up a Python virtual environment and installs dependencies

set -e  # Exit on any error

echo "🎨 Setting up Manga Analysis Pipeline Environment..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "🐍 Using Python version: $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Check for system dependencies
echo "🔍 Checking system dependencies..."

# Check for poppler (required for PDF processing)
if command -v pdftoppm &> /dev/null; then
    echo "✅ Poppler is installed"
else
    echo "⚠️ Poppler is not installed. PDF processing will not work."
    echo "   Install with:"
    echo "   - macOS: brew install poppler"
    echo "   - Ubuntu/Debian: sudo apt-get install poppler-utils"
    echo "   - Windows: Download from https://github.com/oschwartz10612/poppler-windows"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️ Please edit .env file and add your Google AI API key"
    echo "   Get your API key from: https://makersuite.google.com/app/apikey"
else
    echo "✅ .env file already exists"
fi

# Create output directory
if [ ! -d "output" ]; then
    echo "📁 Creating output directory..."
    mkdir -p output
else
    echo "✅ Output directory already exists"
fi

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "To activate the environment, run:"
echo "  source venv/bin/activate"
echo ""
echo "To test the pipeline, run:"
echo "  python cli.py --help"
echo ""
echo "Don't forget to:"
echo "  1. Edit .env file with your Google AI API key"
echo "  2. Install poppler if not already installed"
echo ""
