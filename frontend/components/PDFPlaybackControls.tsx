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
    <div className="border-t border-white/20 bg-white/80 backdrop-blur-xl px-8 py-6 shadow-lg">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Page Navigation */}
          <div className="flex items-center gap-6">
            <Button
              size="lg"
              variant="outline"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="gap-3 bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipBack className="h-5 w-5" />
              Previous Page
            </Button>

            <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/40 shadow-lg min-w-fit whitespace-nowrap">
              <p className="text-lg font-bold text-slate-700">
                Page {currentPage} of {totalPages}
              </p>
            </div>

            <Button
              size="lg"
              variant="outline"
              onClick={onNext}
              disabled={!canGoNext}
              className="gap-3 bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Page
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Audio Controls */}
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Playback Controls */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={onPrevious}
                disabled={!canGoPrevious}
                className="h-12 w-12 rounded-full bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                size="lg"
                onClick={onPlayPause}
                className={`h-16 w-16 rounded-full shadow-xl transition-all duration-200 transform hover:scale-105 ${
                  isPlaying 
                    ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700" 
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                }`}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8 text-white" />
                ) : (
                  <Play className="h-8 w-8 text-white ml-1" />
                )}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={onNext}
                disabled={!canGoNext}
                className="h-12 w-12 rounded-full bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Audio Progress Bar */}
            <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/40 shadow-lg">
              <span className="text-sm font-semibold text-slate-600">0:00</span>
              <div className="w-32">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 shadow-sm"
                    style={{
                      width: `${(currentPage / totalPages) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-600">2:10</span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/40 shadow-lg">
              <Volume2 className="h-6 w-6 text-slate-600" />
              <div className="w-24">
                <Slider
                  value={volume}
                  onValueChange={onVolumeChange}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <span className="text-sm font-bold text-slate-600 w-8 text-center">
                {Math.round(volume[0] * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
