'use client'

import { useEffect, useRef, useState } from 'react';

// Use CDN approach to avoid import issues
declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

const loadPDFJS = async () => {
  if (typeof window !== 'undefined') {
    // Check if PDF.js is already loaded
    if (window.pdfjsLib) {
      return window.pdfjsLib;
    }

    // Load PDF.js from CDN
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          // Set up worker
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          console.log('PDF.js loaded from CDN, version:', window.pdfjsLib.version);
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('PDF.js not available after loading'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
      document.head.appendChild(script);
    });
  }
  throw new Error('Window not available');
};

interface PDFPageViewerProps {
  pdfFile: File;
  currentPageIndex: number;
  onPageCountChange?: (count: number) => void;
}

export function PDFPageViewer({ 
  pdfFile, 
  currentPageIndex, 
  onPageCountChange 
}: PDFPageViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfFile) {
        setError('No PDF file provided.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Attempting to load PDF:', pdfFile.name, 'Type:', pdfFile.type);

        const pdfjs = await loadPDFJS();
        if (!pdfjs) {
          throw new Error('PDF.js not available after dynamic import.');
        }
        console.log('PDF.js loaded successfully. Version:', pdfjs.version);
        
        const arrayBuffer = await pdfFile.arrayBuffer();
        console.log('PDF file arrayBuffer size:', arrayBuffer.byteLength, 'bytes');

        if (arrayBuffer.byteLength === 0) {
          throw new Error('PDF file arrayBuffer is empty.');
        }

        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        setPdfDocument(pdf);
        onPageCountChange?.(pdf.numPages);
        console.log('PDF loaded successfully. Total pages:', pdf.numPages);

      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF file: ${err.message || err.toString()}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [pdfFile, onPageCountChange]);

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current) return;

      try {
        const page = await pdfDocument.getPage(currentPageIndex + 1); // PDF pages are 1-indexed
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Calculate scale to fit container with proper centering
        const container = canvas.parentElement;
        if (!container) return;

        const containerWidth = container.clientWidth - 20; // Account for padding
        const containerHeight = container.clientHeight - 20; // Account for padding
        
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
          containerWidth / viewport.width,
          containerHeight / viewport.height,
          2.0 // Maximum scale to prevent overly large pages
        );

        const scaledViewport = page.getViewport({ scale });

        // Set canvas dimensions with proper centering
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        canvas.style.width = `${scaledViewport.width}px`;
        canvas.style.height = `${scaledViewport.height}px`;
        canvas.style.display = 'block';
        canvas.style.margin = 'auto';

        // Render page
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering PDF page:', err);
        setError('Failed to render PDF page');
      }
    };

    renderPage();
  }, [pdfDocument, currentPageIndex]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <div className="text-6xl">📄</div>
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-2 bg-muted/30">
      <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden manga-page-container flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="pdf-canvas"
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%',
            display: 'block',
            margin: 'auto'
          }}
        />
      </div>
    </div>
  );
}
