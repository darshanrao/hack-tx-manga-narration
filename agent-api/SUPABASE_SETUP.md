# Supabase Storage Setup

## Configuration

1. Create a `.env` file in the `agent-api` directory with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here
```

2. Make sure your Supabase project has a bucket named `manga-pdfs` with a folder `pdfs`.

## Bucket Setup

In your Supabase dashboard:

1. Go to Storage
2. Create a bucket named `manga-pdfs`
3. Create a folder named `pdfs` inside the bucket
4. Set appropriate permissions (public read if you want direct access)

## Usage

When you upload a PDF file through the frontend, it will:

1. Upload the file to `manga-pdfs/pdfs/` with a timestamp prefix
2. Optionally start a backend ingest job to process the PDF
3. Auto-select the appropriate chapter based on filename pattern (scene-1.pdf → chapter 0)

## File Structure

Uploaded files will be stored as:
```
manga-pdfs/
  pdfs/
    1703123456789_scene-1.pdf
    1703123456790_scene-2.pdf
    ...
```

The frontend will automatically detect the chapter based on the filename pattern and load the corresponding audio/transcript files.
