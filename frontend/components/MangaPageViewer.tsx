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
    <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900">
      <div className="relative bg-slate-800/90 backdrop-blur-sm shadow-2xl overflow-hidden manga-page-container h-full w-full border border-slate-600/40">
        {/* Mock manga page background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full">
              <defs>
                <pattern
                  id="manga-pattern-dark"
                  width="60"
                  height="60"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="30" cy="30" r="1" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#manga-pattern-dark)" />
            </svg>
          </div>

            {/* Manga content placeholder */}
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <div className="text-center space-y-4">
                <div className="text-8xl drop-shadow-lg">📖</div>
                <p className="text-lg font-medium">Manga Page Visualization</p>
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
              className={`absolute transition-all duration-700 ease-out ${
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
                className={`absolute inset-0 border-4 rounded-2xl transition-all duration-700 ease-out ${
                  isActive
                    ? "border-blue-400 bg-gradient-to-br from-blue-900/40 to-purple-900/30 shadow-2xl shadow-blue-500/40 scale-105 backdrop-blur-sm"
                    : "border-slate-600/40 bg-slate-800/20 hover:border-blue-500/60 hover:bg-slate-700/40 hover:shadow-lg hover:shadow-blue-500/20"
                }`}
              />
              
              {/* Active panel effects */}
              {isActive && (
                <>
                  {/* Animated corner indicators */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg animate-pulse" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg animate-pulse" />
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg animate-pulse" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg animate-pulse" />
                  
                  {/* Spotlight effect */}
                  <div className="absolute inset-0 bg-gradient-radial from-blue-400/20 via-blue-300/10 to-transparent animate-pulse rounded-2xl" />
                  
                  {/* Panel number badge */}
                  <div className="absolute -top-4 -left-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-xl font-bold text-sm">
                    {panel.id}
                  </div>
                  
                  {/* Reading indicator */}
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1 bg-slate-800/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg border border-slate-700">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-semibold text-slate-300">Reading</span>
                    </div>
                  </div>
                </>
              )}
              
              {/* Panel content placeholder */}
              <div className="absolute inset-3 flex items-center justify-center">
                <div
                  className={`text-center transition-all duration-500 ${
                    isActive ? "opacity-100 scale-100" : "opacity-40 scale-95"
                  }`}
                >
                  <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-semibold shadow-lg border border-slate-700/40 text-slate-300">
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

