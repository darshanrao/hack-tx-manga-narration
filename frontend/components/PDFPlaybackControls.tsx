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
    <div className={`${fullWidth ? 'w-full bg-transparent border-0 p-0' : 'bg-transparent border-0 p-6'}`}>
      <div className={`space-y-6 ${fullWidth ? 'w-full flex flex-col items-center' : 'max-w-4xl mx-auto flex flex-col items-center'}`}>
        
        {/* Enhanced Progress Bar */}
        <div className={`w-full space-y-3 ${fullWidth ? 'max-w-4xl mx-auto' : ''}`}>
          <div className="relative">
            <Slider
              value={[currentTime]}
              max={duration || 1}
              onValueChange={(value) => onSeek(value[0])}
              className="cursor-pointer h-2"
              disabled={duration === 0}
            />
            {/* Progress bar glow effect */}
            <div className="absolute inset-0 h-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-sm"></div>
          </div>
          <div className="flex justify-between text-sm text-slate-300 font-mono">
            <span className="bg-slate-800/50 px-2 py-1 rounded-full">{formatTime(currentTime)}</span>
            <span className="bg-slate-800/50 px-2 py-1 rounded-full">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Enhanced Main Controls */}
        <div className="flex items-center justify-center gap-6">
          {/* Enhanced Previous Page Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onPreviousPage}
            disabled={!canGoPreviousPage}
            className="gap-2 glass-dark hover:glass-dark-intense border-slate-500/60 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 hover:shadow-glow btn-modern"
            title="Previous page"
          >
            Previous Page
          </Button>

          {/* Enhanced Seek Backward Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onSeekBackward}
            className="h-12 w-12 rounded-full glass-dark hover:glass-dark-intense border-slate-500/60 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-300 shadow-lg text-slate-200 hover:shadow-glow btn-modern"
            title="Seek backward 5 seconds"
          >
            <Rewind className="h-5 w-5" />
          </Button>

          {/* Enhanced Play/Pause Button */}
          <Button
            size="lg"
            onClick={onPlayPause}
            className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-2xl shadow-blue-500/40 transition-all duration-300 hover:scale-110 hover:shadow-glow-lg btn-modern"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>

          {/* Enhanced Seek Forward Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onSeekForward}
            className="h-12 w-12 rounded-full glass-dark hover:glass-dark-intense border-slate-500/60 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-300 shadow-lg text-slate-200 hover:shadow-glow btn-modern"
            title="Seek forward 5 seconds"
          >
            <FastForward className="h-5 w-5" />
          </Button>

          {/* Enhanced Next Page Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onNextPage}
            disabled={!canGoNextPage}
            className="gap-2 glass-dark hover:glass-dark-intense border-slate-500/60 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 hover:shadow-glow btn-modern"
            title="Next page"
          >
            Next Page
          </Button>
        </div>

        {/* Enhanced Page Indicator with Volume and Speed Controls */}
        <div className={`flex items-center gap-6 ${fullWidth ? 'w-full max-w-4xl mx-auto' : 'w-full'}`}>
          {/* Volume Control */}
          <div className="glass-dark rounded-2xl p-4 border border-slate-600/60 shadow-xl flex-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Volume2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-200">Volume</span>
                  <span className="text-sm font-bold text-blue-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-600/40">
                    {Math.round(volume[0] * 100)}%
                  </span>
                </div>
                <Slider
                  value={volume}
                  onValueChange={onVolumeChange}
                  max={1}
                  step={0.01}
                  className="cursor-pointer h-2"
                  aria-label="Volume control"
                />
              </div>
            </div>
          </div>

          {/* Page Indicator - Center */}
          <div className="glass-dark rounded-2xl px-6 py-3 shadow-xl border border-slate-600/40">
            <p className="text-lg font-bold text-slate-200">
              Page <span className="text-blue-400">{currentPage}</span> of <span className="text-purple-400">{totalPages}</span>
            </p>
          </div>

          {/* Speed Control */}
          <div className="glass-dark rounded-2xl p-4 border border-slate-600/60 shadow-xl flex-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">⚡</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-200">Speed</span>
                  <span className="text-sm font-bold text-green-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-600/40">
                    {speed[0].toFixed(1)}x
                  </span>
                </div>
                <Slider
                  value={speed}
                  onValueChange={onSpeedChange}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="cursor-pointer h-2"
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
