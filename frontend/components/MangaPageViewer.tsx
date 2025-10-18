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
    <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 relative overflow-hidden">
      {/* Enhanced Background with Animated Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 via-slate-700/80 to-slate-900/90 backdrop-blur-sm">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="cyber-grid w-full h-full animate-pulse"></div>
        </div>
        
        {/* Floating Particles Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-float"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400/40 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-blue-300/20 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Manga Content Placeholder with Enhanced Design */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-6 animate-fadeInUp">
            <div className="relative">
              <div className="text-9xl drop-shadow-2xl animate-bounceIn">📖</div>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-slate-200">Manga Page Visualization</p>
              <p className="text-sm text-slate-400">Interactive panel navigation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Panel Overlays */}
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
            {/* Enhanced Panel Border and Highlight */}
            <div
              className={`absolute inset-0 border-4 rounded-3xl transition-all duration-700 ease-out ${
                isActive
                  ? "border-blue-400/80 bg-gradient-to-br from-blue-900/50 to-purple-900/40 shadow-2xl shadow-blue-500/50 scale-105 backdrop-blur-sm neon-border"
                  : "border-slate-600/30 bg-slate-800/10 hover:border-blue-500/70 hover:bg-slate-700/30 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-102"
              }`}
            />
            
            {/* Active Panel Enhanced Effects */}
            {isActive && (
              <>
                {/* Animated Corner Indicators with Glow */}
                <div className="absolute -top-3 -left-3 w-10 h-10 border-t-4 border-l-4 border-blue-400 rounded-tl-xl animate-glow shadow-lg shadow-blue-400/50" />
                <div className="absolute -top-3 -right-3 w-10 h-10 border-t-4 border-r-4 border-blue-400 rounded-tr-xl animate-glow shadow-lg shadow-blue-400/50" />
                <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-4 border-l-4 border-blue-400 rounded-bl-xl animate-glow shadow-lg shadow-blue-400/50" />
                <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-4 border-r-4 border-blue-400 rounded-br-xl animate-glow shadow-lg shadow-blue-400/50" />
                
                {/* Enhanced Spotlight Effect */}
                <div className="absolute inset-0 bg-gradient-radial from-blue-400/30 via-blue-300/15 to-transparent animate-pulse rounded-3xl" />
                
                {/* Enhanced Panel Number Badge */}
                <div className="absolute -top-5 -left-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-2xl font-bold text-sm animate-bounceIn neon-glow">
                  {panel.id}
                </div>
                
                {/* Enhanced Reading Indicator */}
                <div className="absolute top-3 right-3">
                  <div className="flex items-center gap-2 glass-dark rounded-full px-3 py-1.5 shadow-xl border border-slate-600/50">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                    <span className="text-xs font-semibold text-slate-200">Reading</span>
                  </div>
                </div>
                
                {/* Pulse Ring Effect */}
                <div className="absolute inset-0 border-2 border-blue-400/60 rounded-3xl animate-ping"></div>
                <div className="absolute inset-0 border-2 border-blue-400/40 rounded-3xl animate-ping" style={{animationDelay: '0.5s'}}></div>
              </>
            )}
            
            {/* Enhanced Panel Content Placeholder */}
            <div className="absolute inset-4 flex items-center justify-center">
              <div
                className={`text-center transition-all duration-500 ${
                  isActive ? "opacity-100 scale-100" : "opacity-30 scale-95"
                }`}
              >
                <div className="glass-dark rounded-2xl px-6 py-3 text-sm font-semibold shadow-xl border border-slate-600/40 text-slate-200 hover:scale-105 transition-transform duration-200">
                  Panel {panel.id}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

