#!/usr/bin/env python3
"""
Setup script for ElevenLabs v3 Dialogue Generation Backend
"""

import os
import sys
import subprocess

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version.split()[0]}")
    return True

def install_requirements():
    """Install required packages."""
    try:
        print("📦 Installing dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False

def check_env_file():
    """Check if .env file exists and has API key."""
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if not os.path.exists(env_path):
        print("⚠️  .env file not found")
        print("Please create a .env file in the project root with:")
        print("ELEVENLABS_API_KEY=your_api_key_here")
        return False
    
    with open(env_path, 'r') as f:
        content = f.read()
        if "ELEVENLABS_API_KEY" not in content or "your_api_key_here" in content:
            print("⚠️  .env file exists but API key not configured")
            print("Please update your .env file with a valid ElevenLabs API key")
            return False
    
    print("✅ .env file configured")
    return True

def main():
    """Main setup function."""
    print("🎭 ElevenLabs v3 Dialogue Generation Backend Setup")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Install requirements
    if not install_requirements():
        return False
    
    # Check environment configuration
    env_configured = check_env_file()
    
    print("\n" + "=" * 50)
    if env_configured:
        print("🎉 Setup complete! You can now run:")
        print("   cd elevenlabs")
        print("   python generate_dialogue.py")
    else:
        print("⚠️  Setup partially complete. Please configure your .env file")
        print("   Then run: cd elevenlabs && python generate_dialogue.py")
    
    return True

if __name__ == "__main__":
    main()
