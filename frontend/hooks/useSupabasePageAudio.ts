// File: frontend/hooks/useSupabasePageAudio.ts

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  SupabaseAudioService, 
  SceneFolderInfo, 
  APIResponse 
} from '../services/supabaseAudioService';
import { 
  PageAudioData, 
  ChapterAudioData, 
  TranscriptEntry,
  updateTranscriptActiveState,
  findActiveTranscriptEntry,
  parseAudioFilename
} from '../utils/pageAudioManager';

interface UseSupabasePageAudioOptions {
  sceneNumber?: number;
  currentPageIndex: number;
  currentChapterIndex?: number;
}

interface UseSupabasePageAudioReturn {
  // Current page data
  currentPageAudio: PageAudioData | null;
  currentTranscript: TranscriptEntry[];
  activeTranscriptEntry: TranscriptEntry | null;
  
  // Chapter data
  chapters: ChapterAudioData[];
  currentChapter: ChapterAudioData | null;
  
  // Loading states
  isLoadingTranscript: boolean;
  isLoadingAudio: boolean;
  isLoadingScenes: boolean;
  
  // Actions
  loadPageTranscript: (pageNumber: number) => Promise<void>;
  updateActiveTranscript: (currentTime: number) => void;
  loadSceneData: (sceneNumber: number) => Promise<void>;
  
  // Navigation helpers
  canGoNext: boolean;
  canGoPrevious: boolean;
  totalPages: number;
  
  // Error handling
  error: string | null;
}

