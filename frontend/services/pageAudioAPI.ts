// File: frontend/services/pageAudioAPI.ts

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

export interface PageAudioAPIResponse {
  id: string;
  chapter_number: number;
  page_number: number;
  audio_url: string;
  transcript_url: string;
  transcript_content?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterAudioAPIResponse {
  chapter_number: number;
  pages: PageAudioAPIResponse[];
  total_pages: number;
}

// API Service Class
export class PageAudioAPIService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get audio data for a specific page
   */
  async getPageAudio(chapterNumber: number, pageNumber: number): Promise<APIResponse<PageAudioData>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chapters/${chapterNumber}/pages/${pageNumber}/audio`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData: PageAudioAPIResponse = await response.json();
      
      // Convert API response to local format
      const pageAudio: PageAudioData = {
        pageNumber: apiData.page_number,
        chapterNumber: apiData.chapter_number,
        audioUrl: apiData.audio_url,
        transcriptUrl: apiData.transcript_url,
        transcriptData: apiData.transcript_content ? this.parseTranscriptContent(apiData.transcript_content) : undefined,
        duration: apiData.duration
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
   * Get all audio data for a chapter
   */
  async getChapterAudio(chapterNumber: number): Promise<APIResponse<ChapterAudioData>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chapters/${chapterNumber}/audio`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData: ChapterAudioAPIResponse = await response.json();
      
      // Convert API response to local format
      const chapterAudio: ChapterAudioData = {
        chapterNumber: apiData.chapter_number,
        totalPages: apiData.total_pages,
        pages: apiData.pages.map(page => ({
          pageNumber: page.page_number,
          chapterNumber: page.chapter_number,
          audioUrl: page.audio_url,
          transcriptUrl: page.transcript_url,
          transcriptData: page.transcript_content ? this.parseTranscriptContent(page.transcript_content) : undefined,
          duration: page.duration
        }))
      };

      return {
        success: true,
        data: chapterAudio
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Upload audio file for a specific page
   */
  async uploadPageAudio(
    chapterNumber: number, 
    pageNumber: number, 
    audioFile: File,
    transcriptFile?: File
  ): Promise<APIResponse<PageAudioData>> {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      if (transcriptFile) {
        formData.append('transcript', transcriptFile);
      }
      formData.append('chapter_number', chapterNumber.toString());
      formData.append('page_number', pageNumber.toString());

      const response = await fetch(`${this.baseUrl}/api/chapters/${chapterNumber}/pages/${pageNumber}/audio/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData: PageAudioAPIResponse = await response.json();
      
      const pageAudio: PageAudioData = {
        pageNumber: apiData.page_number,
        chapterNumber: apiData.chapter_number,
        audioUrl: apiData.audio_url,
        transcriptUrl: apiData.transcript_url,
        transcriptData: apiData.transcript_content ? this.parseTranscriptContent(apiData.transcript_content) : undefined,
        duration: apiData.duration
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
   * Get transcript for a specific page
   */
  async getPageTranscript(chapterNumber: number, pageNumber: number): Promise<APIResponse<TranscriptEntry[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chapters/${chapterNumber}/pages/${pageNumber}/transcript`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const transcript = this.parseTranscriptContent(data.transcript_content || '');

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
}

// Supabase Integration (Future)
export class SupabasePageAudioService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  /**
   * Get page audio from Supabase
   */
  async getPageAudio(chapterNumber: number, pageNumber: number): Promise<APIResponse<PageAudioData>> {
    try {
      // This would use the Supabase client
      // const { data, error } = await supabase
      //   .from('page_audio')
      //   .select('*')
      //   .eq('chapter_number', chapterNumber)
      //   .eq('page_number', pageNumber)
      //   .single();

      // For now, return a placeholder
      return {
        success: false,
        error: 'Supabase integration not implemented yet'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export const pageAudioAPI = new PageAudioAPIService();

// Export types for use in components
export type { PageAudioData, ChapterAudioData, TranscriptEntry };
