import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Settings } from "lucide-react";

interface AccessibilitySettingsProps {
  textSize: number;
  onTextSizeChange: (size: number) => void;
  highContrast: boolean;
  onHighContrastChange: (enabled: boolean) => void;
  audioFeedback: boolean;
  onAudioFeedbackChange: (enabled: boolean) => void;
}

export function AccessibilitySettings({
  textSize,
  onTextSizeChange,
  highContrast,
  onHighContrastChange,
  audioFeedback,
  onAudioFeedbackChange,
}: AccessibilitySettingsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          aria-label="Open accessibility settings"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Accessibility Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label htmlFor="text-size">
              Text Size: {textSize}px
            </Label>
            <Slider
              id="text-size"
              value={[textSize]}
              onValueChange={(value) => onTextSizeChange(value[0])}
              min={14}
              max={24}
              step={1}
              className="cursor-pointer"
              aria-label="Adjust text size"
            />
            <p className="text-sm text-muted-foreground">
              Adjust the base text size throughout the application
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="high-contrast">
                High Contrast Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={onHighContrastChange}
              aria-label="Toggle high contrast mode"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="audio-feedback">
                Audio Feedback
              </Label>
              <p className="text-sm text-muted-foreground">
                Play sounds when performing actions
              </p>
            </div>
            <Switch
              id="audio-feedback"
              checked={audioFeedback}
              onCheckedChange={onAudioFeedbackChange}
              aria-label="Toggle audio feedback"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

