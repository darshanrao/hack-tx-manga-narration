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
    <div className="border-t border-slate-700/50 bg-slate-900/90 backdrop-blur-xl px-8 py-6 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Page Navigation */}
          <div className="flex items-center gap-6">
            <Button
              size="lg"
              variant="outline"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="gap-3 bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200"
            >
              <SkipBack className="h-5 w-5" />
              Previous Page
            </Button>

            <div className="text-center bg-slate-800/60 backdrop-blur-sm rounded-2xl px-6 py-3 border border-slate-700/40 shadow-lg min-w-fit whitespace-nowrap">
              <p className="text-lg font-bold text-slate-300">
                Page {currentPage} of {totalPages}
              </p>
            </div>

            <Button
              size="lg"
              variant="outline"
              onClick={onNext}
              disabled={!canGoNext}
              className="gap-3 bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200"
            >
              Next Page
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Audio Controls */}
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Playback Controls */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={onPrevious}
                disabled={!canGoPrevious}
                className="h-12 w-12 rounded-full bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200"
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
                className="h-12 w-12 rounded-full bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Audio Progress Bar */}
            <div className="flex items-center gap-4 bg-slate-800/60 backdrop-blur-sm rounded-2xl px-6 py-4 border border-slate-700/40 shadow-lg">
              <span className="text-sm font-semibold text-slate-400">0:00</span>
              <div className="w-32">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300 shadow-sm"
                    style={{
                      width: `${(currentPage / totalPages) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-400">2:10</span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-4 bg-slate-800/60 backdrop-blur-sm rounded-2xl px-6 py-4 border border-slate-700/40 shadow-lg">
              <Volume2 className="h-6 w-6 text-slate-400" />
              <div className="w-24">
                <Slider
                  value={volume}
                  onValueChange={onVolumeChange}
                  max={1}
                  min={0}
                  step={0.01}
                  className="w-full"
                />
              </div>
              <span className="text-sm font-bold text-slate-400 w-8 text-center">
                {Math.round(volume[0] * 100)}%
              </span>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-4 bg-slate-800/60 backdrop-blur-sm rounded-2xl px-6 py-4 border border-slate-700/40 shadow-lg">
              <div className="h-6 w-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">⚡</span>
              </div>
              <div className="w-24">
                <Slider
                  value={speed}
                  onValueChange={onSpeedChange}
                  min={0.5}
                  max={2}
                  step={0.1}
                  speedControl={true}
                  className="w-full"
                />
              </div>
              <span className="text-sm font-bold text-slate-400 w-8 text-center">
                {speed[0].toFixed(1)}x
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
