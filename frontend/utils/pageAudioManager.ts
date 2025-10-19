// File: frontend/utils/pageAudioManager.ts

export interface PageAudioData {
  pageNumber: number;
  chapterNumber: number;
  audioUrl: string;
  transcriptUrl: string;
  transcriptData?: TranscriptEntry[];
  duration?: number;
}

export interface TranscriptEntry {
  id: string;
  timestamp: number;
  speaker: string;
  text: string;
  isActive?: boolean;
}

export interface ChapterAudioData {
  chapterNumber: number;
  pages: PageAudioData[];
  totalPages: number;
}

/**
 * Parses filename to extract chapter and page information
 * Expected format: ch{chapter}_page{page}_dialogue_{timestamp}.mp3
 * Example: ch01_page01_dialogue_20251018_220717.mp3
 */
export function parseAudioFilename(filename: string): { chapterNumber: number; pageNumber: number } | null {
  const match = filename.match(/ch(\d+)_page(\d+)_dialogue/);
  if (!match) return null;
  
  return {
    chapterNumber: parseInt(match[1], 10),
    pageNumber: parseInt(match[2], 10)
  };
}

/**
 * Parses transcript filename to extract chapter and page information
 * Expected format: ch{chapter}_page{page}_transcript_{timestamp}.txt
 * Example: ch01_page01_transcript_20251018_220717.txt
 */
export function parseTranscriptFilename(filename: string): { chapterNumber: number; pageNumber: number } | null {
  const match = filename.match(/ch(\d+)_page(\d+)_transcript/);
  if (!match) return null;
  
  return {
    chapterNumber: parseInt(match[1], 10),
    pageNumber: parseInt(match[2], 10)
  };
}

/**
 * Groups audio and transcript files by chapter and page
 */
export function organizePageAudioFiles(
  audioFiles: string[],
  transcriptFiles: string[],
  baseUrl: string = '/assets'
): ChapterAudioData[] {
  // Ensure we join baseUrl and filenames without producing protocol-relative URLs (e.g., //file)
  const joinUrlPath = (root: string, filename: string): string => {
    if (!root || root === '/') {
      return `/${filename}`;
    }
    const trimmed = root.endsWith('/') ? root.slice(0, -1) : root;
    return `${trimmed}/${filename}`;
  };
  const chaptersMap = new Map<number, Map<number, PageAudioData>>();
  
  // Process audio files
  audioFiles.forEach(filename => {
    const parsed = parseAudioFilename(filename);
    if (!parsed) return;
    
    const { chapterNumber, pageNumber } = parsed;
    
    if (!chaptersMap.has(chapterNumber)) {
      chaptersMap.set(chapterNumber, new Map());
    }
    
    const chapterPages = chaptersMap.get(chapterNumber)!;
    if (!chapterPages.has(pageNumber)) {
      chapterPages.set(pageNumber, {
        pageNumber,
        chapterNumber,
        audioUrl: '',
        transcriptUrl: ''
      });
    }
    
    chapterPages.get(pageNumber)!.audioUrl = joinUrlPath(baseUrl, filename);
  });
  
  // Process transcript files
  transcriptFiles.forEach(filename => {
    const parsed = parseTranscriptFilename(filename);
    if (!parsed) return;
    
    const { chapterNumber, pageNumber } = parsed;
    
    if (!chaptersMap.has(chapterNumber)) {
      chaptersMap.set(chapterNumber, new Map());
    }
    
    const chapterPages = chaptersMap.get(chapterNumber)!;
    if (!chapterPages.has(pageNumber)) {
      chapterPages.set(pageNumber, {
        pageNumber,
        chapterNumber,
        audioUrl: '',
        transcriptUrl: ''
      });
    }
    
    chapterPages.get(pageNumber)!.transcriptUrl = joinUrlPath(baseUrl, filename);
  });
  
  // Convert to array format
  const chapters: ChapterAudioData[] = [];
  chaptersMap.forEach((pages, chapterNumber) => {
    const pageArray = Array.from(pages.values()).sort((a, b) => a.pageNumber - b.pageNumber);
    chapters.push({
      chapterNumber,
      pages: pageArray,
      totalPages: pageArray.length
    });
  });
  
  const result = chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  return result;
}

