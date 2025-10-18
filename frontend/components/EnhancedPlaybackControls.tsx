'use client'

import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

interface EnhancedPlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentPanel: number;
  totalPanels: number;
  currentTime: number;
  duration: number;
  volume: number[];
  onVolumeChange: (value: number[]) => void;
  speed: number[];
  onSpeedChange: (value: number[]) => void;
  onSeek: (time: number) => void;
  fullWidth?: boolean;
}

export function EnhancedPlaybackControls({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  currentPanel,
  totalPanels,
  currentTime,
  duration,
  volume,
  onVolumeChange,
  speed,
  onSpeedChange,
  onSeek,
  fullWidth = false,
}: EnhancedPlaybackControlsProps) {
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
          <Button
            size="sm"
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="h-12 w-12 rounded-full glass-dark hover:glass-dark-intense border-slate-500/60 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 hover:shadow-glow btn-modern"
            title="Previous panel"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

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

          <Button
            size="sm"
            variant="outline"
            onClick={onNext}
            disabled={!canGoNext}
            className="h-12 w-12 rounded-full glass-dark hover:glass-dark-intense border-slate-500/60 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 hover:shadow-glow btn-modern"
            title="Next panel"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Enhanced Panel Progress */}
        <div className="text-center">
          <div className="glass-dark rounded-2xl px-6 py-3 shadow-xl border border-slate-600/40">
            <span className="text-lg font-bold text-slate-200">
              Panel <span className="text-blue-400">{currentPanel}</span> of <span className="text-purple-400">{totalPanels}</span>
            </span>
          </div>
        </div>

        {/* Enhanced Volume and Speed Controls */}
        <div className="flex gap-8 w-full">
          {/* Enhanced Volume */}
          <div className={`${fullWidth ? 'bg-transparent' : 'glass-dark'} rounded-2xl p-4 border border-slate-600/60 shadow-xl flex-1`}>
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

          {/* Enhanced Speed */}
          <div className={`${fullWidth ? 'bg-transparent' : 'glass-dark'} rounded-2xl p-4 border border-slate-600/60 shadow-xl flex-1`}>
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
