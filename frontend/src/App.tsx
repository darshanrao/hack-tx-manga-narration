import { useState, useEffect } from "react";
import { UploadArea } from "./components/UploadArea";
import { MangaPageViewer } from "./components/MangaPageViewer";
import { PlaybackControls } from "./components/PlaybackControls";
import { Button } from "./components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface Panel {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

interface MangaPage {
  id: number;
  panels: Panel[];
}

export default function App() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([1]);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState([1]);

  // Mock manga pages - in a real app, this would be extracted from the uploaded file
  const mockPages: MangaPage[] = [
    {
      id: 1,
      panels: [
        { id: "1", x: 5, y: 5, width: 40, height: 25, text: "In a world where humanity lives behind massive walls to protect themselves from giant humanoid creatures called Titans, young Eren Yeager dreams of exploring the world beyond." },
        { id: "2", x: 52, y: 5, width: 43, height: 25, text: "One day, a colossal Titan appears and breaches the outer wall, allowing smaller Titans to invade the city." },
        { id: "3", x: 5, y: 33, width: 28, height: 15, text: "Mother! No!" },
        { id: "4", x: 36, y: 33, width: 59, height: 30, text: "Eren watches in horror as his mother is devoured by a Titan, vowing to eliminate every last one of them from the face of the Earth." },
        { id: "5", x: 5, y: 51, width: 28, height: 20, text: "I'll kill them all. Every single Titan!" },
        { id: "6", x: 5, y: 73, width: 42, height: 22, text: "Years later, Eren joins the military along with his childhood friends Mikasa and Armin." },
        { id: "7", x: 50, y: 66, width: 45, height: 15, text: "Eren, you need to control your emotions. That's how you'll survive." },
        { id: "8", x: 50, y: 83, width: 45, height: 12, text: "During training, Eren proves to be a fierce and determined soldier." },
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

  // Speech synthesis effect
  useEffect(() => {
    if (!isPlaying || !currentPanel) {
      window.speechSynthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(currentPanel.text);
    utterance.volume = isMuted ? 0 : volume[0];
    utterance.rate = speed[0];

    utterance.onend = () => {
      // Move to next panel or page
      if (currentPanelIndex < currentPage.panels.length - 1) {
        setCurrentPanelIndex((prev) => prev + 1);
      } else if (currentPageIndex < mockPages.length - 1) {
        // Move to next page
        setCurrentPageIndex((prev) => prev + 1);
        setCurrentPanelIndex(0);
      } else {
        // End of manga
        setIsPlaying(false);
      }
    };

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isPlaying, currentPanelIndex, currentPageIndex, currentPanel, volume, isMuted, speed]);

  // Reset panel index when page changes manually
  useEffect(() => {
    setCurrentPanelIndex(0);
  }, [currentPageIndex]);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setCurrentPageIndex(0);
    setCurrentPanelIndex(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

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
    if (currentPageIndex < mockPages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    window.speechSynthesis.cancel();
    setUploadedFile(null);
    setCurrentPageIndex(0);
    setCurrentPanelIndex(0);
    setIsPlaying(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const canGoPreviousPanel = currentPageIndex > 0 || currentPanelIndex > 0;
  const canGoNextPanel = 
    currentPageIndex < mockPages.length - 1 || 
    currentPanelIndex < currentPage?.panels.length - 1;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background px-8 py-5 flex items-center justify-between">
        <div>
          <h1>Manga Reader</h1>
          <p className="text-muted-foreground mt-1">
            {uploadedFile
              ? `${uploadedFile.name} - Page ${currentPageIndex + 1} of ${mockPages.length}`
              : "Upload a manga file to begin reading"}
          </p>
        </div>
        {uploadedFile && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-5 w-5" />
              Upload New File
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {uploadedFile ? (
          <>
            {/* Manga Page Viewer */}
            <div className="flex-1 overflow-hidden">
              <MangaPageViewer
                panels={currentPage.panels}
                currentPanelId={currentPanel?.id || null}
              />
            </div>

            {/* Playback Controls */}
            <PlaybackControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onPrevious={handlePreviousPanel}
              onNext={handleNextPanel}
              canGoPrevious={canGoPreviousPanel}
              canGoNext={canGoNextPanel}
              currentPanel={currentPanelIndex + 1}
              totalPanels={currentPage.panels.length}
              volume={volume}
              onVolumeChange={setVolume}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              speed={speed}
              onSpeedChange={setSpeed}
            />

            {/* Page Navigation */}
            <div className="border-t border-border bg-muted/50 px-6 py-4">
              <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
                <Button
                  size="default"
                  variant="ghost"
                  onClick={handlePreviousPage}
                  disabled={currentPageIndex === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous Page
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPageIndex + 1} of {mockPages.length}
                  </p>
                </div>

                <Button
                  size="default"
                  variant="ghost"
                  onClick={handleNextPage}
                  disabled={currentPageIndex === mockPages.length - 1}
                  className="gap-2"
                >
                  Next Page
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <UploadArea
            onFileUpload={handleFileUpload}
            uploadedFileName={uploadedFile?.name}
          />
        )}
      </div>
    </div>
  );
}
