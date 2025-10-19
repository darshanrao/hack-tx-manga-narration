// Gemini AI Service for Edge Functions
// Handles all interactions with Google's Gemini API

export interface Character {
  name: string;
  gender: 'male' | 'female' | 'unknown';
  description?: string;
}

export interface DialogueLine {
  character: string;
  text: string;
  page: number;
  timestamp?: number;
}

export interface SceneAnalysis {
  characters: Character[];
  dialogue: DialogueLine[];
  total_pages: number;
  scene_summary?: string;
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Pass 1: Identify characters across all pages
   */
  async identifyCharacters(pages: string[]): Promise<Character[]> {
    const prompt = `
Analyze these manga pages and identify all characters consistently across all pages.

Instructions:
1. Look for recurring characters across pages
2. Identify character names (use consistent naming)
3. Determine gender (male/female/unknown)
4. Provide brief description if helpful
5. Include "Narrator" and "Sound Effect" as special characters

Focus on character consistency - the same character should have the same name across all pages.

Return a JSON array in this exact format:
[
  {
    "name": "Character Name",
    "gender": "male|female|unknown",
    "description": "Brief character description (optional)"
  }
]

Be thorough but concise. Look for main characters, supporting characters, and any speaking roles.
`;

    const response = await this.callGeminiAPI('gemini-2.0-flash', prompt, pages);
    
    try {
      const characters = JSON.parse(response);
      if (!Array.isArray(characters)) {
        throw new Error('Invalid response format');
      }
      
      // Add default characters
      const defaultCharacters: Character[] = [
        { name: 'Narrator', gender: 'unknown', description: 'Narrative voice' },
        { name: 'Sound Effect', gender: 'unknown', description: 'Sound effects and ambient audio' }
      ];
      
      return [...characters, ...defaultCharacters];
    } catch (error) {
      throw new Error(`Failed to parse character identification response: ${error.message}`);
    }
  }

  /**
   * Pass 2: Extract dialogue from individual pages with character context
   */
  async extractDialogueFromPage(
    page: string,
    characters: Character[],
    pageNumber: number
  ): Promise<DialogueLine[]> {
    const characterNames = characters.map(c => c.name).join(', ');
    
    const prompt = `
Analyze this manga page and extract all dialogue and narration.

Character context: ${characterNames}

Instructions:
1. Extract ALL spoken dialogue and narration
2. Identify the speaker for each line
3. Use exact character names from the context list
4. Include narrator descriptions and sound effects
5. Preserve the original text as accurately as possible
6. Mark the page number correctly

For each dialogue/narration, return:
- Character name (must match one from the context list)
- Exact text content
- Page number

Return JSON format:
[
  {
    "character": "Character Name",
    "text": "exact dialogue or narration text",
    "page": ${pageNumber}
  }
]

Be thorough - extract every single line of dialogue and narration.
`;

    const response = await this.callGeminiAPI('gemini-2.5-pro', prompt, [page]);
    
    try {
      const dialogue = JSON.parse(response);
      if (!Array.isArray(dialogue)) {
        throw new Error('Invalid response format');
      }
      
      return dialogue.map(line => ({
        ...line,
        page: pageNumber
      }));
    } catch (error) {
      throw new Error(`Failed to parse dialogue extraction response: ${error.message}`);
    }
  }

