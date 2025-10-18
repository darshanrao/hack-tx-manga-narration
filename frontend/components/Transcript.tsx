'use client'

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TranscriptProps {
  currentText?: string;
  isPlaying?: boolean;
  className?: string;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export function Transcript({ currentText, isPlaying, className, onCollapseChange }: TranscriptProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Mock transcript data - in a real app, this would come from the PDF/manga analysis
  const mockTranscript = [
    {
      id: 1,
      timestamp: "0:00",
      text: "The city stretched endlessly before them, a vast metropolis of towering buildings and bustling streets.",
      isActive: isPlaying && currentText?.includes("city")
    },
    {
      id: 2,
      timestamp: "0:15",
      text: "In the distance, a massive wall loomed over the landscape, its ancient stones weathered by centuries of wind and rain.",
      isActive: isPlaying && currentText?.includes("wall")
    },
    {
      id: 3,
      timestamp: "0:30",
      text: "The banner fluttered in the breeze, displaying the emblem of a helmeted warrior - a symbol of protection and strength.",
      isActive: isPlaying && currentText?.includes("banner")
    },
    {
      id: 4,
      timestamp: "0:45",
      text: "Below, the bridge extended across the chasm, connecting the old world to the new, spanning generations of history.",
      isActive: isPlaying && currentText?.includes("bridge")
    },
    {
      id: 5,
      timestamp: "1:00",
      text: "The sound of footsteps echoed through the empty corridors, each step a reminder of the journey that lay ahead.",
      isActive: isPlaying && currentText?.includes("footsteps")
    }
  ];

  return (
    <Card className={`h-auto flex flex-col bg-slate-800/90 backdrop-blur-sm border-slate-700/50 ${className} ${!isExpanded ? 'overflow-hidden p-0 m-0' : 'p-0'} transition-all duration-500 ease-in-out`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-200">Transcript</h3>
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

      {/* Transcript Content */}
      <div className={`overflow-y-auto transition-all duration-500 ease-in-out ${
        isExpanded 
          ? 'opacity-100 px-4 pt-0 pb-4' 
          : 'opacity-0 max-h-0 p-0 overflow-hidden'
      }`}>
        <div className="space-y-3">
          {mockTranscript.map((item) => (
            <div
              key={item.id}
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
                  {item.timestamp}
                </span>
                <p className={`text-sm leading-relaxed ${
                  item.isActive ? 'text-blue-100 font-medium' : 'text-slate-300'
                }`}>
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </Card>
  );
}
