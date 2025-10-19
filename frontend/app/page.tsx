'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { UploadArea } from "../components/UploadArea";
import { MangaPageViewer } from "../components/MangaPageViewer";
import { PlaybackControls } from "../components/PlaybackControls";
import { PDFPlaybackControls } from "../components/PDFPlaybackControls";
import { EnhancedPlaybackControls } from "../components/EnhancedPlaybackControls";
import { AudioPlayer } from "../components/AudioPlayer";
import { Transcript } from "../components/Transcript";
import { KeyboardShortcutsHelp } from "../components/KeyboardShortcutsHelp";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, Home } from "lucide-react";
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { TranscriptEntry, parseTranscript } from '../utils/transcriptParser';
import { PageAudioManager } from '../components/PageAudioManager';
import { PageAudioData } from '../utils/pageAudioManager';
// Supabase client is not needed in the browser for uploads; we use backend-forwarded uploads instead

// Dynamic import for PDF viewer to avoid SSR issues
const PDFPageViewer = dynamic(() => import('../components/PDFPageViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/30">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading PDF viewer...</p>
      </div>
    </div>
  )
});

interface Panel {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  audioFileUrl?: string; // Path to audio file
  audioDuration?: number; // Duration in seconds
}

interface MangaPage {
  id: number;
  panels: Panel[];
}

