#!/usr/bin/env python3
"""
Configuration file for ElevenLabs API
"""

import os
from dotenv import load_dotenv

# Load environment variables from root .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# ElevenLabs API Key from environment variable
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')

if not ELEVENLABS_API_KEY:
    raise ValueError("ELEVENLABS_API_KEY not found in environment variables. Please set it in your .env file.")