/**
 * Loads transcript data from URL
 */
export async function loadTranscriptData(transcriptUrl: string): Promise<TranscriptEntry[]> {
  try {
    const response = await fetch(transcriptUrl);
    if (!response.ok) {
      throw new Error(`Failed to load transcript: ${response.statusText}`);
    }
    
    const content = await response.text();
    const parsed = parseTranscriptContent(content);
    return parsed;
  } catch (error) {
    console.error('Error loading transcript:', error);
    return [];
  }
}

/**
 * Parses transcript content into structured entries
 */
export function parseTranscriptContent(content: string): TranscriptEntry[] {
  // Remove potential UTF-8 BOM and normalize line endings
  const sanitized = content.replace(/^\uFEFF/, '');
  const lines = sanitized.split(/\r?\n/);
  const entries: TranscriptEntry[] = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    // Allow leading spaces before timestamp and trailing spaces at end
    const match = trimmed.match(/^\s*(\d{2}:\d{2})\s+(.+?):\s+(.+)\s*$/);
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
 * Finds the active transcript entry based on current time
 */
export function findActiveTranscriptEntry(
  entries: TranscriptEntry[], 
  currentTime: number
): TranscriptEntry | null {
  let activeEntry: TranscriptEntry | null = null;
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const nextEntry = entries[i + 1];
    
    if (currentTime >= entry.timestamp && (!nextEntry || currentTime < nextEntry.timestamp)) {
      activeEntry = entry;
      break;
    }
  }
  
  return activeEntry;
}

/**
 * Updates active state for transcript entries
 */
export function updateTranscriptActiveState(
  entries: TranscriptEntry[], 
  currentTime: number
): TranscriptEntry[] {
  return entries.map(entry => ({
    ...entry,
    isActive: entry.timestamp <= currentTime && 
              (entries.find(e => e.timestamp > entry.timestamp)?.timestamp || Infinity) > currentTime
  }));
}

// API Integration Helpers (for future Supabase integration)

export interface SupabasePageAudioData {
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

/**
 * Converts Supabase data to local format
 */
export function convertSupabaseToLocal(supabaseData: SupabasePageAudioData[]): ChapterAudioData[] {
  const chaptersMap = new Map<number, Map<number, PageAudioData>>();
  
  supabaseData.forEach(item => {
    if (!chaptersMap.has(item.chapter_number)) {
      chaptersMap.set(item.chapter_number, new Map());
    }
    
    const chapterPages = chaptersMap.get(item.chapter_number)!;
    chapterPages.set(item.page_number, {
      pageNumber: item.page_number,
      chapterNumber: item.chapter_number,
      audioUrl: item.audio_url,
      transcriptUrl: item.transcript_url,
      transcriptData: item.transcript_content ? parseTranscriptContent(item.transcript_content) : undefined,
      duration: item.duration
    });
  });
  
  const chapters: ChapterAudioData[] = [];
  chaptersMap.forEach((pages, chapterNumber) => {
    const pageArray = Array.from(pages.values()).sort((a, b) => a.pageNumber - b.pageNumber);
    chapters.push({
      chapterNumber,
      pages: pageArray,
      totalPages: pageArray.length
    });
  });
  
  return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
}

/**
 * API endpoint helpers for future integration
 */
export const API_ENDPOINTS = {
  GET_PAGE_AUDIO: (chapterNumber: number, pageNumber: number) => 
    `/api/chapters/${chapterNumber}/pages/${pageNumber}/audio`,
  GET_CHAPTER_AUDIO: (chapterNumber: number) => 
    `/api/chapters/${chapterNumber}/audio`,
  GET_TRANSCRIPT: (chapterNumber: number, pageNumber: number) => 
    `/api/chapters/${chapterNumber}/pages/${pageNumber}/transcript`,
  UPLOAD_PAGE_AUDIO: (chapterNumber: number, pageNumber: number) => 
    `/api/chapters/${chapterNumber}/pages/${pageNumber}/audio/upload`
} as const;
