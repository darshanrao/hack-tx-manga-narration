'use client'

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface TranscriptProps {
  currentText?: string;
  isPlaying?: boolean;
  className?: string;
}

export function Transcript({ currentText, isPlaying, className }: TranscriptProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Transcript</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>

      {/* Transcript Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {mockTranscript.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg transition-all duration-200 ${
                item.isActive
                  ? 'bg-blue-50 border border-blue-200 shadow-sm'
                  : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`text-xs font-mono px-2 py-1 rounded ${
                  item.isActive ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {item.timestamp}
                </span>
                <p className={`text-sm leading-relaxed ${
                  item.isActive ? 'text-blue-900 font-medium' : 'text-slate-700'
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
