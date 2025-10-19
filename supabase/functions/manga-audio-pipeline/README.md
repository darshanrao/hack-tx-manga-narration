# Manga Audio Pipeline - Supabase Edge Function

This Edge Function replicates the complete PDF-to-audio pipeline from the Python implementation, designed to run on Supabase Edge Functions.

## Features

- **PDF Processing**: Extract pages and convert to images for analysis
- **Two-Pass Gemini Analysis**: 
  - Pass 1: Character identification across all pages
  - Pass 2: Dialogue extraction with character context
- **Audio Tag Enhancement**: Add ElevenLabs v3 audio tags for better voice generation
- **ElevenLabs Audio Generation**: Generate multi-speaker dialogue audio
- **File Storage**: Upload audio and transcript files to Supabase Storage
- **Voice Consistency**: Maintain character voice assignments across scenes

## API Usage

### Endpoint
```
POST /functions/v1/manga-audio-pipeline
```

### Request Body
```json
{
  "pdf_file": "base64-encoded-pdf-or-images",
  "scene_id": "unique-scene-identifier",
  "use_mock_data": false
}
```

### Response
```json
{
  "scene_id": "scene-001",
  "total_pages": 4,
  "characters": [
    {
      "name": "Character Name",
      "gender": "male",
      "voice_id": "voice-id-here"
    }
  ],
  "total_dialogue_lines": 45,
  "audio_results": [
    {
      "page": 1,
      "audio_url": "https://storage-url/audio-file.mp3",
      "transcript": "Character: dialogue text...",
      "duration": 32.5,
      "success": true
    }
  ],
  "storage_results": {
    "audio": [...],
    "transcripts": [...],
    "combinedAudio": {...},
    "combinedTranscript": {...}
  },
  "success": true
}
```

## Environment Variables

Set these in your Supabase project settings:

```bash
GOOGLE_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Supabase Storage Setup

1. Create a storage bucket named `manga-audio`
2. Set appropriate RLS policies for public read access
3. Ensure the bucket allows uploads from the Edge Function

### Storage Bucket Policy Example
```sql
-- Allow public read access to audio files
CREATE POLICY "Public read access for manga audio" ON storage.objects
FOR SELECT USING (bucket_id = 'manga-audio');

-- Allow Edge Function to upload files
CREATE POLICY "Edge function upload access" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'manga-audio');
```

## Deployment

### Using Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Deploy the function:
```bash
supabase functions deploy manga-audio-pipeline
```

### Manual Deployment

1. Zip the function directory:
```bash
cd edge-functions/manga-audio-pipeline
zip -r manga-audio-pipeline.zip .
```

2. Upload via Supabase Dashboard or CLI

## Testing

### Test with Mock Data
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/manga-audio-pipeline' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "pdf_file": "mock-pdf-data",
    "scene_id": "test-scene-001",
    "use_mock_data": true
  }'
```

### Test with Real PDF
```bash
# Convert PDF to base64 first
base64 -i your-manga.pdf | tr -d '\n' > pdf-base64.txt

curl -X POST 'https://your-project.supabase.co/functions/v1/manga-audio-pipeline' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "pdf_file": "'$(cat pdf-base64.txt)'",
    "scene_id": "real-scene-001",
    "use_mock_data": false
  }'
```

## Limitations & Considerations

### PDF Processing
- **Current Limitation**: PDF processing requires a library that works with Edge Runtime
- **Workarounds**:
  1. Pre-process PDFs on client side using PDF.js
  2. Use a serverless PDF processing service
  3. Implement with a compatible PDF library

### Audio Processing
- Audio file combination requires proper audio library
- Duration calculation needs audio metadata parsing
- Large audio files may hit Edge Function size limits

### Performance
- Edge Functions have execution time limits (typically 60 seconds)
- Large PDFs with many pages may timeout
- Consider breaking large scenes into smaller chunks

### Cost Considerations
- Gemini API calls for each page
- ElevenLabs API calls for audio generation
- Supabase Storage for file hosting
- Monitor usage and set appropriate limits

## Architecture

```
Client Request
    ↓
Edge Function (manga-audio-pipeline)
    ↓
PDF Processing (Gemini Service)
    ↓
Character Identification (Pass 1)
    ↓
Dialogue Extraction (Pass 2)
    ↓
Audio Tag Enhancement
    ↓
Audio Generation (ElevenLabs Service)
    ↓
File Upload (Storage Service)
    ↓
Response with URLs
```

## Error Handling

The function includes comprehensive error handling for:
- Invalid API keys
- PDF processing failures
- Gemini API errors
- ElevenLabs API errors
- Storage upload failures
- Network timeouts

## Monitoring

Monitor your Edge Function through:
- Supabase Dashboard logs
- Function metrics and execution times
- API usage tracking
- Storage usage monitoring

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Verify environment variables are set correctly
3. Test with mock data first
4. Check API quotas and limits
