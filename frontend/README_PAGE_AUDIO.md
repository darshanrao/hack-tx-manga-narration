# Page Audio Management System

This system provides a comprehensive solution for matching MP3 files and transcripts to PDF pages, with built-in support for future Supabase and API integration.

## Overview

The system automatically matches audio files and transcripts to PDF pages based on filename patterns, providing seamless page-specific audio playback and transcript display.

## File Structure

```
frontend/
├── utils/
│   └── pageAudioManager.ts     # Core utilities for file parsing and data management
├── hooks/
│   └── usePageAudio.ts         # React hook for managing page audio state
├── components/
│   └── PageAudioManager.tsx    # Component wrapper for page audio management
└── services/
    └── pageAudioAPI.ts         # API service for future Supabase integration
```

## File Naming Convention

The system expects files to follow this naming pattern:

### Audio Files
```
ch{chapter}_page{page}_dialogue_{timestamp}.mp3
```
Example: `ch01_page01_dialogue_20251018_220717.mp3`

### Transcript Files
```
ch{chapter}_page{page}_transcript_{timestamp}.txt
```
Example: `ch01_page01_transcript_20251018_220717.txt`

## Usage

### 1. Basic Setup

```tsx
import { PageAudioManager } from '../components/PageAudioManager';

function MyComponent() {
  const audioFiles = [
    'ch01_page01_dialogue_20251018_220717.mp3',
    'ch01_page02_dialogue_20251018_220717.mp3',
    // ... more files
  ];

  const transcriptFiles = [
    'ch01_page01_transcript_20251018_220717.txt',
    'ch01_page02_transcript_20251018_220717.txt',
    // ... more files
  ];

  return (
    <PageAudioManager
      audioFiles={audioFiles}
      transcriptFiles={transcriptFiles}
      baseUrl="/assets"
      currentPageIndex={currentPageIndex}
      onPageAudioChange={setCurrentPageAudio}
      onTranscriptChange={setPageTranscriptData}
      currentTime={currentTime}
    >
      {/* Your PDF viewer and controls */}
    </PageAudioManager>
  );
}
```

### 2. Using the Hook Directly

```tsx
import { usePageAudio } from '../hooks/usePageAudio';

function MyComponent() {
  const {
    currentPageAudio,
    currentTranscript,
    activeTranscriptEntry,
    chapters,
    isLoadingTranscript,
    updateActiveTranscript,
    goToNextPage,
    goToPreviousPage
  } = usePageAudio({
    audioFiles,
    transcriptFiles,
    baseUrl: '/assets',
    currentPageIndex,
    currentChapterIndex: 0
  });

  // Use the data...
}
```

### 3. API Integration (Future)

```tsx
import { pageAudioAPI } from '../services/pageAudioAPI';

// Get page audio from API
const result = await pageAudioAPI.getPageAudio(1, 1);
if (result.success) {
  console.log('Page audio:', result.data);
}

// Upload new page audio
const uploadResult = await pageAudioAPI.uploadPageAudio(
  1, 1, audioFile, transcriptFile
);
```

## Key Features

### Automatic File Matching
- Parses filenames to extract chapter and page numbers
- Automatically matches audio files with their corresponding transcripts
- Groups files by chapter for organized management

### Page-Specific Audio Playback
- Each PDF page gets its own audio file
- Seamless switching between pages with automatic audio loading
- Support for different audio formats (MP3, WAV, etc.)

### Transcript Management
- Automatic transcript loading for each page
- Real-time active transcript highlighting
- Support for multiple speakers and timestamps

### API-Ready Architecture
- Clean separation between local file management and API calls
- Easy migration path to Supabase or other backend services
- Consistent data structures across local and API modes

## Data Flow

1. **File Discovery**: System scans for audio and transcript files
2. **Parsing**: Filenames are parsed to extract chapter/page information
3. **Organization**: Files are grouped by chapter and sorted by page number
4. **Loading**: When a page is selected, the corresponding audio and transcript are loaded
5. **Playback**: Audio plays while transcript highlights the current section
6. **Navigation**: Users can navigate between pages with automatic audio switching

## API Endpoints (Future)

The system is designed to work with these API endpoints:

```
GET /api/chapters/{chapter}/pages/{page}/audio
GET /api/chapters/{chapter}/audio
GET /api/chapters/{chapter}/pages/{page}/transcript
POST /api/chapters/{chapter}/pages/{page}/audio/upload
```

## Supabase Integration

The system includes a `SupabasePageAudioService` class for future database integration:

```tsx
import { SupabasePageAudioService } from '../services/pageAudioAPI';

const supabaseService = new SupabasePageAudioService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Base URL Configuration
The `baseUrl` prop determines where audio and transcript files are served from:
- `/assets` - Local files in the public/assets directory
- `https://your-cdn.com/audio` - CDN-hosted files
- API endpoints for dynamic loading

## Error Handling

The system includes comprehensive error handling:
- Invalid filename patterns are ignored
- Missing files are handled gracefully
- Network errors during API calls are caught and reported
- Loading states are managed for better UX

## Performance Considerations

- Transcripts are cached after first load
- Audio files are loaded on-demand
- Lazy loading for large chapter collections
- Efficient file parsing with minimal memory usage

## Migration Path

To migrate from local files to API/Supabase:

1. **Phase 1**: Use local files with the current system
2. **Phase 2**: Implement API endpoints matching the expected structure
3. **Phase 3**: Update components to use `pageAudioAPI` instead of local files
4. **Phase 4**: Add Supabase integration for persistent storage

The system is designed to make this migration seamless with minimal code changes.
