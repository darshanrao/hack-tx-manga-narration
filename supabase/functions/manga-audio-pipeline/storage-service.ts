// Storage Service for Edge Functions
// Handles file upload/download with Supabase Storage

export interface StorageConfig {
  bucket: string;
  folder?: string;
  publicUrl: string;
}

export interface UploadResult {
  url: string;
  path: string;
  success: boolean;
  error?: string;
}

export interface DownloadResult {
  data: ArrayBuffer;
  contentType: string;
  success: boolean;
  error?: string;
}

export class StorageService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private config: StorageConfig;

  constructor(supabaseUrl: string, supabaseKey: string, config: StorageConfig) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.config = config;
  }

  /**
   * Upload audio file to Supabase Storage
   */
  async uploadAudio(audioBlob: Blob, filename: string): Promise<UploadResult> {
    try {
      const path = this.config.folder ? 
        `${this.config.folder}/${filename}` : 
        filename;

      const response = await fetch(
        `${this.supabaseUrl}/storage/v1/object/${this.config.bucket}/${path}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': audioBlob.type || 'audio/mpeg'
          },
          body: audioBlob
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const url = `${this.config.publicUrl}/storage/v1/object/public/${this.config.bucket}/${path}`;

      return {
        url,
        path,
        success: true
      };

    } catch (error) {
      return {
        url: '',
        path: '',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload transcript file to Supabase Storage
   */
  async uploadTranscript(transcriptText: string, filename: string): Promise<UploadResult> {
    try {
      const path = this.config.folder ? 
        `${this.config.folder}/${filename}` : 
        filename;

      const response = await fetch(
        `${this.supabaseUrl}/storage/v1/object/${this.config.bucket}/${path}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'text/plain'
          },
          body: transcriptText
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const url = `${this.config.publicUrl}/storage/v1/object/public/${this.config.bucket}/${path}`;

      return {
        url,
        path,
        success: true
      };

    } catch (error) {
      return {
        url: '',
        path: '',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download file from Supabase Storage
   */
  async downloadFile(path: string): Promise<DownloadResult> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/storage/v1/object/${this.config.bucket}/${path}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const data = await response.arrayBuffer();

      return {
        data,
        contentType,
        success: true
      };

    } catch (error) {
      return {
        data: new ArrayBuffer(0),
        contentType: '',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate unique filename with timestamp
   */
  generateFilename(prefix: string, extension: string, sceneId?: string): string {
    const timestamp = Date.now();
    const scenePart = sceneId ? `_${sceneId}` : '';
    return `${prefix}${scenePart}_${timestamp}.${extension}`;
  }

  /**
   * Create folder structure for scene
   */
  async createSceneFolder(sceneId: string): Promise<boolean> {
    try {
      // Supabase Storage doesn't require explicit folder creation
      // Folders are created automatically when files are uploaded with paths
      return true;
    } catch (error) {
      console.error('Error creating scene folder:', error);
      return false;
    }
  }

  /**
   * Delete files for a scene
   */
  async deleteSceneFiles(sceneId: string): Promise<boolean> {
    try {
      // List files in the scene folder
      const response = await fetch(
        `${this.supabaseUrl}/storage/v1/object/list/${this.config.bucket}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prefix: `${this.config.folder || ''}/${sceneId}`,
            limit: 1000
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.status} ${response.statusText}`);
      }

      const files = await response.json();
      
      // Delete each file
      for (const file of files) {
        await this.deleteFile(file.name);
      }

      return true;

    } catch (error) {
      console.error('Error deleting scene files:', error);
      return false;
    }
  }

  /**
   * Delete a single file
   */
  private async deleteFile(path: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/storage/v1/object/${this.config.bucket}/${path}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      return response.ok;

    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string): string {
    return `${this.config.publicUrl}/storage/v1/object/public/${this.config.bucket}/${path}`;
  }

  /**
   * Upload multiple files for a scene
   */
  async uploadSceneFiles(
    sceneId: string,
    audioFiles: { blob: Blob; filename: string }[],
    transcriptFiles: { content: string; filename: string }[]
  ): Promise<{
    audio: UploadResult[];
    transcripts: UploadResult[];
    combinedAudio?: UploadResult;
    combinedTranscript?: UploadResult;
  }> {
    const results = {
      audio: [] as UploadResult[],
      transcripts: [] as UploadResult[],
      combinedAudio: undefined as UploadResult | undefined,
      combinedTranscript: undefined as UploadResult | undefined
    };

    // Upload individual audio files
    for (const audioFile of audioFiles) {
      const result = await this.uploadAudio(audioFile.blob, audioFile.filename);
      results.audio.push(result);
    }

    // Upload individual transcript files
    for (const transcriptFile of transcriptFiles) {
      const result = await this.uploadTranscript(transcriptFile.content, transcriptFile.filename);
      results.transcripts.push(result);
    }

    // Create combined audio file (if multiple pages)
    if (audioFiles.length > 1) {
      const combinedBlob = await this.combineAudioFiles(audioFiles.map(f => f.blob));
      const combinedFilename = this.generateFilename(`${sceneId}_combined_audio`, 'mp3');
      results.combinedAudio = await this.uploadAudio(combinedBlob, combinedFilename);
    }

    // Create combined transcript file
    if (transcriptFiles.length > 0) {
      const combinedContent = transcriptFiles.map(f => f.content).join('\n\n--- PAGE BREAK ---\n\n');
      const combinedFilename = this.generateFilename(`${sceneId}_combined_transcript`, 'txt');
      results.combinedTranscript = await this.uploadTranscript(combinedContent, combinedFilename);
    }

    return results;
  }

  /**
   * Combine multiple audio files into one
   * This is a simplified implementation - in production you'd use a proper audio library
   */
  private async combineAudioFiles(audioBlobs: Blob[]): Promise<Blob> {
    // In a real implementation, you would:
    // 1. Use a Web Audio API or audio processing library
    // 2. Concatenate the audio files properly
    // 3. Return a single combined blob
    
    // For now, we'll return the first blob as a placeholder
    // This would need proper audio concatenation in production
    return audioBlobs[0];
  }
}
