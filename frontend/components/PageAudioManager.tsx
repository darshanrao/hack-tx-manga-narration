// File: frontend/components/PageAudioManager.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useSupabasePageAudio } from '../hooks/useSupabasePageAudio';
import { usePageAudio } from '../hooks/usePageAudio';
import { PageAudioData, ChapterAudioData } from '../utils/pageAudioManager';

interface PageAudioManagerProps {
  // New Supabase props
  sceneNumber?: number;
  currentPageIndex: number;
  currentChapterIndex?: number;
  onPageAudioChange?: (pageAudio: PageAudioData | null) => void;
  onTranscriptChange?: (transcript: any[]) => void;
  onActiveTranscriptChange?: (activeEntry: any) => void;
  currentTime?: number;
  onMetaChange?: (meta: { totalPages: number; canGoNext: boolean; canGoPrevious: boolean }) => void;
  children?: React.ReactNode;
  
  // Legacy props for fallback support
  audioFiles?: string[];
  transcriptFiles?: string[];
  baseUrl?: string;
}

export function PageAudioManager({
  sceneNumber,
  currentPageIndex,
  currentChapterIndex = 0,
  onPageAudioChange,
  onTranscriptChange,
  onActiveTranscriptChange,
  currentTime = 0,
  onMetaChange,
  children,
  // Legacy props
  audioFiles,
  transcriptFiles,
  baseUrl = '/assets'
}: PageAudioManagerProps) {
  
  // Determine if we should use Supabase or legacy mode
  const useSupabase = sceneNumber !== undefined;
  
  // Supabase mode
  const supabaseData = useSupabasePageAudio({
    sceneNumber,
    currentPageIndex,
    currentChapterIndex
  });
  
  // Legacy mode - use the old hook
  const legacyData = usePageAudio({
    audioFiles: audioFiles || [],
    transcriptFiles: transcriptFiles || [],
    baseUrl,
    currentPageIndex,
    currentChapterIndex
  });
  
  // Use the appropriate data source
  const currentPageAudio = useSupabase ? supabaseData.currentPageAudio : legacyData.currentPageAudio;
  const currentTranscript = useSupabase ? supabaseData.currentTranscript : legacyData.currentTranscript;
  const activeTranscriptEntry = useSupabase ? supabaseData.activeTranscriptEntry : legacyData.activeTranscriptEntry;
  const chapters = useSupabase ? supabaseData.chapters : legacyData.chapters;
  const currentChapter = useSupabase ? supabaseData.currentChapter : legacyData.currentChapter;
  const isLoadingTranscript = useSupabase ? supabaseData.isLoadingTranscript : legacyData.isLoadingTranscript;
  const isLoadingAudio = useSupabase ? supabaseData.isLoadingAudio : legacyData.isLoadingAudio;
  const isLoadingScenes = useSupabase ? supabaseData.isLoadingScenes : false;
  const updateActiveTranscript = useSupabase ? supabaseData.updateActiveTranscript : legacyData.updateActiveTranscript;
  const canGoNext = useSupabase ? supabaseData.canGoNext : legacyData.canGoNext;
  const canGoPrevious = useSupabase ? supabaseData.canGoPrevious : legacyData.canGoPrevious;
  const totalPages = useSupabase ? supabaseData.totalPages : legacyData.totalPages;
  const error = useSupabase ? supabaseData.error : null;
  
  
  
  // Notify parent components of changes
  useEffect(() => {
    onPageAudioChange?.(currentPageAudio);
  }, [currentPageAudio, onPageAudioChange]);
  
  // Only notify parent when transcript content changes (ignore isActive toggles)
  const prevTranscriptSignatureRef = useRef<string>("");
  useEffect(() => {
    if (!currentTranscript) return;
    const signature = JSON.stringify(
      currentTranscript.map((e: any) => ({ id: e.id, timestamp: e.timestamp, speaker: e.speaker, text: e.text }))
    );
    if (signature !== prevTranscriptSignatureRef.current) {
      onTranscriptChange?.(currentTranscript);
      prevTranscriptSignatureRef.current = signature;
    }
  }, [currentTranscript, onTranscriptChange]);
  
  useEffect(() => {
    onActiveTranscriptChange?.(activeTranscriptEntry);
  }, [activeTranscriptEntry, onActiveTranscriptChange]);
  
  // Keep a stable reference to updateActiveTranscript to avoid effect loops
  const updateActiveTranscriptRef = useRef(updateActiveTranscript);
  useEffect(() => {
    updateActiveTranscriptRef.current = updateActiveTranscript;
  }, [updateActiveTranscript]);

  // Update active transcript when time changes (heavily throttled)
  useEffect(() => {
    if (currentTime <= 0) return;
    let raf = 0;
    const run = () => {
      updateActiveTranscriptRef.current(currentTime);
    };
    // throttle to every 1 second to minimize transcript updates
    const timeout = setTimeout(() => {
      raf = requestAnimationFrame(run);
    }, 1000);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [currentTime]);

  // Expose meta (totalPages and navigation availability)
  useEffect(() => {
    onMetaChange?.({ totalPages, canGoNext, canGoPrevious });
  }, [totalPages, canGoNext, canGoPrevious, onMetaChange]);
  
  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-400">
          <p className="text-lg font-semibold">Error loading audio files</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }
  
  // Show loading state
  if (isLoadingScenes) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Loading scenes...</p>
        </div>
      </div>
    );
  }
  
  // Just render children
  return <>{children}</>;
}

// Utility component for displaying current page audio info
export function PageAudioInfo({ 
  pageAudio, 
  transcript, 
  isLoading 
}: { 
  pageAudio: PageAudioData | null; 
  transcript: any[]; 
  isLoading: boolean; 
}) {
  if (!pageAudio) {
    return (
      <div className="text-center text-slate-500 py-4">
        No audio available for this page
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800/50 p-3 rounded-lg">
      <div className="flex items-center justify-between text-sm">
        <div className="text-slate-300">
          <span className="font-semibold">Page {pageAudio.pageNumber}</span>
          <span className="text-slate-500 ml-2">Chapter {pageAudio.chapterNumber}</span>
        </div>
        <div className="text-slate-400">
          {isLoading ? (
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </span>
          ) : (
            <span>{transcript.length} transcript entries</span>
          )}
        </div>
      </div>
    </div>
  );
}
