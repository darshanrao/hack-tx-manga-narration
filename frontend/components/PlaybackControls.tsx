import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentPanel: number;
  totalPanels: number;
  volume: number[];
  onVolumeChange: (value: number[]) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  speed: number[];
  onSpeedChange: (value: number[]) => void;
  fullWidth?: boolean;
}

export function PlaybackControls({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  currentPanel,
  totalPanels,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  speed,
  onSpeedChange,
  fullWidth = false,
}: PlaybackControlsProps) {
  return (
    <div className={`${fullWidth ? 'w-full bg-transparent border-0 p-0' : 'bg-slate-900 border-t border-slate-700/50 p-4'}`}>
      <div className={`space-y-4 ${fullWidth ? 'w-full flex flex-col items-center' : 'max-w-4xl mx-auto flex flex-col items-center'}`}>
        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="h-10 w-10 rounded-full bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200"
            aria-label="Previous panel"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            onClick={onPlayPause}
            className={`h-12 w-12 rounded-full shadow-xl transition-all duration-200 transform hover:scale-105 ${
              isPlaying 
                ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700" 
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            }`}
            aria-label={isPlaying ? "Pause narration" : "Play narration"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 text-white" />
            ) : (
              <Play className="h-6 w-6 text-white ml-0.5" />
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onNext}
            disabled={!canGoNext}
            className="h-10 w-10 rounded-full bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200"
            aria-label="Next panel"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Panel Progress */}
        <div className="text-center w-full">
           <div className={`${fullWidth ? 'bg-transparent' : 'bg-slate-800/95'} inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-600/60 shadow-lg w-full justify-center`}>
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
            <p className="text-slate-300 font-semibold text-sm">
              Panel {currentPanel} of {totalPanels}
            </p>
          </div>
        </div>

        {/* Volume and Speed Controls - Compact */}
        <div className="flex gap-6 w-full">
           {/* Volume */}
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

