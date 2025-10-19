import { serveQuiet } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { GeminiService } from '../manga-audio-pipeline/gemini-service.ts'
import { ElevenLabsService } from '../manga-audio-pipeline/elevenlabs-service.ts'
import { StorageService } from '../manga-audio-pipeline/storage-service.ts'
import { DatabaseService } from '../manga-audio-pipeline/database-service.ts'

interface PDFUploadEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: {
    id: string
    name: string
    bucket_id: string
    path_tokens: string[]
    created_at: string
    updated_at: string
    last_accessed_at: string
    metadata: any
    owner: string
  }
  old_record?: any
}

interface ProcessingResult {
  success: boolean
  sceneId?: string
  error?: string
  processingTime?: number
}

serveQuiet(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();

  try {
    console.log('📁 PDF Upload Processing Function triggered');

    // Parse the webhook payload
    const event: PDFUploadEvent = await req.json();
    console.log('Event received:', JSON.stringify(event, null, 2));

    // Only process INSERT events for PDF files in the manga-pdfs bucket
    if (event.type !== 'INSERT' || event.record.bucket_id !== 'manga-pdfs') {
      console.log('Skipping event - not a PDF upload to manga-pdfs bucket');
      return new Response(
        JSON.stringify({ message: 'Event not processed - not a PDF upload' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if it's a PDF file
    const fileName = event.record.name;
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      console.log(`Skipping file ${fileName} - not a PDF`);
      return new Response(
        JSON.stringify({ message: 'File not processed - not a PDF' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const filePath = event.record.path_tokens.join('/');
    console.log(`🔄 Processing PDF: ${fileName} (${filePath})`);

    // Initialize services
    const geminiService = new GeminiService(Deno.env.get('GOOGLE_API_KEY') || '');
    const elevenLabsService = new ElevenLabsService(Deno.env.get('ELEVENLABS_API_KEY') || '');
    const storageService = new StorageService(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        bucket: 'output-files',
        folder: undefined, // Will be set per scene
        publicUrl: Deno.env.get('SUPABASE_URL') || ''
      }
    );
    const databaseService = new DatabaseService(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Check if this PDF has already been processed
    const pdfUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/manga-pdfs/${filePath}`;
    const isAlreadyProcessed = await databaseService.isPdfProcessed(pdfUrl);
    
    if (isAlreadyProcessed) {
      console.log(`PDF ${fileName} already processed, skipping...`);
      return new Response(
        JSON.stringify({ 
          message: 'PDF already processed',
          filePath: pdfUrl
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate scene ID from filename
    const sceneId = generateSceneId(fileName);
    console.log(`📝 Scene ID: ${sceneId}`);

    // Step 1: Download PDF from storage
    console.log('📥 Downloading PDF from storage...');
    const pdfData = await downloadPdfFromStorage(filePath);
    
    // Step 2: Process PDF with Gemini
    console.log('🧠 Processing PDF with Gemini...');
    const sceneAnalysis = await processPDFWithGemini(pdfData, sceneId, geminiService);
    
    // Step 3: Generate audio with ElevenLabs
    console.log('🎵 Generating audio with ElevenLabs...');
    const audioResults = await elevenLabsService.generateSceneAudio(
      sceneAnalysis.dialogue,
      sceneAnalysis.characters,
      sceneId
    );
    
    // Step 4: Upload results to output storage
    console.log('📤 Uploading results to storage...');
    const storageResults = await uploadResultsToStorage(audioResults, storageService, sceneId);
    
    // Step 5: Save to database
    console.log('💾 Saving results to database...');
    const dbResults = await saveToDatabase(
      databaseService,
      sceneId,
      fileName,
      pdfUrl,
      sceneAnalysis,
      audioResults,
      storageResults
    );

    const processingTime = Date.now() - startTime;
    console.log(`✅ Processing complete in ${processingTime}ms`);

    const result: ProcessingResult = {
      success: true,
      sceneId,
      processingTime
    };

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Processing failed:', error);

    const result: ProcessingResult = {
      success: false,
      error: error.message,
      processingTime
    };

    return new Response(
      JSON.stringify(result),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Generate a scene ID from filename
 */
function generateSceneId(fileName: string): string {
  // Remove .pdf extension and create scene ID
  const baseName = fileName.replace(/\.pdf$/i, '');
  const timestamp = Date.now();
  return `${baseName}_${timestamp}`;
}

/**
 * Download PDF from Supabase Storage
 */
async function downloadPdfFromStorage(filePath: string): Promise<ArrayBuffer> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/manga-pdfs/${filePath}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
    }

    return await response.arrayBuffer();

  } catch (error) {
    throw new Error(`PDF download failed: ${error.message}`);
  }
}

/**
 * Process PDF with Gemini (simplified - would need proper PDF processing)
 */
async function processPDFWithGemini(
  pdfData: ArrayBuffer,
  sceneId: string,
  geminiService: GeminiService
): Promise<any> {
  try {
    // For now, use mock data since PDF processing in Edge Functions is complex
    // In production, you would:
    // 1. Use a PDF processing library
    // 2. Convert pages to images
    // 3. Process with Gemini
    
    console.log('⚠️  Using mock PDF data - PDF processing not fully implemented for Edge Functions');
    
    // Mock scene analysis for demonstration
    const mockAnalysis = {
      characters: [
        { name: 'Character A', gender: 'male' as const },
        { name: 'Character B', gender: 'female' as const },
        { name: 'Narrator', gender: 'unknown' as const }
      ],
      dialogue: [
        { character: 'Narrator', text: '[calm] The scene begins...', page: 1 },
        { character: 'Character A', text: '[excited] Hello there!', page: 1 },
        { character: 'Character B', text: '[curious] What brings you here?', page: 1 },
        { character: 'Character A', text: '[determined] I have important news.', page: 2 },
        { character: 'Character B', text: '[worried] What kind of news?', page: 2 }
      ],
      total_pages: 2,
      scene_summary: 'A conversation between two characters with important news to share.'
    };

    return mockAnalysis;

  } catch (error) {
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

/**
 * Upload results to output storage
 */
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

/**
 * Save results to database
 */
async function saveToDatabase(
  databaseService: DatabaseService,
  sceneId: string,
  fileName: string,
  pdfUrl: string,
  sceneAnalysis: any,
  audioResults: any[],
  storageResults: any
): Promise<any> {
  try {
    // Create initial scene record
    const sceneData = {
      manga_title: extractMangaTitle(fileName),
      chapter_number: extractChapterNumber(fileName),
      page_id: sceneId,
      scene_title: `${sceneId} Scene`,
      scene_description: sceneAnalysis.scene_summary,
      ambient: 'General ambient sounds',
      characters: sceneAnalysis.characters,
      dialogue: sceneAnalysis.dialogue,
      pdf_file_path: pdfUrl,
      pdf_file_name: fileName
    };

    // Save to database
    const dbResults = await databaseService.savePipelineResults(
      sceneId,
      {
        characters: sceneAnalysis.characters,
        dialogue: sceneAnalysis.dialogue,
        sceneSummary: sceneAnalysis.scene_summary,
        ambient: 'General ambient sounds'
      },
      audioResults
    );

    return dbResults;

  } catch (error) {
    throw new Error(`Database save failed: ${error.message}`);
  }
}

/**
 * Extract manga title from filename
 */
function extractMangaTitle(fileName: string): string {
  // Simple extraction - could be more sophisticated
  const baseName = fileName.replace(/\.pdf$/i, '');
  return baseName.replace(/[_-]/g, ' ');
}

/**
 * Extract chapter number from filename
 */
function extractChapterNumber(fileName: string): number {
  // Simple extraction - look for numbers in filename
  const match = fileName.match(/(\d+)/);
  return match ? parseInt(match[1]) : 1;
}
