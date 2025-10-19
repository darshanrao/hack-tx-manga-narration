// File: frontend/services/supabaseAudioService.ts

import { PageAudioData, ChapterAudioData, TranscriptEntry } from '../utils/pageAudioManager';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Types for API responses
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SupabaseFileInfo {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    lastModified: string;
    contentLength: number;
    httpStatusCode: number;
  };
}

export interface SceneFolderInfo {
  sceneNumber: number;
  folderName: string;
  audioFiles: SupabaseFileInfo[];
  transcriptFiles: SupabaseFileInfo[];
}

export interface ParsedAudioFile {
  sceneNumber: number;
  pageNumber: number;
  timestamp: string;
  fileName: string;
  fileUrl: string;
}

export interface ParsedTranscriptFile {
  sceneNumber: number;
  pageNumber: number;
  timestamp: string;
  fileName: string;
  fileUrl: string;
}

/**
 * Service for managing audio files and transcripts from Supabase output-files bucket
 */
export class SupabaseAudioService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * List all scene folders in the output-files bucket
   */
  async listSceneFolders(): Promise<APIResponse<SceneFolderInfo[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/supabase-audio/scenes`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.scenes || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all audio and transcript files for a specific scene
   */
  async getSceneFiles(sceneNumber: number): Promise<APIResponse<SceneFolderInfo>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/supabase-audio/scenes/${sceneNumber}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get audio data for a specific page
   */
  async getPageAudio(sceneNumber: number, pageNumber: number): Promise<APIResponse<PageAudioData>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/supabase-audio/scenes/${sceneNumber}/pages/${pageNumber}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const pageAudio: PageAudioData = {
        pageNumber: data.pageNumber,
        chapterNumber: data.sceneNumber, // Using scene number as chapter number
        audioUrl: data.audioUrl,
        transcriptUrl: data.transcriptUrl,
        duration: data.duration
      };

      return {
        success: true,
        data: pageAudio
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get transcript content for a specific page
   */
  async getPageTranscript(sceneNumber: number, pageNumber: number): Promise<APIResponse<TranscriptEntry[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/supabase-audio/scenes/${sceneNumber}/pages/${pageNumber}/transcript`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const transcript = this.parseTranscriptContent(data.transcriptContent || '');

      return {
        success: true,
        data: transcript
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Parse audio filename to extract scene, page, and timestamp information
   * Expected format: scene{X}_full_pipeline_page{XX}_dialogue_{timestamp}.mp3
   */
  parseAudioFilename(filename: string): ParsedAudioFile | null {
    const match = filename.match(/scene(\d+)_full_pipeline_page(\d+)_dialogue_(\d{8}_\d{6})\.mp3/);
    if (!match) return null;
    
    const [, sceneStr, pageStr, timestamp] = match;
    return {
      sceneNumber: parseInt(sceneStr, 10),
      pageNumber: parseInt(pageStr, 10),
      timestamp,
      fileName: filename,
      fileUrl: '' // Will be set when we get the signed URL
    };
  }

  /**
   * Parse transcript filename to extract scene, page, and timestamp information
   * Expected format: scene{X}_full_pipeline_page{XX}_transcript_{timestamp}.txt
   */
  parseTranscriptFilename(filename: string): ParsedTranscriptFile | null {
    const match = filename.match(/scene(\d+)_full_pipeline_page(\d+)_transcript_(\d{8}_\d{6})\.txt/);
    if (!match) return null;
    
    const [, sceneStr, pageStr, timestamp] = match;
    return {
      sceneNumber: parseInt(sceneStr, 10),
      pageNumber: parseInt(pageStr, 10),
      timestamp,
      fileName: filename,
      fileUrl: '' // Will be set when we get the signed URL
    };
  }

  /**
   * Parse transcript content into structured entries
   */
  private parseTranscriptContent(content: string): TranscriptEntry[] {
    const lines = content.trim().split('\n');
    const entries: TranscriptEntry[] = [];
    
    lines.forEach((line, index) => {
      const match = line.match(/^(\d{2}:\d{2})\s+(.+?):\s+(.+)$/);
      if (match) {
        const [, timeStr, speaker, text] = match;
        const [minutes, seconds] = timeStr.split(':').map(Number);
        const timestamp = minutes * 60 + seconds;
        
        entries.push({
          id: `entry-${index}`,
          timestamp,
          speaker: speaker.trim(),
          text: text.trim(),
          isActive: false
        });
      }
    });
    
    return entries;
  }

  /**
   * Convert scene folder data to ChapterAudioData format
   */
  convertToChapterAudioData(sceneInfo: SceneFolderInfo): ChapterAudioData {
    const pagesMap = new Map<number, PageAudioData>();
    
    // Process audio files
    sceneInfo.audioFiles.forEach(file => {
      const parsed = this.parseAudioFilename(file.name);
      if (!parsed) return;
      
      const { pageNumber } = parsed;
      if (!pagesMap.has(pageNumber)) {
        pagesMap.set(pageNumber, {
          pageNumber,
          chapterNumber: sceneInfo.sceneNumber,
          audioUrl: '',
          transcriptUrl: ''
        });
      }
      
      pagesMap.get(pageNumber)!.audioUrl = file.name; // Store filename, URL will be resolved later
    });
    
    // Process transcript files
    sceneInfo.transcriptFiles.forEach(file => {
      const parsed = this.parseTranscriptFilename(file.name);
      if (!parsed) return;
      
      const { pageNumber } = parsed;
      if (!pagesMap.has(pageNumber)) {
        pagesMap.set(pageNumber, {
          pageNumber,
          chapterNumber: sceneInfo.sceneNumber,
          audioUrl: '',
          transcriptUrl: ''
        });
      }
      
      pagesMap.get(pageNumber)!.transcriptUrl = file.name; // Store filename, URL will be resolved later
    });
    
    const pages = Array.from(pagesMap.values()).sort((a, b) => a.pageNumber - b.pageNumber);
    
    return {
      chapterNumber: sceneInfo.sceneNumber,
      pages,
      totalPages: pages.length
    };
  }
}

// Export singleton instance
export const supabaseAudioService = new SupabaseAudioService();

// Export types for use in components
export type { PageAudioData, ChapterAudioData, TranscriptEntry };
