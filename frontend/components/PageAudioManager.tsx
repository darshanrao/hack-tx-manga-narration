// File: frontend/components/PageAudioManager.tsx

import React, { useState, useEffect, useRef } from 'react';
import { usePageAudio } from '../hooks/usePageAudio';
import { PageAudioData, ChapterAudioData } from '../utils/pageAudioManager';

interface PageAudioManagerProps {
  audioFiles: string[];
  transcriptFiles: string[];
  baseUrl?: string;
  currentPageIndex: number;
  currentChapterIndex?: number;
  onPageAudioChange?: (pageAudio: PageAudioData | null) => void;
  onTranscriptChange?: (transcript: any[]) => void;
  onActiveTranscriptChange?: (activeEntry: any) => void;
  currentTime?: number;
  onMetaChange?: (meta: { totalPages: number; canGoNext: boolean; canGoPrevious: boolean }) => void;
  children?: React.ReactNode;
}

export function PageAudioManager({
  audioFiles,
  transcriptFiles,
  baseUrl = '/assets',
  currentPageIndex,
  currentChapterIndex = 0,
  onPageAudioChange,
  onTranscriptChange,
  onActiveTranscriptChange,
  currentTime = 0,
  onMetaChange,
  children
}: PageAudioManagerProps) {
  
  const {
    currentPageAudio,
    currentTranscript,
    activeTranscriptEntry,
    chapters,
    currentChapter,
    isLoadingTranscript,
    updateActiveTranscript,
    canGoNext,
    canGoPrevious,
    totalPages
  } = usePageAudio({
    audioFiles,
    transcriptFiles,
    baseUrl,
    currentPageIndex,
    currentChapterIndex
  });
  
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

  // Update active transcript when time changes (depend only on time)
  useEffect(() => {
    if (currentTime > 0) {
      updateActiveTranscriptRef.current(currentTime);
    }
  }, [currentTime]);

  // Expose meta (totalPages and navigation availability)
  useEffect(() => {
    onMetaChange?.({ totalPages, canGoNext, canGoPrevious });
  }, [totalPages, canGoNext, canGoPrevious, onMetaChange]);
  
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
