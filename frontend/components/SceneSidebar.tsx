'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, FileText, Clock } from 'lucide-react';

interface Scene {
  id: string;
  name: string;
  filename: string;
  uploaded_at: string;
  total_pages?: number;
  status?: 'processing' | 'completed' | 'error';
  public_url?: string;
}

interface SceneSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSceneSelect: (scene: Scene) => void;
  currentScene?: Scene;
}

export function SceneSidebar({ isOpen, onToggle, onSceneSelect, currentScene }: SceneSidebarProps) {
  const HEADER_OFFSET = 88; // px; matches header height in page layout
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch scenes from backend
  useEffect(() => {
          const fetchScenes = async () => {
            try {
              setLoading(true);
              const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
              const url = `${API_BASE}/api/supabase-audio/scenes`;
              
              const response = await fetch(url);
              
              if (!response.ok) {
                throw new Error(`Failed to fetch scenes: ${response.status}`);
              }
              
              const data = await response.json();
              
              // Transform Supabase SceneFolderInfo to the format expected by SceneSidebar
              const transformedScenes = (data.scenes || []).map((sceneFolder: any) => ({
                id: `scene-${sceneFolder.sceneNumber}`,
                status: 'completed', // Assume completed since files exist
                name: `Scene ${sceneFolder.sceneNumber}`,
                filename: `scene-${sceneFolder.sceneNumber}.pdf`, // Assume PDF format
                uploaded_at: sceneFolder.audioFiles[0]?.created_at || new Date().toISOString(),
                total_pages: sceneFolder.audioFiles.length, // Use audio file count as page count
                public_url: null // Will be handled by the scene selection logic
              }));
              
              setScenes(transformedScenes);
              setError(null);
            } catch (err) {
              console.error('Error fetching scenes:', err);
              setError(err instanceof Error ? err.message : 'Failed to fetch scenes');
              // Do not populate mock scenes; force user to fix backend/API
            } finally {
              setLoading(false);
            }
          };

    fetchScenes();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <Play className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'error': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed left-0 right-0 bottom-0 bg-black/50 z-40 lg:hidden"
          style={{ top: HEADER_OFFSET }}
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`
          fixed left-0 bg-slate-900/95 border-r border-slate-700/50 shadow-xl z-40 text-slate-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-80 lg:w-72
        `}
        style={{ top: HEADER_OFFSET, height: `calc(100% - ${HEADER_OFFSET}px)` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/80">
          <h2 className="text-lg font-semibold text-slate-100">Scenes</h2>
          <button
            onClick={onToggle}
            className="p-1 rounded-md hover:bg-slate-800/70 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-slate-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
              Loading scenes...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-400">
              <p className="text-sm">{error}</p>
            </div>
          ) : scenes.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="text-sm">No scenes found</p>
              <p className="text-xs text-slate-500 mt-1">Upload a PDF to get started</p>
            </div>
          ) : (
            <div className="p-2">
              {scenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => onSceneSelect(scene)}
                  className={`
                    w-full text-left p-3 rounded-lg mb-2 transition-all duration-200
                    hover:bg-slate-800/60 border border-transparent
                    ${currentScene?.id === scene.id 
                      ? 'bg-blue-900/30 border-blue-400/30 shadow-sm' 
                      : 'hover:border-slate-700/60'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`${getStatusColor(scene.status)}`}>
                          {getStatusIcon(scene.status)}
                        </span>
                        <h3 className="font-medium text-slate-100 truncate">
                          {scene.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 truncate mb-1">
                        {scene.filename}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatDate(scene.uploaded_at)}</span>
                        {scene.total_pages && (
                          <>
                            <span>•</span>
                            <span>{scene.total_pages} pages</span>
                          </>
                        )}
                      </div>
                    </div>
                    {currentScene?.id === scene.id && (
                      <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/80">
          <p className="text-xs text-slate-500 text-center">
            Upload PDFs to add more scenes
          </p>
        </div>
      </div>

      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 z-40 p-2 bg-slate-800/90 border border-slate-700/60 text-slate-200 rounded-lg shadow-md hover:bg-slate-700/80 transition-colors"
          style={{ top: HEADER_OFFSET + 16 }}
        >
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>
      )}
    </>
  );
}
