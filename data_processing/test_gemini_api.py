#!/usr/bin/env python3
"""
Test Gemini API Connection
Simple test to verify Gemini API is working correctly
"""

import os
import sys
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

def test_gemini_api():
    """Test Gemini API connection and basic functionality"""
    
    print("🧪 Testing Gemini API Connection...")
    print("=" * 40)
    
    # Check API key
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("❌ Error: GOOGLE_API_KEY not found in environment")
        print("Please check your .env file")
        return False
    
    if api_key == "your_api_key_here":
        print("❌ Error: GOOGLE_API_KEY is still set to placeholder value")
        print("Please update your .env file with your actual API key")
        return False
    
    print(f"✅ API Key found: {api_key[:10]}...{api_key[-4:]}")
    
    try:
        # Configure Gemini
        genai.configure(api_key=api_key)
        print("✅ Gemini configured successfully")
        
        # Test with a simple text generation
        model = genai.GenerativeModel("gemini-2.5-flash")
        print("✅ Model loaded: gemini-2.5-flash")
        
        # Simple test prompt
        test_prompt = "Say 'Hello, Gemini API is working!' and nothing else."
        print(f"📝 Testing with prompt: {test_prompt}")
        
        response = model.generate_content(test_prompt)
        
        if response.text:
            print(f"✅ Response received: {response.text}")
            print("🎉 Gemini API is working correctly!")
            return True
        else:
            print("❌ No response text received")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Gemini API: {str(e)}")
        return False

def test_vision_model():
    """Test Gemini Vision model"""
    
    print("\n🖼️ Testing Gemini Vision Model...")
    print("=" * 40)
    
    try:
        api_key = os.getenv("GOOGLE_API_KEY")
        genai.configure(api_key=api_key)
        
        # Test with vision model
        model = genai.GenerativeModel("gemini-2.5-pro")
        print("✅ Vision model loaded: gemini-2.5-pro")
        
        # Test with a simple text prompt (no image for now)
        test_prompt = "Describe what you would see in a typical manga page."
        print(f"📝 Testing vision model with: {test_prompt}")
        
        response = model.generate_content(test_prompt)
        
        if response.text:
            print(f"✅ Vision model response: {response.text[:100]}...")
            print("🎉 Gemini Vision model is working correctly!")
            return True
        else:
            print("❌ No response from vision model")
            return False
            
    except Exception as e:
        print(f"❌ Error testing vision model: {str(e)}")
        return False

def main():
    """Main test function"""
    
    print("🎨 Manga Narration Pipeline - API Test")
    print("=====================================")
    
    # Test basic API
    api_working = test_gemini_api()
    
    if api_working:
        # Test vision model
        vision_working = test_vision_model()
        
        if vision_working:
            print("\n🎉 All tests passed! Ready to process manga!")
            print("\nNext steps:")
            print("1. Test PDF processing: python3 test_pdf_processing.py")
            print("2. Test full pipeline: ./pdf_cli.sh pdf Chapters/scene-1.pdf")
        else:
            print("\n⚠️ Basic API works but vision model has issues")
    else:
        print("\n❌ API test failed. Please check your configuration.")
        sys.exit(1)

if __name__ == "__main__":
    main()
