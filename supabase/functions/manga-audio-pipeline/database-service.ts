// Database Service for Edge Functions
// Handles database operations with Supabase

export interface MangaScene {
  id?: string;
  manga_title: string;
  chapter_number: number;
  page_id: string;
  scene_title: string;
  scene_description?: string;
  ambient?: string;
  characters: any[];
  dialogue: any[];
  pdf_file_path: string;
  pdf_file_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface AudioFile {
  id?: string;
  scene_id: string;
  file_path: string;
  file_type: string;
  character_name: string;
  voice_id: string;
  character_gender: string;
  created_at?: string;
}

export interface AudioTranscript {
  id?: string;
  scene_id: string;
  audio_file_id?: string;
  file_type: string;
  character_name: string;
  text: string;
  segments: any[];
  language: string;
  created_at?: string;
}

export class DatabaseService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  /**
   * Create a new manga scene record
   */
  async createMangaScene(sceneData: Omit<MangaScene, 'id' | 'created_at' | 'updated_at'>): Promise<MangaScene> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/manga_scenes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...sceneData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create manga scene: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const scenes = await response.json();
      return scenes[0];

    } catch (error) {
      throw new Error(`Database error creating manga scene: ${error.message}`);
    }
  }

  /**
   * Update a manga scene with processed data
   */
  async updateMangaScene(
    sceneId: string, 
    updates: Partial<MangaScene>
  ): Promise<MangaScene> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/manga_scenes?id=eq.${sceneId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...updates,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update manga scene: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const scenes = await response.json();
      return scenes[0];

    } catch (error) {
      throw new Error(`Database error updating manga scene: ${error.message}`);
    }
  }

  /**
   * Create audio file records
   */
  async createAudioFiles(audioFiles: Omit<AudioFile, 'id' | 'created_at'>[]): Promise<AudioFile[]> {
    try {
      const audioFilesWithTimestamp = audioFiles.map(file => ({
        ...file,
        created_at: new Date().toISOString()
      }));

      const response = await fetch(`${this.supabaseUrl}/rest/v1/audio_files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(audioFilesWithTimestamp)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create audio files: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();

    } catch (error) {
      throw new Error(`Database error creating audio files: ${error.message}`);
    }
  }

  /**
   * Create audio transcript records
   */
  async createAudioTranscripts(transcripts: Omit<AudioTranscript, 'id' | 'created_at'>[]): Promise<AudioTranscript[]> {
    try {
      const transcriptsWithTimestamp = transcripts.map(transcript => ({
        ...transcript,
        created_at: new Date().toISOString()
      }));

      const response = await fetch(`${this.supabaseUrl}/rest/v1/audio_transcripts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(transcriptsWithTimestamp)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create audio transcripts: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();

    } catch (error) {
      throw new Error(`Database error creating audio transcripts: ${error.message}`);
    }
  }

  /**
   * Get manga scene by PDF file path
   */
  async getMangaSceneByPdfPath(pdfPath: string): Promise<MangaScene | null> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/manga_scenes?pdf_file_path=eq.${encodeURIComponent(pdfPath)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get manga scene: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const scenes = await response.json();
      return scenes.length > 0 ? scenes[0] : null;

    } catch (error) {
      throw new Error(`Database error getting manga scene: ${error.message}`);
    }
  }

  /**
   * Check if a PDF has already been processed
   */
  async isPdfProcessed(pdfPath: string): Promise<boolean> {
    try {
      const scene = await this.getMangaSceneByPdfPath(pdfPath);
      return scene !== null && scene.characters && scene.characters.length > 0;
    } catch (error) {
      console.error('Error checking if PDF is processed:', error);
      return false;
    }
  }

  /**
   * Save complete pipeline results to database
   */
  async savePipelineResults(
    sceneId: string,
    sceneData: {
      characters: any[];
      dialogue: any[];
      sceneSummary?: string;
      ambient?: string;
    },
    audioResults: any[]
  ): Promise<{
    scene: MangaScene;
    audioFiles: AudioFile[];
    transcripts: AudioTranscript[];
  }> {
    try {
      // Update scene with processed data
      const updatedScene = await this.updateMangaScene(sceneId, {
        characters: sceneData.characters,
        dialogue: sceneData.dialogue,
        scene_description: sceneData.sceneSummary,
        ambient: sceneData.ambient
      });

      // Create audio file records
      const audioFileRecords: Omit<AudioFile, 'id' | 'created_at'>[] = [];
      const transcriptRecords: Omit<AudioTranscript, 'id' | 'created_at'>[] = [];

      for (const audioResult of audioResults) {
        if (audioResult.success) {
          // Create audio file record
          audioFileRecords.push({
            scene_id: sceneId,
            file_path: audioResult.audio_url,
            file_type: 'mp3',
            character_name: 'Multiple', // or extract from dialogue
            voice_id: 'multiple', // or extract from characters
            character_gender: 'unknown'
          });

          // Create transcript record
          transcriptRecords.push({
            scene_id: sceneId,
            file_type: 'txt',
            character_name: 'Multiple',
            text: audioResult.transcript,
            segments: [], // Could parse transcript into segments
            language: 'en'
          });
        }
      }

      // Save audio files and transcripts
      const audioFiles = audioFileRecords.length > 0 ? 
        await this.createAudioFiles(audioFileRecords) : [];
      const transcripts = transcriptRecords.length > 0 ? 
        await this.createAudioTranscripts(transcriptRecords) : [];

      return {
        scene: updatedScene,
        audioFiles,
        transcripts
      };

    } catch (error) {
      throw new Error(`Failed to save pipeline results: ${error.message}`);
    }
  }

  /**
   * Get processing status for a scene
   */
  async getProcessingStatus(sceneId: string): Promise<{
    scene: MangaScene | null;
    audioFiles: AudioFile[];
    transcripts: AudioTranscript[];
    isComplete: boolean;
  }> {
    try {
      // Get scene
      const sceneResponse = await fetch(`${this.supabaseUrl}/rest/v1/manga_scenes?id=eq.${sceneId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      const scenes = await response.json();
      const scene = scenes.length > 0 ? scenes[0] : null;

      // Get audio files
      const audioResponse = await fetch(`${this.supabaseUrl}/rest/v1/audio_files?scene_id=eq.${sceneId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      const audioFiles = await audioResponse.json();

      // Get transcripts
      const transcriptResponse = await fetch(`${this.supabaseUrl}/rest/v1/audio_transcripts?scene_id=eq.${sceneId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      const transcripts = await transcriptResponse.json();

      return {
        scene,
        audioFiles,
        transcripts,
        isComplete: scene !== null && scene.characters && scene.characters.length > 0 && audioFiles.length > 0
      };

    } catch (error) {
      throw new Error(`Failed to get processing status: ${error.message}`);
    }
  }
}
