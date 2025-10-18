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
    <div className="border-t border-border bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="h-12 w-12"
            aria-label="Previous panel"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            size="lg"
            onClick={onPlayPause}
            className="h-16 w-16"
            aria-label={isPlaying ? "Pause narration" : "Play narration"}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8" />
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onNext}
            disabled={!canGoNext}
            className="h-12 w-12"
            aria-label="Next panel"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Panel Progress */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Panel {currentPanel} of {totalPanels}
          </p>
        </div>

        {/* Volume and Speed Controls */}
        <div className="grid grid-cols-2 gap-6">
          {/* Volume */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <div className="flex-1">
              <Slider
                value={volume}
                onValueChange={onVolumeChange}
                max={1}
                step={0.1}
                className="cursor-pointer"
                aria-label="Volume control"
              />
            </div>
            <span className="text-sm text-muted-foreground w-12 text-right">
              {Math.round(volume[0] * 100)}%
            </span>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-16">Speed</span>
            <div className="flex-1">
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
            <span className="text-sm text-muted-foreground w-12 text-right">
              {speed[0].toFixed(1)}x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