  /**
   * Enhance dialogue with ElevenLabs v3 audio tags
   */
  async enhanceDialogueWithAudioTags(dialogue: DialogueLine[]): Promise<DialogueLine[]> {
    const dialogueText = dialogue.map(d => `${d.character}: ${d.text}`).join('\n');
    
    const prompt = `
Enhance these manga dialogue lines with ElevenLabs v3 audio tags for better voice generation.

Original dialogue:
${dialogueText}

Instructions:
1. Add appropriate audio tags like [calm], [excited], [whispering], [shouting], [worried], etc.
2. Keep the original text but enhance it with emotional and delivery cues
3. Consider the character's personality and the context
4. Use tags that will improve voice generation quality
5. Be consistent with character voices

Common audio tags to use:
- [calm] for neutral dialogue
- [excited] for enthusiastic speech
- [worried] for concerned dialogue
- [angry] for frustrated speech
- [whispering] for quiet dialogue
- [shouting] for loud speech
- [thoughtful] for contemplative dialogue
- [determined] for resolute speech
- [surprised] for shocked reactions
- [sad] for emotional dialogue

Return the same JSON format with enhanced text:
[
  {
    "character": "Character Name",
    "text": "enhanced text with [audio tags]",
    "page": pageNumber
  }
]

Maintain the original structure and page numbers.
`;

    const response = await this.callGeminiAPI('gemini-2.0-flash-lite', prompt);
    
    try {
      const enhancedDialogue = JSON.parse(response);
      if (!Array.isArray(enhancedDialogue)) {
        throw new Error('Invalid response format');
      }
      
      return enhancedDialogue;
    } catch (error) {
      throw new Error(`Failed to parse audio enhancement response: ${error.message}`);
    }
  }

  /**
   * Generate scene summary
   */
  async generateSceneSummary(
    characters: Character[],
    dialogue: DialogueLine[],
    sceneId: string
  ): Promise<string> {
    const characterNames = characters.map(c => c.name).join(', ');
    const dialoguePreview = dialogue.slice(0, 10).map(d => `${d.character}: ${d.text}`).join('\n');
    
    const prompt = `
Generate a brief summary of this manga scene.

Scene ID: ${sceneId}
Characters: ${characterNames}
Total dialogue lines: ${dialogue.length}

Sample dialogue:
${dialoguePreview}

Provide a 2-3 sentence summary of what happens in this scene, focusing on:
1. The main plot points
2. Key character interactions
3. The overall tone or mood

Keep it concise and informative.
`;

    const response = await this.callGeminiAPI('gemini-2.0-flash-lite', prompt);
    return response.trim();
  }

  /**
   * Main processing function that orchestrates the two-pass approach
   */
  async processScene(pages: string[], sceneId: string): Promise<SceneAnalysis> {
    console.log(`Starting scene processing for ${sceneId}...`);
    
    try {
      // Pass 1: Character identification
      console.log('Pass 1: Identifying characters...');
      const characters = await this.identifyCharacters(pages);
      console.log(`Identified ${characters.length} characters`);
      
      // Pass 2: Dialogue extraction
      console.log('Pass 2: Extracting dialogue...');
      const allDialogue: DialogueLine[] = [];
      
      for (let i = 0; i < pages.length; i++) {
        console.log(`Processing page ${i + 1}/${pages.length}...`);
        const pageDialogue = await this.extractDialogueFromPage(
          pages[i],
          characters,
          i + 1
        );
        allDialogue.push(...pageDialogue);
        console.log(`Extracted ${pageDialogue.length} dialogue lines from page ${i + 1}`);
      }
      
      // Enhance dialogue with audio tags
      console.log('Enhancing dialogue with audio tags...');
      const enhancedDialogue = await this.enhanceDialogueWithAudioTags(allDialogue);
      console.log(`Enhanced ${enhancedDialogue.length} dialogue lines`);
      
      // Generate scene summary
      console.log('Generating scene summary...');
      const sceneSummary = await this.generateSceneSummary(characters, enhancedDialogue, sceneId);
      
      return {
        characters,
        dialogue: enhancedDialogue,
        total_pages: pages.length,
        scene_summary: sceneSummary
      };
      
    } catch (error) {
      throw new Error(`Scene processing failed: ${error.message}`);
    }
  }

  /**
   * Call Gemini API with error handling
   */
  private async callGeminiAPI(
    model: string,
    prompt: string,
    images: string[] = []
  ): Promise<string> {
    const url = `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`;
    
    const requestBody: any = {
      contents: [{
        parts: [
          { text: prompt },
          ...images.map(image => ({
            inline_data: {
              mime_type: "image/png",
              data: image
            }
          }))
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
        topP: 0.8,
        topK: 40
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const content = data.candidates[0].content;
      if (!content || !content.parts || content.parts.length === 0) {
        throw new Error('Empty response from Gemini API');
      }

      return content.parts[0].text;
      
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unexpected error calling Gemini API: ${error}`);
    }
  }
}