export function useSupabasePageAudio({
  sceneNumber,
  currentPageIndex,
  currentChapterIndex = 0
}: UseSupabasePageAudioOptions): UseSupabasePageAudioReturn {
  
  // State
  const [chapters, setChapters] = useState<ChapterAudioData[]>([]);
  const [currentPageAudio, setCurrentPageAudio] = useState<PageAudioData | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<TranscriptEntry[]>([]);
  const [activeTranscriptEntry, setActiveTranscriptEntry] = useState<TranscriptEntry | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const loadedTranscripts = useRef<Map<string, TranscriptEntry[]>>(new Map());
  const apiService = useRef(new SupabaseAudioService());
  
  // Load specific scene when sceneNumber changes
  useEffect(() => {
          const loadSceneData = async () => {
            
            
            if (sceneNumber === undefined) {
              
              setChapters([]);
              setCurrentPageAudio(null);
              setCurrentTranscript([]);
              setError(null);
              return;
            }

            
            setIsLoadingScenes(true);
            setError(null);
            
            try {
              const response = await apiService.current.getSceneFiles(sceneNumber);
              
              
              if (response.success && response.data) {
                // Convert SceneFolderInfo to ChapterAudioData
                const sceneInfo = response.data;
                  
                
                // Create chapter data manually since we have the file information
                const pages: PageAudioData[] = [];
                
                  // Process audio files to create page data (robust parsing)
                  sceneInfo.audioFiles.forEach(file => {
                    const parsed = parseAudioFilename(file.name);
                    if (!parsed) return;
                    const pageNumber = parsed.pageNumber;

                    // Find corresponding transcript file by parsed page number (supports 1 or 01)
                    const pageTag = pageNumber.toString().padStart(2, '0');
                    const transcriptFile = sceneInfo.transcriptFiles.find(tf => 
                      tf.name.includes(`page${pageTag}_transcript`) || tf.name.includes(`page${pageNumber}_transcript`)
                    );

                    pages.push({
                      pageNumber,
                      chapterNumber: sceneNumber,
                      // Use Supabase public URLs directly for better performance
                      audioUrl: file.publicUrl || '',
                      transcriptUrl: transcriptFile?.publicUrl || ''
                    });
                  });
                
                // Sort pages by page number
                pages.sort((a, b) => a.pageNumber - b.pageNumber);
                
                const chapterData: ChapterAudioData[] = [{
                  chapterNumber: sceneNumber,
                  pages,
                  totalPages: pages.length
                }];
                
                
                setChapters(chapterData);
              } else {
                console.error('API error:', response.error);
                setError(response.error || 'Failed to load scene files');
                setChapters([]);
              }
            } catch (err) {
              console.error('Error loading scene data:', err);
              setError(err instanceof Error ? err.message : 'Unknown error');
              setChapters([]);
            } finally {
              setIsLoadingScenes(false);
            }
          };
    
    loadSceneData();
  }, [sceneNumber]);
  
  // Get current chapter - memoize to prevent infinite loops
  const currentChapter = useMemo(() => {
    return chapters[currentChapterIndex] || null;
  }, [chapters, currentChapterIndex]);
  
  // Set current page audio when chapter or page changes
  useEffect(() => {
    
    
    if (currentChapter && currentChapter.pages[currentPageIndex]) {
      const pageAudio = currentChapter.pages[currentPageIndex];
      
      setCurrentPageAudio(pageAudio);
    } else {
      
      setCurrentPageAudio(null);
    }
  }, [currentChapter, currentPageIndex]);
  
          // Robust transcript parser: supports JSON or plain text with timecodes
          const parseTranscriptContent = (content: string): TranscriptEntry[] => {
            const parseTimecode = (value: string): number | null => {
              const s = value.trim();
              // HH:MM:SS.mmm | MM:SS.mmm | H:MM:SS | MM:SS
              const m = s.match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?/);
              if (!m) return null;
              const hours = m[1] ? parseInt(m[1], 10) : 0;
              const minutes = parseInt(m[2], 10) || 0;
              const seconds = parseInt(m[3], 10) || 0;
              const millis = m[4] ? parseInt(m[4].padEnd(3, '0'), 10) : 0;
              return hours * 3600 + minutes * 60 + seconds + millis / 1000;
            };

            const fromJson = (): TranscriptEntry[] | null => {
              try {
                const data = JSON.parse(content);
                if (!Array.isArray(data)) return null;
                const entries: TranscriptEntry[] = data.map((raw: any, idx: number) => {
                  let speaker: string = raw.speaker || 'Narrator';
                  let text: string = (raw.text ?? '').toString();
                  let ts: number | null = null;
                  if (typeof raw.timestamp === 'number') ts = raw.timestamp;
                  else if (typeof raw.timestamp === 'string') ts = parseTimecode(raw.timestamp);
                  // If timestamp not provided but text starts with timecode, extract
                  if (ts === null) {
                    const tm = text.match(/^\s*(?:(\d{1,2}:)?\d{1,2}:\d{2}(?:\.\d{1,3})?)/);
                    if (tm) {
                      ts = parseTimecode(tm[0]) ?? null;
                      text = text.slice(tm[0].length).trim();
                    }
                  }
                  // If speaker not provided, try prefix "Name:"
                  const sp = text.match(/^([^:]+):\s*(.*)$/);
                  if (!raw.speaker && sp) {
                    speaker = sp[1].trim();
                    text = sp[2].trim();
                  }
                  return {
                    id: raw.id ?? `line-${idx}`,
                    timestamp: ts ?? idx * 2,
                    speaker,
                    text,
                    isActive: false
                  };
                });
                // Sort by timestamp ascending
                entries.sort((a, b) => a.timestamp - b.timestamp);
                return entries;
              } catch {
                return null;
              }
            };

            const fromPlainText = (): TranscriptEntry[] => {
              const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
              let lastTs = 0;
              const entries: TranscriptEntry[] = lines.map((line, idx) => {
                // Extract timecode at start
                let text = line;
                let ts = 0;
                const tm = line.match(/^\s*(?:(\d{1,2}:)?\d{1,2}:\d{2}(?:\.\d{1,3})?)/);
                if (tm) {
                  const parsed = parseTimecode(tm[0]);
                  if (parsed !== null) ts = parsed;
                  text = line.slice(tm[0].length).trim();
                } else {
                  // No timecode: increment from last
                  ts = lastTs + 2;
                }
                // Extract optional speaker prefix "Name:"
                let speaker = 'Narrator';
                const sp = text.match(/^([^:]+):\s*(.*)$/);
                if (sp) {
                  speaker = sp[1].trim();
                  text = sp[2].trim();
                }
                lastTs = ts;
                return {
                  id: `line-${idx}`,
                  timestamp: ts,
                  speaker,
                  text,
                  isActive: false
                };
              });
              // Ensure ordered
              entries.sort((a, b) => a.timestamp - b.timestamp);
              return entries;
            };

            return fromJson() ?? fromPlainText();
          };

  // Load transcript for current page
  const loadPageTranscript = useCallback(async (pageNumber: number, chapterNumber?: number) => {
    const targetChapter = chapterNumber !== undefined 
      ? chapters.find(c => c.chapterNumber === chapterNumber)
      : chapters[currentChapterIndex];
      
    if (!targetChapter) {
      setCurrentTranscript([]);
      return;
    }
    
    const pageData = targetChapter.pages.find(p => p.pageNumber === pageNumber);
    if (!pageData || !pageData.transcriptUrl) {
      setCurrentTranscript([]);
      return;
    }
    
    setIsLoadingTranscript(true);
    try {
      const response = await fetch(pageData.transcriptUrl);
      if (!response.ok) {
        throw new Error(`Failed to load transcript from ${pageData.transcriptUrl}: ${response.statusText}`);
      }
      const content = await response.text();
      const parsed = parseTranscriptContent(content);
      setCurrentTranscript(parsed);
    } catch (error) {
      console.error('Failed to load transcript:', error);
      setCurrentTranscript([]);
      setError(`Failed to load transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingTranscript(false);
    }
  }, [chapters, currentChapterIndex]);
  
  // Load transcript when page audio changes
  useEffect(() => {
    if (currentPageAudio) {
      loadPageTranscript(currentPageAudio.pageNumber, currentPageAudio.chapterNumber);
    }
  }, [currentPageAudio, loadPageTranscript]);
  
  // Update active transcript entry based on current time
  const updateActiveTranscript = useCallback((currentTime: number) => {
    if (currentTranscript.length === 0) return;
    
    const updatedTranscript = updateTranscriptActiveState(currentTranscript, currentTime);
    // Only update state if something actually changed to avoid update loops
    const changed = updatedTranscript.length !== currentTranscript.length ||
      updatedTranscript.some((e, i) => e.isActive !== currentTranscript[i]?.isActive);
    if (changed) {
      setCurrentTranscript(updatedTranscript);
      const activeEntry = findActiveTranscriptEntry(updatedTranscript, currentTime);
      setActiveTranscriptEntry(activeEntry);
    }
  }, [currentTranscript]);
  
  
  // Navigation helpers
  const canGoNext = currentChapter ? currentPageIndex < currentChapter.pages.length - 1 : false;
  const canGoPrevious = currentPageIndex > 0;
  const totalPages = currentChapter ? currentChapter.totalPages : 0;
  
  return {
    // Current page data
    currentPageAudio,
    currentTranscript,
    activeTranscriptEntry,
    
    // Chapter data
    chapters,
    currentChapter,
    
    // Loading states
    isLoadingTranscript,
    isLoadingAudio,
    isLoadingScenes,
    
    // Actions
    loadPageTranscript,
    updateActiveTranscript,
    
    // Navigation helpers
    canGoNext,
    canGoPrevious,
    totalPages,
    
    // Error handling
    error
  };
}
