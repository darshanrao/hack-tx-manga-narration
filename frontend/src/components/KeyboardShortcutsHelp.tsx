import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { key: "Space", action: "Play/Pause reading" },
  { key: "→ or L", action: "Next panel" },
  { key: "← or H", action: "Previous panel" },
  { key: "↑ or K", action: "Previous chapter" },
  { key: "↓ or J", action: "Next chapter" },
  { key: "M", action: "Toggle mute" },
  { key: "+", action: "Increase volume" },
  { key: "-", action: "Decrease volume" },
  { key: "]", action: "Increase reading speed" },
  { key: "[", action: "Decrease reading speed" },
  { key: "?", action: "Show this help dialog" },
  { key: "Esc", action: "Stop reading / Close dialogs" },
  { key: "Tab", action: "Navigate between sections" },
];

export function KeyboardShortcutsHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          aria-label="View keyboard shortcuts"
        >
          <Keyboard className="h-5 w-5" />
          <span>Shortcuts (?)</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground mb-4">
            Use these keyboard shortcuts to navigate and control the manga reader
          </p>
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50"
              >
                <span>{shortcut.action}</span>
                <kbd className="px-3 py-1.5 bg-background border border-border rounded text-sm font-mono">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
