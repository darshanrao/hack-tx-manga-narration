import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Play, Pause, Volume2, Rewind, FastForward, ChevronLeft, ChevronRight } from "lucide-react";

interface PDFPlaybackControlsProps {
  currentPage: number;
  totalPages: number;
  // Audio playback props
  isPlaying: boolean;
  onPlayPause: () => void;
  volume: number[];
  onVolumeChange: (value: number[]) => void;
  speed: number[];
  onSpeedChange: (value: number[]) => void;
  // Audio time props
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  // Seek navigation props (for audio seeking)
  onSeekBackward: () => void;
  onSeekForward: () => void;
  // Page navigation props
  onPreviousPage: () => void;
  onNextPage: () => void;
  canGoPreviousPage: boolean;
  canGoNextPage: boolean;
  fullWidth?: boolean;
}

export function PDFPlaybackControls({
  currentPage,
  totalPages,
  isPlaying,
  onPlayPause,
  volume,
  onVolumeChange,
  speed,
  onSpeedChange,
  currentTime,
  duration,
  onSeek,
  onSeekBackward,
  onSeekForward,
  onPreviousPage,
  onNextPage,
  canGoPreviousPage,
  canGoNextPage,
  fullWidth = false,
}: PDFPlaybackControlsProps) {
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className={`${fullWidth ? 'w-full bg-transparent border-0 p-0' : 'bg-slate-900 border-t border-slate-700/50 p-4'}`}>
      <div className={`space-y-4 ${fullWidth ? 'w-full flex flex-col items-center' : 'max-w-4xl mx-auto flex flex-col items-center'}`}>
        
        {/* Progress Bar */}
        <div className={`w-full space-y-2 ${fullWidth ? 'max-w-4xl mx-auto' : ''}`}>
          <Slider
            value={[currentTime]}
            max={duration || 1}
            onValueChange={(value) => onSeek(value[0])}
            className="cursor-pointer"
            disabled={duration === 0}
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Previous Page Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onPreviousPage}
            disabled={!canGoPreviousPage}
            className="gap-2 bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200"
            title="Previous page"
          >
            Previous Page
          </Button>

          {/* Seek Backward Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onSeekBackward}
            className="h-10 w-10 rounded-full bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg text-slate-200"
            title="Seek backward 5 seconds"
          >
            <Rewind className="h-4 w-4" />
          </Button>

          {/* Play/Pause Button */}
          <Button
            size="lg"
            onClick={onPlayPause}
            className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/30 transition-all duration-200"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          {/* Seek Forward Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onSeekForward}
            className="h-10 w-10 rounded-full bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg text-slate-200"
            title="Seek forward 5 seconds"
          >
            <FastForward className="h-4 w-4" />
          </Button>

          {/* Next Page Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onNextPage}
            disabled={!canGoNextPage}
            className="gap-2 bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200"
            title="Next page"
          >
            Next Page
          </Button>
        </div>

        {/* Page Indicator */}
        <div className="text-center">
          <p className="text-slate-300 font-semibold text-sm">
            Page {currentPage} of {totalPages}
          </p>
        </div>

        {/* Volume and Speed Controls */}
        <div className={`flex gap-6 ${fullWidth ? 'w-full max-w-4xl mx-auto' : 'w-full'}`}>
          {/* Volume */}
          <div className={`${fullWidth ? 'bg-transparent' : 'bg-slate-800/95'} rounded-xl p-3 border border-slate-600/60 shadow-lg flex-1`}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-700/80 flex items-center justify-center">
                <Volume2 className="h-4 w-4 text-slate-300" />
              </div>
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
                  step={0.01}
                  className="cursor-pointer"
                  aria-label="Volume control"
                />
              </div>
            </div>
          </div>

          {/* Speed */}
          <div className={`${fullWidth ? 'bg-transparent' : 'bg-slate-800/95'} rounded-xl p-3 border border-slate-600/60 shadow-lg flex-1`}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">⚡</span>
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
                  className="cursor-pointer"
                  aria-label="Speed control"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
