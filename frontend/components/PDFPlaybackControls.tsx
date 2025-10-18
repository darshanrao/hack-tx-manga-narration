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
  fullWidth?: boolean;
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
  fullWidth = false,
}: PDFPlaybackControlsProps) {
  return (
    <div className={`${fullWidth ? 'w-full bg-transparent border-0 p-0' : 'bg-slate-900 border-t border-slate-700/50 px-4 py-4'}`}>
      <div className={`space-y-4 ${fullWidth ? 'w-full flex flex-col items-center' : 'max-w-4xl mx-auto flex flex-col items-center'}`}>
        {/* Page Navigation */}
        <div className={`flex items-center justify-center gap-3 ${fullWidth ? 'w-full max-w-md' : ''}`}>
          <Button
            size="sm"
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="gap-2 bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200"
          >
            <SkipBack className="h-4 w-4" />
            Previous
          </Button>

           <div className={`${fullWidth ? 'bg-transparent' : 'bg-slate-800/95'} text-center rounded-xl px-4 py-2 border border-slate-600/60 shadow-lg min-w-fit whitespace-nowrap`}>
            <p className="text-slate-300 font-bold text-sm">
              Page {currentPage} of {totalPages}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onNext}
            disabled={!canGoNext}
            className="gap-2 bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200"
          >
            Next
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Playback Controls */}
        <div className={`flex items-center justify-center gap-3 ${fullWidth ? 'w-full max-w-md' : ''}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="h-8 w-8 rounded-full bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            onClick={onPlayPause}
            className={`h-10 w-10 rounded-full shadow-xl transition-all duration-200 transform hover:scale-105 ${
              isPlaying 
                ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700" 
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            }`}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white" />
            ) : (
              <Play className="h-5 w-5 text-white ml-0.5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!canGoNext}
            className="h-8 w-8 rounded-full bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Audio Progress Bar */}
         <div className={`${fullWidth ? 'bg-transparent' : 'bg-slate-800/95'} flex items-center justify-center gap-3 rounded-xl px-4 py-3 border border-slate-600/60 shadow-lg w-full`}>
          <span className="text-xs font-semibold text-slate-400">0:00</span>
          <div className="flex-1">
            <div className="w-full bg-slate-900/90 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-blue-400 to-purple-500 h-1.5 rounded-full transition-all duration-300 shadow-sm"
                style={{
                  width: `${(currentPage / totalPages) * 100}%`,
                }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400">2:10</span>
        </div>

        {/* Volume and Speed Controls - Compact */}
        <div className="flex gap-6 w-full">
           {/* Volume Control */}
           <div className={`${fullWidth ? 'bg-transparent' : 'bg-slate-800/95'} rounded-xl p-3 border border-slate-600/60 shadow-lg flex-1`}>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMute}
                className="h-8 w-8 rounded-full bg-slate-700/80 hover:bg-slate-600 hover:text-blue-400 transition-all duration-200"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Volume</span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded-full">
                    {Math.round(volume[0] * 100)}%
                  </span>
                </div>
                <Slider
                  value={volume}
                  onValueChange={onVolumeChange}
                  max={1}
                  min={0}
                  step={0.01}
                  className="cursor-pointer"
                  aria-label="Volume control"
                />
              </div>
            </div>
          </div>

           {/* Speed Control */}
           <div className={`${fullWidth ? 'bg-transparent' : 'bg-slate-800/95'} rounded-xl p-3 border border-slate-600/60 shadow-lg flex-1`}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">⚡</span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Speed</span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded-full">
                    {speed[0].toFixed(1)}x
                  </span>
                </div>
                <Slider
                  value={speed}
                  onValueChange={onSpeedChange}
                  min={0.5}
                  max={2}
                  step={0.1}
                  speedControl={true}
                  className="cursor-pointer"
                  aria-label="Reading speed control"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
