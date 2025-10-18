#!/usr/bin/env python3
"""
Check Available Gemini Models
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

def list_available_models():
    """List all available Gemini models"""
    
    print("🔍 Checking Available Gemini Models...")
    print("=" * 40)
    
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("❌ Error: GOOGLE_API_KEY not found")
        return
    
    try:
        genai.configure(api_key=api_key)
        
        # List all models
        models = genai.list_models()
        
        print("📋 Available Models:")
        print("-" * 40)
        
        for model in models:
            model_name = model.name.split('/')[-1]  # Get just the model name
            print(f"✅ {model_name}")
            
            # Check if it supports generateContent
            if 'generateContent' in model.supported_generation_methods:
                print(f"   - Supports generateContent: ✅")
            else:
                print(f"   - Supports generateContent: ❌")
        
        print("\n🎯 Recommended models for our pipeline:")
        print("- gemini-1.5-flash (for text generation)")
        print("- gemini-1.5-pro (for vision analysis)")
        
    except Exception as e:
        print(f"❌ Error listing models: {str(e)}")

if __name__ == "__main__":
    list_available_models()
