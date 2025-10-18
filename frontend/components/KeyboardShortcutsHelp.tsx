'use client'

import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Keyboard, HelpCircle } from 'lucide-react';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'Space', description: 'Play/Pause narration' },
    { key: '←', description: 'Rewind 5 seconds' },
    { key: '→', description: 'Skip 5 seconds' },
    { key: '↑', description: 'Volume up' },
    { key: '↓', description: 'Volume down' },
    { key: '+ / =', description: 'Speed up' },
    { key: '-', description: 'Speed down' },
    { key: '0', description: 'Reset speed to 1x' },
    { key: 'Page Up', description: 'Previous page/panel' },
    { key: 'Page Down', description: 'Next page/panel' },
    { key: 'Home', description: 'Go to first page/panel' },
    { key: 'End', description: 'Go to last page/panel' },
    { key: 'Esc', description: 'Stop playback' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="gap-2 bg-slate-700/80 backdrop-blur-sm border-slate-500/60 hover:bg-slate-600/90 hover:border-blue-400/80 hover:text-blue-300 transition-all duration-200 shadow-lg text-slate-200"
        >
          <Keyboard className="h-5 w-5" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-slate-900/95 backdrop-blur-xl border-slate-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-5 w-5 text-blue-400" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            Use these keyboard shortcuts to control playback without using the mouse:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <span className="text-slate-300 text-sm">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-slate-700 border border-slate-600 rounded text-slate-200">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-blue-300 text-sm">
              <strong>Tip:</strong> Shortcuts are disabled when typing in input fields to prevent conflicts.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}