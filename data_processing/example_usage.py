#!/usr/bin/env python3
"""
Simple usage example for the process_pdf function
"""

from standalone_pipeline import process_pdf

# Example 1: Basic usage
def example_basic():
    """Basic usage with minimal parameters"""
    try:
        result = process_pdf("Chapters/scene-1.pdf")
        
        print("✅ Success!")
        print(f"Scene ID: {result['scene_id']}")
        print(f"Characters: {list(result['characters'].keys())}")
        print(f"Total dialogue lines: {len(result['dialogue'])}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

# Example 2: Advanced usage with custom parameters
def example_advanced():
    """Advanced usage with custom parameters"""
    try:
        result = process_pdf(
            pdf_path="Chapters/scene-1.pdf",
            scene_id="my_custom_scene",
            vision_model="gemini-2.5-pro",
            enhancement_model="gemini-2.5-flash-lite",
            pdf_dpi=300,
            cleanup_images=True,
            output_dir="my_output"
        )
        
        print("✅ Advanced processing complete!")
        print(f"Scene: {result['scene_title']}")
        print(f"Ambient: {result['ambient'][:100]}...")
        
        # Show first few dialogue lines
        print("\nFirst 3 dialogue lines:")
        for i, dialogue in enumerate(result['dialogue'][:3]):
            print(f"  {i+1}. {dialogue['speaker']}: {dialogue['text']}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

# Example 3: Process and save JSON
def example_save_json():
    """Process PDF and save JSON to custom location"""
    import json
    
    try:
        result = process_pdf("Chapters/scene-1.pdf", scene_id="saved_scene")
        
        # Save to custom file
        with open("my_audio_data.json", "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print("✅ JSON saved to: my_audio_data.json")
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    print("🚀 PDF-to-Audio Pipeline Examples")
    print("=" * 40)
    
    print("\n1. Basic Usage:")
    example_basic()
    
    print("\n2. Advanced Usage:")
    example_advanced()
    
    print("\n3. Save JSON:")
    example_save_json()
