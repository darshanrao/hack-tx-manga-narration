import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { GeminiService } from './gemini-service.ts'
import { ElevenLabsService } from './elevenlabs-service.ts'
import { StorageService } from './storage-service.ts'
import { extractPagesFromPDF, createMockPDFPages } from './pdf-processor.ts'

interface PipelineRequest {
  pdf_file: string; // base64 encoded PDF or array of base64 images
  scene_id: string;
  use_mock_data?: boolean; // for testing
}

interface PipelineResponse {
  scene_id: string;
  total_pages: number;
  characters: any[];
  total_dialogue_lines: number;
  audio_results: any[];
  storage_results: any;
  success: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { method, url } = req;
    
    if (method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const request: PipelineRequest = await req.json();

    if (!request.pdf_file || !request.scene_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: pdf_file, scene_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize services
    const geminiService = new GeminiService(Deno.env.get('GOOGLE_API_KEY') || '');
    const elevenLabsService = new ElevenLabsService(Deno.env.get('ELEVENLABS_API_KEY') || '');
    const storageService = new StorageService(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        bucket: 'manga-audio',
        folder: request.scene_id,
        publicUrl: Deno.env.get('SUPABASE_URL') || ''
      }
    );

    // Step 1: Process PDF with Gemini
    console.log('Starting PDF processing with Gemini...');
    const sceneAnalysis = await processPDFWithGemini(request.pdf_file, request.scene_id, geminiService, request.use_mock_data);
    
    // Step 2: Generate audio with ElevenLabs
    console.log('Starting audio generation with ElevenLabs...');
    const audioResults = await elevenLabsService.generateSceneAudio(
      sceneAnalysis.dialogue,
      sceneAnalysis.characters,
      request.scene_id
    );
    
    // Step 3: Upload files to storage
    console.log('Uploading files to storage...');
    const storageResults = await uploadResultsToStorage(audioResults, storageService, request.scene_id);
    
    // Step 4: Combine and return results
    const result: PipelineResponse = {
      scene_id: request.scene_id,
      total_pages: sceneAnalysis.total_pages,
      characters: sceneAnalysis.characters,
      total_dialogue_lines: sceneAnalysis.dialogue.length,
      audio_results: audioResults,
      storage_results: storageResults,
      success: true
    };

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Pipeline error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Pipeline processing failed', 
        details: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function processPDFWithGemini(
  pdfFile: string, 
  sceneId: string, 
  geminiService: GeminiService,
  useMockData?: boolean
): Promise<any> {
  try {
    let pages: string[];
    
    if (useMockData) {
      // Use mock data for testing
      console.log('Using mock PDF data for testing...');
      const mockPages = createMockPDFPages(4);
      pages = mockPages.map(page => page.imageData);
    } else {
      // Extract pages from PDF
      const pdfResult = await extractPagesFromPDF(pdfFile);
      if (!pdfResult.success) {
        throw new Error(`PDF processing failed: ${pdfResult.error}`);
      }
      pages = pdfResult.pages.map(page => page.imageData);
    }
    
    console.log(`Processing ${pages.length} pages for scene ${sceneId}...`);
    
    // Process scene with Gemini
    const sceneAnalysis = await geminiService.processScene(pages, sceneId);
    
    return sceneAnalysis;
    
  } catch (error) {
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

async function uploadResultsToStorage(
  audioResults: any[],
  storageService: StorageService,
  sceneId: string
): Promise<any> {
  try {
    // Prepare audio files for upload
    const audioFiles = audioResults
      .filter(result => result.success)
      .map(result => ({
        blob: new Blob([], { type: 'audio/mpeg' }), // Mock blob - would be actual audio data
        filename: `${sceneId}_page${result.page}_dialogue.mp3`
      }));

    // Prepare transcript files for upload
    const transcriptFiles = audioResults.map(result => ({
      content: result.transcript,
      filename: `${sceneId}_page${result.page}_transcript.txt`
    }));

    // Upload all files
    const uploadResults = await storageService.uploadSceneFiles(
      sceneId,
      audioFiles,
      transcriptFiles
    );

    return uploadResults;

  } catch (error) {
    console.error('Storage upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
