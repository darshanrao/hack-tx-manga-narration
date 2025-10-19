'use client'

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TranscriptEntry, updateTranscriptEntries } from '../utils/transcriptParser';

interface TranscriptProps {
  currentText?: string;
  isPlaying?: boolean;
  className?: string;
  onCollapseChange?: (isCollapsed: boolean) => void;
  currentTime?: number;
  transcriptData?: TranscriptEntry[];
  onSeek?: (time: number) => void;
}

export function Transcript({ 
  currentText, 
  isPlaying, 
  className, 
  onCollapseChange, 
  currentTime = 0,
  transcriptData,
  onSeek
}: TranscriptProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const activeEntryRef = useRef<HTMLDivElement>(null);

  // Compute display entries from provided transcript + currentTime
  const displayEntries = useMemo<TranscriptEntry[]>(() => {
    const baseEntries = (transcriptData && transcriptData.length > 0)
      ? transcriptData
      : [
          { id: '1', timestamp: 0, speaker: 'Narrator', text: 'The city stretched endlessly before them, a vast metropolis of towering buildings and bustling streets.', isActive: false },
          { id: '2', timestamp: 15, speaker: 'Narrator', text: 'In the distance, a massive wall loomed over the landscape, its ancient stones weathered by centuries of wind and rain.', isActive: false },
          { id: '3', timestamp: 30, speaker: 'Narrator', text: 'The banner fluttered in the breeze, displaying the emblem of a helmeted warrior - a symbol of protection and strength.', isActive: false },
          { id: '4', timestamp: 45, speaker: 'Narrator', text: 'Below, the bridge extended across the chasm, connecting the old world to the new, spanning generations of history.', isActive: false },
          { id: '5', timestamp: 60, speaker: 'Narrator', text: 'The sound of footsteps echoed through the empty corridors, each step a reminder of the journey that lay ahead.', isActive: false },
        ];
    return updateTranscriptEntries(baseEntries, currentTime);
  }, [transcriptData, currentTime]);

  // Auto-scroll to active entry; keep the very beginning visible
  useEffect(() => {
    if (!isExpanded) return;
    const time = currentTime ?? 0;
    const secondEntryTs = displayEntries[1]?.timestamp ?? 3;
    // Keep the list anchored to the top until just before the 2nd entry
    if (time < Math.max(1, secondEntryTs - 0.5)) {
      if (transcriptRef.current) {
        transcriptRef.current.scrollTo({ top: 0, behavior: 'auto' });
      }
      return;
    }
    if (activeEntryRef.current) {
      activeEntryRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [displayEntries, isExpanded, currentTime]);

  return (
    <Card className={`h-full flex flex-col bg-transparent backdrop-blur-sm border-0 rounded-none ${className} ${!isExpanded ? 'overflow-hidden p-0 m-0' : 'p-0'} transition-[padding,margin,overflow] duration-500 ease-out`}>
      {/* Enhanced Header */}
      <div className="px-6 pt-6 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-lg">📝</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-30 animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-slate-100 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Transcript
              </h3>
              {isPlaying && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                  <div className="text-xs text-blue-400 font-mono bg-slate-800/50 px-2 py-1 rounded-full">
                    {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
                  </div>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newExpanded = !isExpanded;
              setIsExpanded(newExpanded);
              onCollapseChange?.(!newExpanded);
            }}
            className="gap-2 glass-dark hover:glass-dark-intense border-slate-500/60 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-300 shadow-lg text-slate-200 hover:shadow-glow btn-modern"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Transcript Content - Scrollable */}
      <div ref={transcriptRef} className={`flex-1 overflow-y-auto transition-[opacity,max-height,padding] duration-500 ease-out scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500 scrollbar-thumb-rounded-full ${
        isExpanded 
          ? 'opacity-100 px-6 pt-4 pb-6' 
          : 'opacity-0 max-h-0 p-0 overflow-hidden'
      }`}>
        <div className="space-y-4">
          {displayEntries.map((item) => {
            const formatTimestamp = (seconds: number) => {
              const mins = Math.floor(seconds / 60);
              const secs = Math.floor(seconds % 60);
              return `${mins}:${secs.toString().padStart(2, '0')}`;
            };

            return (
              <div
                key={item.id}
                ref={item.isActive ? activeEntryRef : null}
                className={`group p-4 rounded-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02] btn-modern ${
                  item.isActive
                    ? 'glass-dark-intense border-2 border-blue-400/60 shadow-2xl shadow-blue-500/30 neon-border'
                    : 'glass-dark border border-slate-600/40 hover:glass-dark-medium hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/20'
                }`}
                onClick={() => onSeek?.(item.timestamp)}
                title={`Jump to ${formatTimestamp(item.timestamp)}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-16 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    item.isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-blue-100 shadow-lg shadow-blue-500/50' 
                      : 'bg-slate-700/80 text-slate-300 group-hover:bg-slate-600/80'
                  }`}>
                    <span className="text-xs font-bold font-mono">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm font-bold px-3 py-1 rounded-full transition-all duration-300 ${
                        item.isActive 
                          ? 'bg-blue-500/20 text-blue-200 border border-blue-400/40' 
                          : 'bg-slate-600/60 text-slate-400 group-hover:bg-slate-500/60 group-hover:text-slate-300'
                      }`}>
                        {item.speaker}
                      </span>
                      {item.isActive && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed transition-all duration-300 ${
                      item.isActive ? 'text-blue-100 font-medium' : 'text-slate-300 group-hover:text-slate-200'
                    }`}>
                      {item.text}
                    </p>
                  </div>
                </div>
                
                {/* Active item indicator */}
                {item.isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full shadow-lg shadow-blue-400/50"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </Card>
  );
}
