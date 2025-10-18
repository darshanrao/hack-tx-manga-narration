'use client'

import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TranscriptEntry, parseTranscript, updateTranscriptEntries } from '../utils/transcriptParser';

interface TranscriptProps {
  currentText?: string;
  isPlaying?: boolean;
  className?: string;
  onCollapseChange?: (isCollapsed: boolean) => void;
  currentTime?: number;
  transcriptData?: TranscriptEntry[];
}

export function Transcript({ 
  currentText, 
  isPlaying, 
  className, 
  onCollapseChange, 
  currentTime = 0,
  transcriptData 
}: TranscriptProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const activeEntryRef = useRef<HTMLDivElement>(null);

  // Load and parse transcript data
  useEffect(() => {
    if (transcriptData) {
      setTranscriptEntries(transcriptData);
    } else {
      // Fallback to mock data if no transcript data provided
      const mockTranscript: TranscriptEntry[] = [
        {
          id: "1",
          timestamp: 0,
          speaker: "Narrator",
          text: "The city stretched endlessly before them, a vast metropolis of towering buildings and bustling streets.",
          isActive: false
        },
        {
          id: "2", 
          timestamp: 15,
          speaker: "Narrator",
          text: "In the distance, a massive wall loomed over the landscape, its ancient stones weathered by centuries of wind and rain.",
          isActive: false
        },
        {
          id: "3",
          timestamp: 30,
          speaker: "Narrator", 
          text: "The banner fluttered in the breeze, displaying the emblem of a helmeted warrior - a symbol of protection and strength.",
          isActive: false
        },
        {
          id: "4",
          timestamp: 45,
          speaker: "Narrator",
          text: "Below, the bridge extended across the chasm, connecting the old world to the new, spanning generations of history.",
          isActive: false
        },
        {
          id: "5",
          timestamp: 60,
          speaker: "Narrator",
          text: "The sound of footsteps echoed through the empty corridors, each step a reminder of the journey that lay ahead.",
          isActive: false
        }
      ];
      setTranscriptEntries(mockTranscript);
    }
  }, [transcriptData]);

  // Update active entries based on current time
  useEffect(() => {
    if (transcriptEntries.length > 0) {
      const updatedEntries = updateTranscriptEntries(transcriptEntries, currentTime);
      setTranscriptEntries(updatedEntries);
    }
  }, [currentTime]);

  // Auto-scroll to active entry
  useEffect(() => {
    if (activeEntryRef.current && isExpanded) {
      activeEntryRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [transcriptEntries, isExpanded]);

  return (
    <Card className={`h-full flex flex-col bg-slate-900/90 backdrop-blur-sm border-slate-700/50 rounded-none ${className} ${!isExpanded ? 'overflow-hidden p-0 m-0' : 'p-0'} transition-[padding,margin,overflow] duration-300 ease-out`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-slate-200">Transcript</h3>
            {isPlaying && (
              <div className="text-xs text-blue-400 font-mono">
                {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newExpanded = !isExpanded;
              setIsExpanded(newExpanded);
              onCollapseChange?.(!newExpanded);
            }}
            className="gap-2 bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg text-slate-200"
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

      {/* Transcript Content - Scrollable */}
      <div className={`flex-1 overflow-y-auto transition-[opacity,max-height,padding] duration-300 ease-out ${
        isExpanded 
          ? 'opacity-100 px-4 pt-0 pb-4' 
          : 'opacity-0 max-h-0 p-0 overflow-hidden'
      }`}>
        <div className="space-y-3">
          {transcriptEntries.map((item) => {
            const formatTimestamp = (seconds: number) => {
              const mins = Math.floor(seconds / 60);
              const secs = Math.floor(seconds % 60);
              return `${mins}:${secs.toString().padStart(2, '0')}`;
            };

            return (
              <div
                key={item.id}
                ref={item.isActive ? activeEntryRef : null}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  item.isActive
                    ? 'bg-blue-900/40 border border-blue-400/60 shadow-lg shadow-blue-500/20'
                    : 'bg-slate-700/60 border border-slate-600/40 hover:bg-slate-600/80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-xs font-mono px-2 py-1 rounded ${
                    item.isActive ? 'bg-blue-500/80 text-blue-100' : 'bg-slate-600/80 text-slate-300'
                  }`}>
                    {formatTimestamp(item.timestamp)}
                  </span>
                  <p className={`text-sm leading-relaxed ${
                    item.isActive ? 'text-blue-100 font-medium' : 'text-slate-300'
                  }`}>
                    <span className={`font-semibold ${
                      item.isActive ? 'text-blue-200' : 'text-slate-400'
                    }`}>
                      {item.speaker}:
                    </span>{' '}
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </Card>
  );
}
