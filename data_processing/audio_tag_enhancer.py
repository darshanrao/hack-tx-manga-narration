"""
Audio Tag Enhancement Module
Step 2: Enhance dialogue with ElevenLabs v3 audio tags using LLM
"""

import json
import logging
from typing import Dict, List, Any
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AudioTagEnhancer:
    """Handles enhancement of dialogue with ElevenLabs v3 audio tags"""
    
    def __init__(self, api_key: str = None, model_name: str = "gemini-2.5-flash-lite"):
        """
        Initialize audio tag enhancer
        
        Args:
            api_key: Google AI API key
            model_name: Gemini model to use for text enhancement
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key not provided. Set GOOGLE_API_KEY environment variable.")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(model_name)
        
        logger.info(f"Initialized Audio Tag Enhancer with model: {model_name}")
    
    def enhance_all_dialogue_at_once(self, all_dialogue_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enhance ALL dialogue from all pages in a single API call (OPTIMAL APPROACH)
        
        Args:
            all_dialogue_data: List of all dialogue items from all pages
            
        Returns:
            List of enhanced dialogue items in the same order
        """
        try:
            logger.info(f"Enhancing ALL {len(all_dialogue_data)} dialogue lines in single API call...")
            
            if not all_dialogue_data:
                logger.warning("No dialogue found to enhance")
                return all_dialogue_data
            
            # Create comprehensive enhancement prompt for ALL dialogue
            enhancement_prompt = f"""
# Instructions

## 1. Role and Goal

You are an AI assistant specializing in enhancing dialogue text for speech generation.

Your **PRIMARY GOAL** is to dynamically integrate **audio tags** (e.g., `[laughing]`, `[sighs]`) into dialogue, making it more expressive and engaging for auditory experiences, while **STRICTLY** preserving the original text and meaning.

It is imperative that you follow these system instructions to the fullest.

## 2. Core Directives

Follow these directives meticulously to ensure high-quality output.

### Positive Imperatives (DO):

* DO integrate **audio tags** from the "Audio Tags" list (or similar contextually appropriate **audio tags**) to add expression, emotion, and realism to the dialogue. These tags MUST describe something auditory.
* DO ensure that all **audio tags** are contextually appropriate and genuinely enhance the emotion or subtext of the dialogue line they are associated with.
* DO strive for a diverse range of emotional expressions (e.g., energetic, relaxed, casual, surprised, thoughtful) across the dialogue, reflecting the nuances of human conversation.
* DO place **audio tags** strategically to maximize impact, typically immediately before the dialogue segment they modify or immediately after. (e.g., `[annoyed] This is hard.` or `This is hard. [sighs]`).
* DO ensure **audio tags** contribute to the enjoyment and engagement of spoken dialogue.

### Negative Imperatives (DO NOT):

* DO NOT alter, add, or remove any words from the original dialogue text itself. Your role is to *prepend* **audio tags**, not to *edit* the speech. **This also applies to any narrative text provided; you must *never* place original text inside brackets or modify it in any way.**
* DO NOT create **audio tags** from existing narrative descriptions. **Audio tags** are *new additions* for expression, not reformatting of the original text. (e.g., if the text says "He laughed loudly," do not change it to "[laughing loudly] He laughed." Instead, add a tag if appropriate, e.g., "He laughed loudly [chuckles].")
* DO NOT use tags such as `[standing]`, `[grinning]`, `[pacing]`, `[music]`.
* DO NOT use tags for anything other than the voice such as music or sound effects.
* DO NOT invent new dialogue lines.
* DO NOT select **audio tags** that contradict or alter the original meaning or intent of the dialogue.
* DO NOT introduce or imply any sensitive topics, including but not limited to: politics, religion, child exploitation, profanity, hate speech, or other NSFW content.

## 3. Workflow

1. **Analyze Dialogue**: Carefully read and understand the mood, context, and emotional tone of **EACH** line of dialogue provided in the input.
2. **Select Tag(s)**: Based on your analysis, choose one or more suitable **audio tags**. Ensure they are relevant to the dialogue's specific emotions and dynamics.
3. **Integrate Tag(s)**: Place the selected **audio tag(s)** in square brackets `[]` strategically before or after the relevant dialogue segment, or at a natural pause if it enhances clarity.
4. **Add Emphasis:** You cannot change the text at all, but you can add emphasis by making some words capital, adding a question mark or adding an exclamation mark where it makes sense, or adding ellipses as well too.
5. **Verify Appropriateness**: Review the enhanced dialogue to confirm:
    * The **audio tag** fits naturally.
    * It enhances meaning without altering it.
    * It adheres to all Core Directives.

## 4. Output Format

* Present ONLY the enhanced dialogue text in a conversational format.
* **Audio tags** **MUST** be enclosed in square brackets (e.g., `[laughing]`).
* The output should maintain the narrative flow of the original dialogue.

## 5. Audio Tags (Non-Exhaustive)

Use these as a guide. You can infer similar, contextually appropriate **audio tags**.

**Directions:**
* `[happy]`
* `[sad]`
* `[excited]`
* `[angry]`
* `[whisper]`
* `[annoyed]`
* `[appalled]`
* `[thoughtful]`
* `[surprised]`
* *(and similar emotional/delivery directions)*

**Non-verbal:**
* `[laughing]`
* `[chuckles]`
* `[sighs]`
* `[clears throat]`
* `[short pause]`
* `[long pause]`
* `[exhales sharply]`
* `[inhales deeply]`
* *(and similar non-verbal sounds)*

## 6. Examples of Enhancement

**Input**:
"Are you serious? I can't believe you did that!"

**Enhanced Output**:
"[appalled] Are you serious? [sighs] I can't believe you did that!"

---

**Input**:
"That's amazing, I didn't know you could sing!"

**Enhanced Output**:
"[laughing] That's amazing, [singing] I didn't know you could sing!"

---

**Input**:
"I guess you're right. It's just... difficult."

**Enhanced Output**:
"I guess you're right. [sighs] It's just... [muttering] difficult."

# Instructions Summary

1. Add audio tags from the audio tags list. These must describe something auditory but only for the voice.
2. Enhance emphasis without altering meaning or text.
3. Reply ONLY with the enhanced text.

DIALOGUE TO ENHANCE (ALL PAGES):
"""
            
            # Add each dialogue line to the prompt
            for i, dialogue in enumerate(all_dialogue_data, 1):
                speaker = dialogue["speaker"]
                text = dialogue["text"]
                emotion = dialogue.get("emotion", "neutral")
                page_number = dialogue.get("page_number", "unknown")
                
                enhancement_prompt += f"""
{i}. Page {page_number} - Speaker: {speaker}
   Emotion: {emotion}
   Text: "{text}"
"""
            
            enhancement_prompt += f"""

Return ONLY a JSON array with enhanced dialogue text, in this exact format:
[
    "[gentle] Are you crying? [short pause]",
    "[confused] Huh...? [sighs softly]",
    "[angry] What are you talking about?!",
    "[calm] I understand your concern."
]

Make sure the order matches the input dialogue order exactly.
Return exactly {len(all_dialogue_data)} enhanced dialogue lines.
"""
            
            # Get enhancement from LLM
            response = self.model.generate_content(enhancement_prompt)
            
            if not response.text:
                logger.warning(f"No enhancement received for {len(all_dialogue_data)} dialogue lines")
                return all_dialogue_data
            
            # Parse JSON response
            try:
                response_text = response.text.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                
                enhanced_texts = json.loads(response_text)
                
                # Validate response size
                if len(enhanced_texts) != len(all_dialogue_data):
                    logger.warning(f"Enhancement size mismatch: expected {len(all_dialogue_data)}, got {len(enhanced_texts)}")
                    return all_dialogue_data
                
                # Create enhanced dialogue entries
                enhanced_dialogue = []
                for i, dialogue in enumerate(all_dialogue_data):
                    enhanced_dialogue_item = dialogue.copy()
                    enhanced_dialogue_item["text"] = enhanced_texts[i]
                    enhanced_dialogue.append(enhanced_dialogue_item)
                
                logger.info(f"Successfully enhanced {len(enhanced_dialogue)} dialogue lines in single API call")
                return enhanced_dialogue
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse enhancement response: {e}")
                return all_dialogue_data
                
        except Exception as e:
            logger.error(f"Error enhancing all dialogue at once: {str(e)}")
            return all_dialogue_data