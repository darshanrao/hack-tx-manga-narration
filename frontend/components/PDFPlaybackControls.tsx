import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Play, Pause, Volume2, SkipBack, SkipForward } from "lucide-react";

interface PDFPlaybackControlsProps {
  currentPage: number;
  totalPages: number;
  // Audio playback props
  isPlaying: boolean;
  onPlayPause: () => void;
  volume: number[];
  onVolumeChange: (value: number[]) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  speed: number[];
  onSpeedChange: (value: number[]) => void;
  // Navigation props for fast forward/rewind
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function PDFPlaybackControls({
  currentPage,
  totalPages,
  isPlaying,
  onPlayPause,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  speed,
  onSpeedChange,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: PDFPlaybackControlsProps) {
  return (
    <div className="border-t border-border bg-slate-900 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-6">
          {/* Page Navigation */}
          <div className="flex items-center gap-4">
            <Button
              size="default"
              variant="ghost"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="gap-2 text-white hover:bg-gray-700"
            >
              <SkipBack className="h-4 w-4" />
              Previous Page
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-300">
                Page {currentPage} of {totalPages}
              </p>
            </div>

            <Button
              size="default"
              variant="ghost"
              onClick={onNext}
              disabled={!canGoNext}
              className="gap-2 text-white hover:bg-gray-700"
            >
              Next Page
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-6">
            {/* Audio Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300">0:00</span>
              <div className="w-24">
                <div className="w-full bg-gray-600 rounded-full h-1">
                  <div
                    className="bg-white h-1 rounded-full transition-all duration-300"
                    style={{
                      width: `${(currentPage / totalPages) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-300">2:10</span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                disabled={!canGoPrevious}
                className="text-white hover:bg-gray-700 p-2"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={onPlayPause}
                className="w-10 h-10 rounded-full p-0 bg-white text-black hover:bg-gray-200"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onNext}
                disabled={!canGoNext}
                className="text-white hover:bg-gray-700 p-2"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-gray-300" />
              <div className="w-16">
                <Slider
                  value={volume}
                  onValueChange={onVolumeChange}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <span className="text-xs text-gray-300 w-6">
                {Math.round(volume[0] * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
