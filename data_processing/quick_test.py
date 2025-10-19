#!/usr/bin/env python3
"""
Quick test of the process_pdf function with minimal processing
"""

from standalone_pipeline import process_pdf
import json

def quick_test():
    """Quick test with minimal parameters"""
    try:
        print("🚀 Quick test of process_pdf function...")
        
        # Test with optimized models
        result = process_pdf(
            pdf_path="Chapters/scene-1.pdf",
            scene_id="quick_test",
            pass1_model="gemini-2.0-flash",  # Fast model for character identification
            pass2_model="gemini-2.5-pro",    # Powerful model for dialogue extraction
            enhancement_model="gemini-2.5-flash-lite",  # Lite model for audio enhancement
            cleanup_images=True
        )
        
        print("✅ SUCCESS!")
        print(f"Scene ID: {result['scene_id']}")
        print(f"Scene Title: {result['scene_title']}")
        print(f"Characters: {list(result['characters'].keys())}")
        print(f"Total dialogue lines: {len(result['dialogue'])}")
        
        # Show first few dialogue lines
        print("\nFirst 3 dialogue lines:")
        for i, dialogue in enumerate(result['dialogue'][:3]):
            print(f"  {i+1}. {dialogue['speaker']}: {dialogue['text']}")
        
        # Save result
        with open("quick_test_result.json", "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"\n📁 Result saved to: quick_test_result.json")
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    quick_test()
