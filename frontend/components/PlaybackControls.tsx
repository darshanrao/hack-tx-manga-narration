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
}: PlaybackControlsProps) {
  return (
    <div className="border-t border-white/20 bg-white/80 backdrop-blur-xl p-8 shadow-lg">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6">
          <Button
            size="lg"
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="h-14 w-14 rounded-full bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous panel"
          >
            <SkipBack className="h-6 w-6" />
          </Button>

          <Button
            size="lg"
            onClick={onPlayPause}
            className={`h-20 w-20 rounded-full shadow-xl transition-all duration-200 transform hover:scale-105 ${
              isPlaying 
                ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700" 
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            }`}
            aria-label={isPlaying ? "Pause narration" : "Play narration"}
          >
            {isPlaying ? (
              <Pause className="h-10 w-10 text-white" />
            ) : (
              <Play className="h-10 w-10 text-white ml-1" />
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onNext}
            disabled={!canGoNext}
            className="h-14 w-14 rounded-full bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next panel"
          >
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>

        {/* Panel Progress */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/40 shadow-lg">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
            <p className="text-slate-700 font-semibold">
              Panel {currentPanel} of {totalPanels}
            </p>
          </div>
        </div>

        {/* Volume and Speed Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Volume */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMute}
                className="h-12 w-12 rounded-full bg-white/80 hover:bg-white hover:text-blue-600 transition-all duration-200"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-6 w-6" />
                ) : (
                  <Volume2 className="h-6 w-6" />
                )}
              </Button>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Volume</span>
                  <span className="text-sm font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                    {Math.round(volume[0] * 100)}%
                  </span>
                </div>
                <Slider
                  value={volume}
                  onValueChange={onVolumeChange}
                  max={1}
                  step={0.1}
                  className="cursor-pointer"
                  aria-label="Volume control"
                />
              </div>
            </div>
          </div>

          {/* Speed */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Speed</span>
                  <span className="text-sm font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
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

