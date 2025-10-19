// File: frontend/hooks/usePageAudio.ts

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  PageAudioData, 
  ChapterAudioData, 
  TranscriptEntry,
  organizePageAudioFiles,
  loadTranscriptData,
  updateTranscriptActiveState,
  findActiveTranscriptEntry
} from '../utils/pageAudioManager';

interface UsePageAudioOptions {
  audioFiles?: string[];
  transcriptFiles?: string[];
  baseUrl?: string;
  currentPageIndex: number;
  currentChapterIndex?: number;
}

interface UsePageAudioReturn {
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
  
  // Actions
  loadPageTranscript: (pageNumber: number, chapterNumber?: number) => Promise<void>;
  updateActiveTranscript: (currentTime: number) => void;
  goToPage: (pageNumber: number, chapterNumber?: number) => Promise<void>;
  goToNextPage: () => Promise<void>;
  goToPreviousPage: () => Promise<void>;
  
  // Navigation helpers
  canGoNext: boolean;
  canGoPrevious: boolean;
  totalPages: number;
}

export function usePageAudio({
  audioFiles = [],
  transcriptFiles = [],
  baseUrl = '/assets',
  currentPageIndex,
  currentChapterIndex = 0
}: UsePageAudioOptions): UsePageAudioReturn {
  
  // State
  const [chapters, setChapters] = useState<ChapterAudioData[]>([]);
  const [currentPageAudio, setCurrentPageAudio] = useState<PageAudioData | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<TranscriptEntry[]>([]);
  const [activeTranscriptEntry, setActiveTranscriptEntry] = useState<TranscriptEntry | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  // Refs
  const loadedTranscripts = useRef<Map<string, TranscriptEntry[]>>(new Map());
  
  // Organize files into chapters and pages
  useEffect(() => {
    if (audioFiles.length > 0 || transcriptFiles.length > 0) {
      const organizedChapters = organizePageAudioFiles(audioFiles, transcriptFiles, baseUrl);
      setChapters(organizedChapters);
    }
  }, [audioFiles, transcriptFiles, baseUrl]);
  
  // Get current chapter - memoize to prevent infinite loops
  const currentChapter = useMemo(() => {
    return chapters[currentChapterIndex] || null;
  }, [chapters, currentChapterIndex]);
  
  // Get current page audio data
  useEffect(() => {
    if (currentChapter && currentChapter.pages[currentPageIndex]) {
      const pageAudio = currentChapter.pages[currentPageIndex];
      setCurrentPageAudio(pageAudio);
    } else {
      setCurrentPageAudio(null);
    }
  }, [currentChapter, currentPageIndex]);
  
  // Load transcript for current page
  const loadPageTranscript = useCallback(async (pageNumber: number, chapterNumber?: number) => {
    // Get the target chapter - use the current chapters state directly
    const targetChapter = chapterNumber !== undefined 
      ? chapters.find(c => c.chapterNumber === chapterNumber)
      : chapters[currentChapterIndex];
      
    if (!targetChapter) {
      return;
    }
    
    const pageData = targetChapter.pages.find(p => p.pageNumber === pageNumber);
    if (!pageData || !pageData.transcriptUrl) {
      return;
    }
    
    const transcriptKey = `${targetChapter.chapterNumber}-${pageNumber}`;
    
    // Check if already loaded
    if (loadedTranscripts.current.has(transcriptKey)) {
      const transcript = loadedTranscripts.current.get(transcriptKey)!;
      setCurrentTranscript(transcript);
      return;
    }
    
    setIsLoadingTranscript(true);
    try {
      const transcript = await loadTranscriptData(pageData.transcriptUrl);
      loadedTranscripts.current.set(transcriptKey, transcript);
      setCurrentTranscript(transcript);
    } catch (error) {
      console.error('Failed to load transcript:', error);
      setCurrentTranscript([]);
    } finally {
      setIsLoadingTranscript(false);
    }
  }, [chapters, currentChapterIndex]);
  
  // Load transcript when page changes
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
  
  // Navigation functions
  const goToPage = useCallback(async (pageNumber: number, chapterNumber?: number) => {
    const targetChapter = chapterNumber !== undefined ? chapters[chapterNumber] : currentChapter;
    if (!targetChapter) return;
    
    const pageIndex = targetChapter.pages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) return;
    
    // This would typically be handled by the parent component
    // For now, we'll just load the transcript
    await loadPageTranscript(pageNumber, chapterNumber);
  }, [chapters, currentChapter, loadPageTranscript]);
  
  const goToNextPage = useCallback(async () => {
    if (!currentChapter || currentPageIndex >= currentChapter.pages.length - 1) return;
    
    const nextPage = currentChapter.pages[currentPageIndex + 1];
    await loadPageTranscript(nextPage.pageNumber, nextPage.chapterNumber);
  }, [currentChapter, currentPageIndex, loadPageTranscript]);
  
  const goToPreviousPage = useCallback(async () => {
    if (!currentChapter || currentPageIndex <= 0) return;
    
    const prevPage = currentChapter.pages[currentPageIndex - 1];
    await loadPageTranscript(prevPage.pageNumber, prevPage.chapterNumber);
  }, [currentChapter, currentPageIndex, loadPageTranscript]);
  
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
    
    // Actions
    loadPageTranscript,
    updateActiveTranscript,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    
    // Navigation helpers
    canGoNext,
    canGoPrevious,
    totalPages
  };
}

// Hook for API integration (future Supabase)
export function usePageAudioAPI(chapterNumber: number, pageNumber: number) {
  const [pageAudio, setPageAudio] = useState<PageAudioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadPageAudio = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would be replaced with actual API calls
      const response = await fetch(`/api/chapters/${chapterNumber}/pages/${pageNumber}/audio`);
      if (!response.ok) {
        throw new Error(`Failed to load page audio: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPageAudio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [chapterNumber, pageNumber]);
  
  useEffect(() => {
    loadPageAudio();
  }, [loadPageAudio]);
  
  return {
    pageAudio,
    isLoading,
    error,
    refetch: loadPageAudio
  };
}