export default function HomePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([1]);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState([1]);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [isPDF, setIsPDF] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(1.0);
  const [isTranscriptCollapsed, setIsTranscriptCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [transcriptUrl, setTranscriptUrl] = useState<string | null>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptEntry[]>([]);
  const [currentPageAudio, setCurrentPageAudio] = useState<PageAudioData | null>(null);
  const [pageTranscriptData, setPageTranscriptData] = useState<TranscriptEntry[]>([]);
  const [activeTranscriptEntry, setActiveTranscriptEntry] = useState<TranscriptEntry | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [chapterMeta, setChapterMeta] = useState<{ totalPages: number; canGoNext: boolean; canGoPrevious: boolean }>({ totalPages: 0, canGoNext: false, canGoPrevious: false });
  const previousPanelRef = useRef<string | null>(null);
  const isSeekingRef = useRef<boolean>(false);

  // Define the audio and transcript files for the current PDF - memoize to prevent re-renders
  const audioFiles = useMemo(() => [
    'ch01_page01_dialogue_20251018_220717.mp3',
    'ch01_page02_dialogue_20251018_220717.mp3',
    'ch01_page03_dialogue_20251018_220717.mp3',
    'ch01_page04_dialogue_20251018_220717.mp3',
    'ch01_page05_dialogue_20251018_220717.mp3',
    'ch01_page06_dialogue_20251018_220717.mp3',
    'ch01_page07_dialogue_20251018_220717.mp3',
    // ch02
    'ch02_page01_dialogue_20251018_222240.mp3',
    'ch02_page02_dialogue_20251018_222240.mp3',
    'ch02_page03_dialogue_20251018_222240.mp3',
    'ch02_page04_dialogue_20251018_222240.mp3',
    // ch03
    'ch03_page01_dialogue_20251018_222416.mp3',
    'ch03_page02_dialogue_20251018_222416.mp3',
    'ch03_page03_dialogue_20251018_222416.mp3',
    'ch03_page04_dialogue_20251018_222416.mp3',
    'ch03_page05_dialogue_20251018_222416.mp3'
  ], []);

  const transcriptFiles = useMemo(() => [
    'ch01_page01_transcript_20251018_220717.txt',
    'ch01_page02_transcript_20251018_220717.txt',
    'ch01_page03_transcript_20251018_220717.txt',
    'ch01_page04_transcript_20251018_220717.txt',
    'ch01_page05_transcript_20251018_220717.txt',
    'ch01_page06_transcript_20251018_220717.txt',
    'ch01_page07_transcript_20251018_220717.txt',
    // ch02
    'ch02_page01_transcript_20251018_222240.txt',
    'ch02_page02_transcript_20251018_222240.txt',
    'ch02_page03_transcript_20251018_222240.txt',
    'ch02_page04_transcript_20251018_222240.txt',
    // ch03
    'ch03_page01_transcript_20251018_222416.txt',
    'ch03_page02_transcript_20251018_222416.txt',
    'ch03_page03_transcript_20251018_222416.txt',
    'ch03_page04_transcript_20251018_222416.txt',
    'ch03_page05_transcript_20251018_222416.txt'
  ], []);

  // Mock manga pages with audio files - in a real app, this would be extracted from the uploaded file
  const mockPages: MangaPage[] = [
    {
      id: 1,
      panels: [
        { 
          id: "1", 
          x: 5, y: 5, width: 40, height: 25, 
          text: "In a world where humanity lives behind massive walls to protect themselves from giant humanoid creatures called Titans, young Eren Yeager dreams of exploring the world beyond.",
          audioFileUrl: "/mock-audio/dialogue_output_b0181950.mp3",
          audioDuration: 15.5
        },
        { 
          id: "2", 
          x: 52, y: 5, width: 43, height: 25, 
          text: "One day, a colossal Titan appears and breaches the outer wall, allowing smaller Titans to invade the city.",
          audioFileUrl: "/mock-audio/dialogue_output_b0181950.mp3",
          audioDuration: 12.3
        },
        { 
          id: "3", 
          x: 5, y: 33, width: 28, height: 15, 
          text: "Mother! No!",
          audioFileUrl: "/mock-audio/dialogue_output_b0181950.mp3",
          audioDuration: 2.1
        },
        { 
          id: "4", 
          x: 36, y: 33, width: 59, height: 30, 
          text: "Eren watches in horror as his mother is devoured by a Titan, vowing to eliminate every last one of them from the face of the Earth.",
          audioFileUrl: "/mock-audio/dialogue_output_b0181950.mp3",
          audioDuration: 18.7
        },
        { 
          id: "5", 
          x: 5, y: 51, width: 28, height: 20, 
          text: "I'll kill them all. Every single Titan!",
          audioFileUrl: "/mock-audio/dialogue_output_b0181950.mp3",
          audioDuration: 4.2
        },
        { 
          id: "6", 
          x: 5, y: 73, width: 42, height: 22, 
          text: "Years later, Eren joins the military along with his childhood friends Mikasa and Armin.",
          audioFileUrl: "/mock-audio/dialogue_output_b0181950.mp3",
          audioDuration: 8.9
        },
        { 
          id: "7", 
          x: 50, y: 66, width: 45, height: 15, 
          text: "Eren, you need to control your emotions. That's how you'll survive.",
          audioFileUrl: "/mock-audio/dialogue_output_b0181950.mp3",
          audioDuration: 6.4
        },
        { 
          id: "8", 
          x: 50, y: 83, width: 45, height: 12, 
          text: "During training, Eren proves to be a fierce and determined soldier.",
          audioFileUrl: "/mock-audio/dialogue_output_b0181950.mp3",
          audioDuration: 7.1
        },
      ],
    },
    {
      id: 2,
      panels: [
        { id: "1", x: 5, y: 5, width: 90, height: 30, text: "As they prepare for their first mission outside the walls, the three friends are about to discover the truth about the Titans." },
        { id: "2", x: 5, y: 38, width: 43, height: 28, text: "We have to stick together. That's the only way we'll make it through this." },
        { id: "3", x: 52, y: 38, width: 43, height: 28, text: "The Survey Corps ventures beyond the walls, facing unimaginable dangers." },
        { id: "4", x: 5, y: 69, width: 90, height: 26, text: "But nothing could prepare them for what they would discover about their own world." },
      ],
    },
    {
      id: 3,
      panels: [
        { id: "1", x: 5, y: 5, width: 43, height: 40, text: "In a desperate moment, Eren discovers a power within himself that could change everything." },
        { id: "2", x: 52, y: 5, width: 43, height: 20, text: "He can transform into a Titan." },
        { id: "3", x: 52, y: 28, width: 43, height: 17, text: "This revelation shocks everyone." },
        { id: "4", x: 5, y: 48, width: 90, height: 23, text: "Now, the question becomes: Is Eren humanity's greatest weapon, or their greatest threat?" },
        { id: "5", x: 5, y: 74, width: 43, height: 21, text: "The fate of humanity hangs in the balance." },
        { id: "6", x: 52, y: 74, width: 43, height: 21, text: "And the truth is far more complex than anyone imagined." },
      ],
    },
  ];

  const currentPage = mockPages[currentPageIndex];
  const currentPanel = currentPage?.panels[currentPanelIndex];

  // Load transcript data on component mount - use page-specific transcripts
  useEffect(() => {
    // The page-specific transcripts are now handled by PageAudioManager
    // This effect is no longer needed since pageTranscriptData is managed by the hook
  }, [pageTranscriptData, currentPageAudio]);

  // Audio player effect - handles audio playback with real audio files
  useEffect(() => {
    // Only reset time when switching panels/pages, not when pausing
    // If we're using page-level audio (from PageAudioManager), do not reset on panel changes
    if (currentPageAudio?.audioUrl) {
      // When page audio is active, we avoid resetting currentTime on panel changes
      return;
    }
    if (!currentPanel?.audioFileUrl) {
      setCurrentTime(0);
      setDuration(0);
      previousPanelRef.current = null;
      return;
    }
    
    // Only reset time when switching to a different panel
    const currentPanelId = currentPanel.id;
    if (previousPanelRef.current !== currentPanelId) {
      setCurrentTime(0);
      previousPanelRef.current = currentPanelId;
    }
  }, [currentPanelIndex, currentPageIndex, currentPanel]);

  // Audio event handlers
  const handleTimeUpdate = (time: number) => {
    // Only update if we're not currently seeking
    if (!isSeekingRef.current) {
      setCurrentTime(time);
    }
  };

  const handleDurationChange = (dur: number) => {
    setDuration(dur);
  };

  const handleAudioEnded = () => {
    // If using page-level audio, advance pages directly (ignore panels)
    if (currentPageAudio?.audioUrl) {
      if (currentPageIndex < mockPages.length - 1) {
        setCurrentPageIndex((prev) => prev + 1);
        setCurrentPanelIndex(0);
      } else {
        setIsPlaying(false);
      }
      return;
    }
    // Panel-level audio flow
    if (currentPanelIndex < currentPage.panels.length - 1) {
      setCurrentPanelIndex((prev) => prev + 1);
    } else if (currentPageIndex < mockPages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
      setCurrentPanelIndex(0);
    } else {
      setIsPlaying(false);
    }
  };

  const handleAudioError = () => {
    console.error('Audio playback error - file may not exist or be corrupted');
    setIsPlaying(false);
    // Optionally show user-friendly error message
    // You could add a toast notification here
  };

  // Debug: log audio URL candidates when they change
  useEffect(() => {
    // Helps diagnose NotSupportedError / Failed to fetch
    console.log('Audio candidates:', {
      pageAudioUrl: currentPageAudio?.audioUrl,
      panelAudioUrl: currentPanel?.audioFileUrl
    });
  }, [currentPageAudio, currentPanel]);

  const handleSeek = (time: number) => {
    console.log('handleSeek called with:', time, 'current duration:', duration);
    isSeekingRef.current = true;
    setCurrentTime(time);
    
    // Reset seeking flag after a short delay
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 200);
  };

  const handleSeekBackward = () => {
    handleSeek(Math.max(0, currentTime - 5));
  };

  const handleSeekForward = () => {
    handleSeek(Math.min(duration, currentTime + 5));
  };

  // Reset panel index when page changes manually (do not touch speed)
  useEffect(() => {
    setCurrentPanelIndex(0);
  }, [currentPageIndex]);

  // Comprehensive keyboard shortcuts for playback controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!uploadedFile) return;

      // Prevent shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Prevent default for our shortcuts
      const shortcuts = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'm', 'M', '+', '-', '=', '0', 'PageUp', 'PageDown'];
      if (shortcuts.includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case ' ': // Spacebar - Play/Pause
          handlePlayPause();
          break;
        
        case 'ArrowLeft': // Left Arrow - Rewind 5 seconds
          console.log('Left arrow pressed, seeking from', currentTime, 'to', Math.max(0, currentTime - 5));
          handleSeek(Math.max(0, currentTime - 5));
          break;
        
        case 'ArrowRight': // Right Arrow - Skip 5 seconds
          console.log('Right arrow pressed, seeking from', currentTime, 'to', Math.min(duration, currentTime + 5));
          handleSeek(Math.min(duration, currentTime + 5));
          break;
        
        case 'ArrowUp': // Up Arrow - Volume Up
          setVolume(prev => [Math.min(1, prev[0] + 0.1)]);
          break;
        
        case 'ArrowDown': // Down Arrow - Volume Down
          setVolume(prev => [Math.max(0, prev[0] - 0.1)]);
          break;
        
        case 'm':
        case 'M': // M - Mute/Unmute
          toggleMute();
          break;
        
        case '+':
        case '=': // Plus/Equals - Speed Up
          setSpeed(prev => [Math.min(2, prev[0] + 0.1)]);
          break;
        
        case '-': // Minus - Speed Down
          setSpeed(prev => [Math.max(0.5, prev[0] - 0.1)]);
          break;
        
        case '0': // Zero - Reset Speed
          setSpeed([1]);
          break;
        
        case 'Home': // Home - First Page/Panel
          if (isPDF) {
            handleFirstPage();
          } else {
            setCurrentPageIndex(0);
            setCurrentPanelIndex(0);
            setIsPlaying(false);
          }
          break;
        
        case 'End': // End - Last Page/Panel
          if (isPDF) {
            handleLastPage();
          } else {
            const maxPages = mockPages.length;
            setCurrentPageIndex(maxPages - 1);
            setCurrentPanelIndex(mockPages[maxPages - 1].panels.length - 1);
            setIsPlaying(false);
          }
          break;
        
        case 'Escape': // Escape - Stop playback
          setIsPlaying(false);
          window.speechSynthesis.cancel();
          break;
        
        case 'PageUp': // Page Up - Previous page/panel
          if (isPDF) {
            handlePreviousPage();
          } else {
            handlePreviousPanel();
          }
          break;
        
        case 'PageDown': // Page Down - Next page/panel
          if (isPDF) {
            handleNextPage();
          } else {
            handleNextPanel();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uploadedFile, isPDF, isPlaying, currentPageIndex, currentPanelIndex, volume, speed, isMuted, currentTime, duration]);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setCurrentPageIndex(0);
    setCurrentPanelIndex(0);
    setIsPlaying(false);
    setPdfZoom(1.0); // Reset zoom for new file
    
    // Check if file is PDF
    const isPDFFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setIsPDF(isPDFFile);
    // Auto-select chapter based on filename pattern: scene-#.pdf → chapterIndex = # - 1
    // Example: scene-1.pdf → chapterIndex 0 (ch01_* files)
    try {
      const name = file.name.toLowerCase();
      const match = name.match(/scene[-_](\d+)/);
      if (match) {
        const sceneNumber = parseInt(match[1], 10);
        if (!Number.isNaN(sceneNumber) && sceneNumber > 0) {
          setChapterIndex(sceneNumber - 1);
          setCurrentPageIndex(0);
        }
      }
    } catch {}
    
    if (!isPDFFile) {
      setPdfPageCount(0);
    }

    // Set PDF page count for testing (backend upload is optional)
    if (isPDFFile) {
      setPdfPageCount(7); // Set to 7 pages for your test PDF
    }

    // Backend upload is optional - comment out for testing without backend
    /*
    try {
      const bucket = 'manga-pdfs';
      const objectPath = `pdfs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', bucket);
      form.append('object_path', objectPath);

      const up = await fetch(`${API_BASE}/api/storage/upload`, {
        method: 'POST',
        body: form,
      });
      if (!up.ok) {
        const err = await up.json().catch(() => ({}));
        console.error('Backend upload failed:', err?.detail || up.status);
        return;
      }
      const uploaded = await up.json();
      const uploadedPath: string = uploaded.object_path;

      if (uploadedPath) {
        console.log('Uploaded to:', uploadedPath);
        // Optionally kick off backend ingest here
        try {
          const res = await fetch(`${API_BASE}/api/ingest/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket, object_path: uploadedPath }),
          });
          if (res.ok) {
            const { job_id } = await res.json();
            console.log('Ingest job started:', job_id);
            setJobId(job_id);
            setJobStatus('queued');
          } else {
            console.warn('Failed to start ingest, status:', res.status);
          }
        } catch (e) {
          console.warn('Unable to contact backend ingest endpoint:', e);
        }
      }
    } catch (e) {
      console.error('Unexpected upload failure:', e);
    }
    */
  };

  // Poll job status if we have a jobId
  useEffect(() => {
    if (!jobId) return;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ingest/status/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        setJobStatus(data.status);
        if (data.status === 'done') {
          clearInterval(interval);
          const tUrl = data.outputs?.transcript_url as string | undefined;
          if (tUrl) setTranscriptUrl(tUrl);
        }
        if (data.status === 'error') {
          clearInterval(interval);
        }
      } catch (e) {
        // ignore transient errors
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [jobId]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = useCallback((value: number[]) => {
    console.log('Volume changing to:', value);
    setVolume(value);
  }, []);

  const handleSpeedChange = useCallback((value: number[]) => {
    console.log('Speed changing to:', value);
    setSpeed(value);
  }, []);

  const handlePreviousPanel = () => {
    if (currentPanelIndex > 0) {
      setCurrentPanelIndex((prev) => prev - 1);
      setIsPlaying(false);
    } else if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
      setCurrentPanelIndex(mockPages[currentPageIndex - 1].panels.length - 1);
      setIsPlaying(false);
    }
  };

  const handleNextPanel = () => {
    if (currentPanelIndex < currentPage.panels.length - 1) {
      setCurrentPanelIndex((prev) => prev + 1);
      setIsPlaying(false);
    } else if (currentPageIndex < mockPages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
      setCurrentPanelIndex(0);
      setIsPlaying(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
      setIsPlaying(false);
    }
  };

  const handleNextPage = () => {
    const maxPages = currentPageAudio?.audioUrl ? chapterMeta.totalPages : (isPDF ? pdfPageCount : mockPages.length);
    if (currentPageIndex < maxPages - 1) {
      setCurrentPageIndex((prev) => prev + 1);
      setIsPlaying(false);
    }
  };

  const handleFirstPage = () => {
    setCurrentPageIndex(0);
    setIsPlaying(false);
  };

  const handleLastPage = () => {
    const maxPages = currentPageAudio?.audioUrl ? chapterMeta.totalPages : (isPDF ? pdfPageCount : mockPages.length);
    setCurrentPageIndex(maxPages - 1);
    setIsPlaying(false);
  };

  const handleReset = () => {
    window.speechSynthesis.cancel();
    setUploadedFile(null);
    setCurrentPageIndex(0);
    setCurrentPanelIndex(0);
    setIsPlaying(false);
    setIsPDF(false);
    setPdfPageCount(0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const canGoPreviousPanel = currentPageIndex > 0 || currentPanelIndex > 0;
  const canGoNextPanel = 
    currentPageIndex < mockPages.length - 1 || 
    currentPanelIndex < currentPage?.panels.length - 1;

  return (
        <PageAudioManager
          audioFiles={audioFiles}
          transcriptFiles={transcriptFiles}
          baseUrl="/"
          currentPageIndex={currentPageIndex}
          currentChapterIndex={chapterIndex}
          onPageAudioChange={setCurrentPageAudio}
          onTranscriptChange={setPageTranscriptData}
          onActiveTranscriptChange={setActiveTranscriptEntry}
          onMetaChange={setChapterMeta}
          currentTime={currentTime}
        >
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl px-8 py-6 flex items-center justify-between shadow-lg shadow-black/20">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Manga Reader
          </h1>
          <p className="text-slate-300 mt-1 font-medium">
            {uploadedFile
              ? `${uploadedFile.name} - Page ${currentPageIndex + 1} of ${isPDF ? pdfPageCount : mockPages.length}`
              : "Upload a manga file to begin reading"}
          </p>
        </div>
              <div className="flex gap-3 items-center">
          <KeyboardShortcutsHelp />
          {/* Backend status indicator */}
          <div className="px-3 py-2 rounded-md bg-blue-900/80 border border-blue-600 text-blue-200 text-sm">
            <span className="font-semibold">Backend:</span> Offline (PDF viewer works locally)
          </div>
          <Link href="/landing">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg text-slate-200"
            >
              <Home className="h-5 w-5" />
              Home
            </Button>
          </Link>
          {uploadedFile && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleReset}
              className="gap-2 bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg text-slate-200"
            >
              <RotateCcw className="h-5 w-5" />
              Upload New File
            </Button>
          )}
        </div>
      </div>

      {/* Main Content - Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {uploadedFile ? (
          <>
            {/* Left Side - Manga/PDF Viewer (75% width) */}
            <div className="w-2/5 overflow-hidden">
              {isPDF ? (
                <PDFPageViewer
                  pdfFile={uploadedFile}
                  currentPageIndex={currentPageIndex}
                  onPageCountChange={setPdfPageCount}
                />
              ) : (
                <MangaPageViewer
                  panels={currentPage.panels}
                  currentPanelId={currentPanel?.id || null}
                />
              )}
            </div>
            
            {/* Right Side - Transcript and Controls (25% width) */}
            <div className="w-3/5 flex flex-col border-l border-slate-700/50 h-full min-h-0">
              {/* Transcript - Fixed height with scroll */}
              <div className={`transition-[height] duration-300 ease-out ${
                isTranscriptCollapsed ? 'h-auto' : 'h-3/5 flex-shrink-0'
              }`}>
                <Transcript
                  currentText={currentPanel?.text}
                  isPlaying={isPlaying}
                  className="h-full"
                  onCollapseChange={setIsTranscriptCollapsed}
                  currentTime={currentTime}
                  transcriptData={pageTranscriptData.length > 0 ? pageTranscriptData : transcriptData}
                  onSeek={handleSeek}
                />
              </div>
              
              {/* Playback Controls - Takes remaining space */}
              <div className={`transition-[background-color,border-color] duration-300 ease-out ${
                isTranscriptCollapsed 
                  ? 'flex-1 flex items-center justify-center bg-slate-900 min-h-0' 
                  : 'flex-1 border-t border-slate-700/50 bg-slate-900 min-h-0'
              }`}>
                {isPDF ? (
                  <PDFPlaybackControls
                    currentPage={currentPageIndex + 1}
                    totalPages={pdfPageCount}
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                    speed={speed}
                    onSpeedChange={handleSpeedChange}
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={handleSeek}
                    onSeekBackward={handleSeekBackward}
                    onSeekForward={handleSeekForward}
                    onPreviousPage={handlePreviousPage}
                    onNextPage={handleNextPage}
                    canGoPreviousPage={currentPageIndex > 0}
                    canGoNextPage={currentPageIndex < pdfPageCount - 1}
                    fullWidth={isTranscriptCollapsed}
                  />
                ) : (
                  <EnhancedPlaybackControls
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    onPrevious={handlePreviousPanel}
                    onNext={handleNextPanel}
                    canGoPrevious={canGoPreviousPanel}
                    canGoNext={canGoNextPanel}
                    currentPanel={currentPanelIndex + 1}
                    totalPanels={currentPage.panels.length}
                    currentTime={currentTime}
                    duration={duration}
                    volume={volume}
                    onVolumeChange={setVolume}
                    speed={speed}
                    onSpeedChange={setSpeed}
                    onSeek={handleSeek}
                    fullWidth={isTranscriptCollapsed}
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="w-full">
            <UploadArea
              onFileUpload={handleFileUpload}
              uploadedFileName={uploadedFile?.name}
            />
          </div>
        )}
      </div>
      
      {/* Audio Player - Hidden component that handles audio playback */}
      {(currentPanel?.audioFileUrl || (currentPageAudio?.audioUrl && currentPageAudio.audioUrl !== '')) && (
        <AudioPlayer
          audioUrl={currentPageAudio?.audioUrl || currentPanel?.audioFileUrl || ''}
          isPlaying={isPlaying}
          volume={volume[0]}
          speed={speed[0]}
          isMuted={isMuted}
          currentTime={currentTime}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onEnded={handleAudioEnded}
          onError={handleAudioError}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
        />
      )}
    </div>
    </PageAudioManager>
  );
}
