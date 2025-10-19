// ElevenLabs Service for Edge Functions
// Handles audio generation using ElevenLabs API

export interface Character {
  name: string;
  gender: 'male' | 'female' | 'unknown';
  voice_id?: string;
}

export interface DialogueLine {
  character: string;
  text: string;
  page: number;
}

export interface AudioGenerationResult {
  page: number;
  audio_url: string;
  transcript: string;
  duration: number;
  success: boolean;
  error?: string;
}

export interface VoiceRegistry {
  male: string[];
  female: string[];
  narrator: string;
  sound_effect: string;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private voiceRegistry: VoiceRegistry;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('ElevenLabs API key is required');
    }
    this.apiKey = apiKey;
    
    // Initialize voice registry with the same voices as the Python implementation
    this.voiceRegistry = {
      male: [
        'UgBBYS2sOqTuMpoF3BR0',
        'vBKc2FfBKJfcZNyEt1n6', 
        'XA2bIQ92TabjGbpO2xRr',
        's3TPKV1kjDlVtZbl4Ksh',
        '2BJW5coyhAzSr8STdHbE',
        '3jR9BuQAOPMWUjWpi0ll',
        'TWUKKXAylkYxxlPe4gx0'
      ],
      female: [
        'OYTbf65OHHFELVut7v2H',
        'uYXf8XasLslADfZ2MB4u',
        'bMxLr8fP6hzNRRi9nJxU',
        'TbMNBJ27fH2U0VgpSNko'
      ],
      narrator: 'asDeXBMC8hUkhqqL7agO',
      sound_effect: 'L1aJrPa7pLJEyYlh3Ilq'
    };
  }

  /**
   * Assign voices to characters based on gender and availability
   */
  assignVoicesToCharacters(characters: Character[]): Character[] {
    const assignedVoices = new Set<string>();
    let maleIndex = 0;
    let femaleIndex = 0;
    
    return characters.map(character => {
      let voiceId: string;
      
      if (character.name === 'Narrator') {
        voiceId = this.voiceRegistry.narrator;
      } else if (character.name === 'Sound Effect') {
        voiceId = this.voiceRegistry.sound_effect;
      } else if (character.gender === 'male') {
        // Cycle through male voices
        voiceId = this.voiceRegistry.male[maleIndex % this.voiceRegistry.male.length];
        maleIndex++;
      } else if (character.gender === 'female') {
        // Cycle through female voices
        voiceId = this.voiceRegistry.female[femaleIndex % this.voiceRegistry.female.length];
        femaleIndex++;
      } else {
        // Default to male voice for unknown gender
        voiceId = this.voiceRegistry.male[maleIndex % this.voiceRegistry.male.length];
        maleIndex++;
      }
      
      return {
        ...character,
        voice_id: voiceId
      };
    });
  }

  /**
   * Group dialogue by page for processing
   */
  groupDialogueByPage(dialogue: DialogueLine[]): Map<number, DialogueLine[]> {
    const grouped = new Map<number, DialogueLine[]>();
    
    for (const line of dialogue) {
      if (!grouped.has(line.page)) {
        grouped.set(line.page, []);
      }
      grouped.get(line.page)!.push(line);
    }
    
    return grouped;
  }

  /**
   * Convert dialogue to ElevenLabs API format
   */
  convertToElevenLabsFormat(
    pageDialogue: DialogueLine[], 
    charactersWithVoices: Character[]
  ): any {
    const voiceMap = new Map<string, string>();
    for (const char of charactersWithVoices) {
      if (char.voice_id) {
        voiceMap.set(char.name, char.voice_id);
      }
    }
    
    const dialogue = pageDialogue.map(line => ({
      voice_id: voiceMap.get(line.character) || this.voiceRegistry.narrator,
      text: line.text
    }));
    
    return {
      dialogue,
      output_format: "mp3_44100_128"
    };
  }

  /**
   * Generate audio for a single page
   */
  async generatePageAudio(
    pageDialogue: DialogueLine[],
    charactersWithVoices: Character[],
    pageNumber: number
  ): Promise<AudioGenerationResult> {
    try {
      console.log(`Generating audio for page ${pageNumber}...`);
      
      // Convert to ElevenLabs format
      const elevenLabsFormat = this.convertToElevenLabsFormat(pageDialogue, charactersWithVoices);
      
      // Call ElevenLabs API
      const audioResponse = await this.callElevenLabsAPI(elevenLabsFormat);
      
      // Generate transcript
      const transcript = this.generateTranscript(pageDialogue);
      
      return {
        page: pageNumber,
        audio_url: audioResponse.audio_url,
        transcript: transcript,
        duration: audioResponse.duration,
        success: true
      };
      
    } catch (error) {
      console.error(`Error generating audio for page ${pageNumber}:`, error);
      
      return {
        page: pageNumber,
        audio_url: '',
        transcript: this.generateTranscript(pageDialogue),
        duration: 0,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate audio for all pages in a scene
   */
  async generateSceneAudio(
    dialogue: DialogueLine[],
    characters: Character[],
    sceneId: string
  ): Promise<AudioGenerationResult[]> {
    console.log(`Starting audio generation for scene ${sceneId}...`);
    
    // Assign voices to characters
    const charactersWithVoices = this.assignVoicesToCharacters(characters);
    console.log(`Assigned voices to ${charactersWithVoices.length} characters`);
    
    // Group dialogue by page
    const dialogueByPage = this.groupDialogueByPage(dialogue);
    console.log(`Processing ${dialogueByPage.size} pages`);
    
    const results: AudioGenerationResult[] = [];
    
    // Generate audio for each page
    for (const [pageNumber, pageDialogue] of dialogueByPage.entries()) {
      console.log(`Processing page ${pageNumber}/${dialogueByPage.size}...`);
      
      const result = await this.generatePageAudio(
        pageDialogue,
        charactersWithVoices,
        pageNumber
      );
      
      results.push(result);
      
      if (result.success) {
        console.log(`✓ Page ${pageNumber} audio generated successfully`);
      } else {
        console.error(`✗ Page ${pageNumber} audio generation failed: ${result.error}`);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`Audio generation complete: ${successCount}/${results.length} pages successful`);
    console.log(`Total duration: ${totalDuration.toFixed(1)} seconds`);
    
    return results;
  }

  /**
   * Call ElevenLabs Text-to-Dialogue API
   */
  private async callElevenLabsAPI(format: any): Promise<{audio_url: string, duration: number}> {
    const url = `${this.baseUrl}/text-to-dialogue?output_format=mp3_44100_128`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(format)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Get audio data
      const audioBlob = await response.blob();
      
      // In a real implementation, you would:
      // 1. Upload the audio blob to Supabase Storage
      // 2. Get the public URL
      // 3. Calculate duration from audio metadata
      
      // For now, we'll return a mock URL and duration
      const audioUrl = await this.uploadAudioToStorage(audioBlob);
      const duration = await this.calculateAudioDuration(audioBlob);
      
      return {
        audio_url: audioUrl,
        duration: duration
      };
      
    } catch (error) {
      throw new Error(`ElevenLabs API call failed: ${error.message}`);
    }
  }

  /**
   * Upload audio to Supabase Storage
   * This would be implemented with your Supabase client
   */
  private async uploadAudioToStorage(audioBlob: Blob): Promise<string> {
    // In a real implementation, you would:
    // 1. Use Supabase client to upload the blob
    // 2. Get the public URL
    // 3. Return the URL
    
    // For now, return a mock URL
    const timestamp = Date.now();
    const filename = `audio_${timestamp}.mp3`;
    
    // Mock implementation - replace with actual Supabase Storage upload
    return `https://your-supabase-project.supabase.co/storage/v1/object/public/audio/${filename}`;
  }

  /**
   * Calculate audio duration
   * This would parse the audio metadata to get duration
   */
  private async calculateAudioDuration(audioBlob: Blob): Promise<number> {
    // In a real implementation, you would:
    // 1. Parse the audio blob to extract duration
    // 2. Return the duration in seconds
    
    // For now, return a mock duration
    return Math.random() * 60 + 10; // Random duration between 10-70 seconds
  }

  /**
   * Generate transcript text from dialogue
   */
  private generateTranscript(pageDialogue: DialogueLine[]): string {
    return pageDialogue
      .map(line => `${line.character}: ${line.text}`)
      .join('\n');
  }

  /**
   * Get voice information
   */
  async getVoiceInfo(voiceId: string): Promise<any> {
    const url = `${this.baseUrl}/voices/${voiceId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get voice info: ${response.status} ${response.statusText}`);
      }

      return await response.json();
      
    } catch (error) {
      throw new Error(`Error getting voice info: ${error.message}`);
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/voices`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.ok;
      
    } catch (error) {
      console.error('ElevenLabs connection test failed:', error);
      return false;
    }
  }
}
