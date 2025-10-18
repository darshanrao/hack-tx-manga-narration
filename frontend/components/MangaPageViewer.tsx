import { useEffect, useRef } from "react";

interface Panel {
  id: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}

interface MangaPageViewerProps {
  pageImageUrl?: string;
  panels: Panel[];
  currentPanelId: string | null;
}

export function MangaPageViewer({
  pageImageUrl,
  panels,
  currentPanelId,
}: MangaPageViewerProps) {
  const currentPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentPanelRef.current) {
      currentPanelRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentPanelId]);

  return (
    <div className="h-full w-full flex items-center justify-center p-2 bg-muted/30">
      <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden manga-page-container">
        {/* Mock manga page background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Grid lines to simulate manga page layout */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="gray"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Manga content placeholder */}
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center space-y-2">
              <div className="text-6xl">📖</div>
              <p>Manga Page Visualization</p>
            </div>
          </div>
        </div>

        {/* Panel overlays */}
        {panels.map((panel) => {
          const isActive = panel.id === currentPanelId;
          
          return (
            <div
              key={panel.id}
              ref={isActive ? currentPanelRef : null}
              className={`absolute transition-all duration-500 ${
                isActive
                  ? "z-20"
                  : "z-10"
              }`}
              style={{
                left: `${panel.x}%`,
                top: `${panel.y}%`,
                width: `${panel.width}%`,
                height: `${panel.height}%`,
              }}
            >
              {/* Panel border and highlight */}
              <div
                className={`absolute inset-0 border-4 rounded transition-all duration-500 ${
                  isActive
                    ? "border-primary bg-primary/20 shadow-2xl scale-105"
                    : "border-border/30 bg-transparent hover:border-primary/50"
                }`}
              />
              
              {/* Active panel indicator */}
              {isActive && (
                <>
                  {/* Animated corner indicators */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr animate-pulse" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl animate-pulse" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br animate-pulse" />
                  
                  {/* Spotlight effect */}
                  <div className="absolute inset-0 bg-gradient-radial from-primary/30 via-primary/10 to-transparent animate-pulse" />
                  
                  {/* Panel number badge */}
                  <div className="absolute -top-3 -left-3 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                    {panel.id}
                  </div>
                </>
              )}
              
              {/* Panel content placeholder */}
              <div className="absolute inset-2 flex items-center justify-center">
                <div
                  className={`text-center transition-opacity duration-300 ${
                    isActive ? "opacity-100" : "opacity-30"
                  }`}
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded px-3 py-1.5 text-sm">
                    Panel {panel.id}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

