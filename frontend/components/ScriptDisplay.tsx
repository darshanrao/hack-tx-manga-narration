import { useEffect, useRef } from "react";
import { ScrollArea } from "./ui/scroll-area";

interface ScriptLine {
  id: string;
  speaker?: string;
  text: string;
  timestamp: number;
  isActive: boolean;
}

interface ScriptDisplayProps {
  lines: ScriptLine[];
  currentLineId: string | null;
}

export function ScriptDisplay({ lines, currentLineId }: ScriptDisplayProps) {
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLineId]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-6 border-b border-border">
        <h2>Narration Script</h2>
        <p className="text-muted-foreground mt-1">
          Live transcript of the audio narration
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {lines.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Upload a file to begin narration</p>
            </div>
          ) : (
            lines.map((line) => (
              <div
                key={line.id}
                ref={line.id === currentLineId ? activeLineRef : null}
                className={`p-4 rounded-lg transition-all duration-300 ${
                  line.id === currentLineId
                    ? "bg-primary/10 border-l-4 border-primary shadow-md scale-105"
                    : line.isActive
                    ? "bg-muted/50"
                    : "bg-transparent opacity-60"
                }`}
              >
                {line.speaker && (
                  <div className="text-sm text-primary mb-2">
                    {line.speaker}
                  </div>
                )}
                <p className="leading-relaxed">{line.text}</p>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(line.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

