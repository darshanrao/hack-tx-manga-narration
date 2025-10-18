import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Slider } from "./ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";

interface Panel {
  id: string;
  imageUrl: string;
  text: string;
  order: number;
}

interface AudioReaderProps {
  panels: Panel[];
  chapterTitle?: string;
  onPreviousChapter?: () => void;
  onNextChapter?: () => void;
  audioFeedback?: boolean;
}

export function AudioReader({ panels, chapterTitle, onPreviousChapter, onNextChapter, audioFeedback = false }: AudioReaderProps) {
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([1]);
  const [rate, setRate] = useState([1]);
  const [announcement, setAnnouncement] = useState("");
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Stop speech when component unmounts or panels change
    setCurrentPanelIndex(0);
    setIsPlaying(false);
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [panels]);

  const playFeedbackSound = (frequency: number, duration: number) => {
    if (!audioFeedback) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, duration);
  };

  const announce = (message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(""), 100);
  };

  useEffect(() => {
    // Scroll to current panel
    if (panelRefs.current[currentPanelIndex]) {
      panelRefs.current[currentPanelIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentPanelIndex]);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = isMuted ? 0 : volume[0];
    utterance.rate = rate[0];
    
    utterance.onend = () => {
      if (currentPanelIndex < panels.length - 1 && isPlaying) {
        setCurrentPanelIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isPlaying && panels[currentPanelIndex]) {
      speak(panels[currentPanelIndex].text);
    } else {
      window.speechSynthesis.cancel();
    }
  }, [isPlaying, currentPanelIndex]);

  const handlePlayPause = () => {
    if (panels.length === 0) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      announce("Paused");
      playFeedbackSound(400, 100);
    } else {
      setIsPlaying(true);
      announce("Playing");
      playFeedbackSound(600, 100);
    }
  };

  const handlePrevious = () => {
    if (currentPanelIndex > 0) {
      window.speechSynthesis.cancel();
      setCurrentPanelIndex((prev) => prev - 1);
      announce(`Panel ${currentPanelIndex}`);
      playFeedbackSound(500, 50);
    }
  };

  const handleNext = () => {
    if (currentPanelIndex < panels.length - 1) {
      window.speechSynthesis.cancel();
      setCurrentPanelIndex((prev) => prev + 1);
      announce(`Panel ${currentPanelIndex + 2}`);
      playFeedbackSound(500, 50);
    }
  };

  const handlePanelClick = (index: number) => {
    window.speechSynthesis.cancel();
    setCurrentPanelIndex(index);
    setIsPlaying(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    announce(isMuted ? "Unmuted" : "Muted");
    playFeedbackSound(isMuted ? 700 : 300, 100);
  };

  const adjustVolume = (delta: number) => {
    setVolume(([current]) => {
      const newVolume = Math.max(0, Math.min(1, current + delta));
      announce(`Volume ${Math.round(newVolume * 100)}%`);
      return [newVolume];
    });
  };

  const adjustSpeed = (delta: number) => {
    setRate(([current]) => {
      const newRate = Math.max(0.5, Math.min(2, current + delta));
      announce(`Speed ${newRate.toFixed(1)}x`);
      return [newRate];
    });
  };

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Don't intercept if user is in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          handlePlayPause();
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          handleNext();
          break;
        case "arrowleft":
        case "h":
          e.preventDefault();
          handlePrevious();
          break;
        case "arrowup":
        case "k":
          e.preventDefault();
          onPreviousChapter?.();
          break;
        case "arrowdown":
        case "j":
          e.preventDefault();
          onNextChapter?.();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "+":
        case "=":
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case "-":
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case "]":
          e.preventDefault();
          adjustSpeed(0.1);
          break;
        case "[":
          e.preventDefault();
          adjustSpeed(-0.1);
          break;
        case "escape":
          e.preventDefault();
          if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            announce("Stopped");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [currentPanelIndex, isPlaying, panels.length]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <div className="p-6 border-b-4 border-border">
        <h2>Audio Reader</h2>
        {chapterTitle && (
          <p className="text-muted-foreground mt-2">{chapterTitle}</p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6" role="region" aria-label="Manga panels">
          {panels.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Play className="mx-auto h-20 w-20 mb-4 opacity-50" />
              <p>No panels to read</p>
              <p className="mt-2">
                Select a chapter to begin
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {panels.map((panel, index) => (
                <div
                  key={panel.id}
                  ref={(el) => (panelRefs.current[index] = el)}
                  className={`border-4 rounded-lg overflow-hidden transition-all cursor-pointer focus:outline-none ${
                    index === currentPanelIndex
                      ? "border-primary ring-8 ring-primary/30 scale-[1.02] shadow-2xl"
                      : "border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/20"
                  }`}
                  onClick={() => handlePanelClick(index)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Panel ${index + 1} of ${panels.length}: ${panel.text}`}
                  aria-current={index === currentPanelIndex ? "true" : "false"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handlePanelClick(index);
                    }
                  }}
                >
                  <div className="bg-muted aspect-video flex items-center justify-center relative">
                    {panel.imageUrl ? (
                      <img
                        src={panel.imageUrl}
                        alt={`Panel ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-muted-foreground">
                        Panel {index + 1}
                      </div>
                    )}
                    {index === currentPanelIndex && (
                      <div className="absolute inset-0 border-8 border-primary pointer-events-none animate-pulse" />
                    )}
                  </div>
                  <div className="p-5 bg-card">
                    <p>
                      <span className="text-muted-foreground">Panel {index + 1}: </span>
                      {panel.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {panels.length > 0 && (
        <div className="p-6 border-t-4 border-border space-y-6" role="region" aria-label="Playback controls">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevious}
              disabled={currentPanelIndex === 0}
              className="h-14 w-14 focus:ring-4 focus:ring-primary/50"
              aria-label="Previous panel. Keyboard shortcut: Left arrow or H"
            >
              <SkipBack className="h-6 w-6" />
            </Button>
            <Button
              size="lg"
              onClick={handlePlayPause}
              className="h-20 w-20 focus:ring-4 focus:ring-primary/50"
              aria-label={isPlaying ? "Pause reading. Keyboard shortcut: Space" : "Play and read panels aloud. Keyboard shortcut: Space"}
            >
              {isPlaying ? (
                <Pause className="h-10 w-10" />
              ) : (
                <Play className="h-10 w-10" />
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleNext}
              disabled={currentPanelIndex === panels.length - 1}
              className="h-14 w-14 focus:ring-4 focus:ring-primary/50"
              aria-label="Next panel. Keyboard shortcut: Right arrow or L"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>

          <div className="text-center" aria-live="polite" aria-atomic="true">
            <span>Panel {currentPanelIndex + 1} of {panels.length}</span>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleMute}
                className="h-12 w-12 flex-shrink-0 focus:ring-4 focus:ring-primary/50"
                aria-label={isMuted ? "Unmute. Keyboard shortcut: M" : "Mute. Keyboard shortcut: M"}
              >
                {isMuted ? (
                  <VolumeX className="h-6 w-6" />
                ) : (
                  <Volume2 className="h-6 w-6" />
                )}
              </Button>
              <div className="flex-1">
                <label htmlFor="volume-slider" className="sr-only">
                  Volume. Use plus and minus keys to adjust.
                </label>
                <Slider
                  id="volume-slider"
                  value={volume}
                  onValueChange={setVolume}
                  max={1}
                  step={0.1}
                  className="cursor-pointer h-3"
                  aria-label="Volume control"
                />
              </div>
              <span className="w-16 text-right flex-shrink-0" aria-live="polite">
                {Math.round(volume[0] * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="w-20 flex-shrink-0">Speed</span>
              <div className="flex-1">
                <label htmlFor="rate-slider" className="sr-only">
                  Reading speed. Use left and right bracket keys to adjust.
                </label>
                <Slider
                  id="rate-slider"
                  value={rate}
                  onValueChange={setRate}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="cursor-pointer h-3"
                  aria-label="Reading speed control"
                />
              </div>
              <span className="w-16 text-right flex-shrink-0" aria-live="polite">
                {rate[0].toFixed(1)}x
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
