-- Create manga_scenes table
CREATE TABLE IF NOT EXISTS manga_scenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manga_title VARCHAR(500) NOT NULL,
  chapter_number INTEGER NOT NULL,
  page_id VARCHAR(255) NOT NULL,
  scene_title VARCHAR(500) NOT NULL,
  scene_description TEXT,
  ambient TEXT,
  characters JSONB NOT NULL DEFAULT '{}',
  dialogue JSONB NOT NULL DEFAULT '[]',
  pdf_file_path VARCHAR(500),
  pdf_file_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audio_files table
CREATE TABLE IF NOT EXISTS audio_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scene_id UUID NOT NULL REFERENCES manga_scenes(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('dialogue', 'ambient', 'narration', 'combined')),
  character_name VARCHAR(255),
  voice_id VARCHAR(255),
  character_gender VARCHAR(20) CHECK (character_gender IN ('male', 'female', 'neutral', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manga_scenes_manga_title ON manga_scenes(manga_title);
CREATE INDEX IF NOT EXISTS idx_manga_scenes_chapter_number ON manga_scenes(chapter_number);
CREATE INDEX IF NOT EXISTS idx_manga_scenes_page_id ON manga_scenes(page_id);
CREATE INDEX IF NOT EXISTS idx_manga_scenes_created_at ON manga_scenes(created_at);
CREATE INDEX IF NOT EXISTS idx_audio_files_scene_id ON audio_files(scene_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_file_type ON audio_files(file_type);
CREATE INDEX IF NOT EXISTS idx_audio_files_character_name ON audio_files(character_name);
CREATE INDEX IF NOT EXISTS idx_audio_files_character_gender ON audio_files(character_gender);

-- Create audio_transcripts table (stores final transcript text per audio file)
CREATE TABLE IF NOT EXISTS audio_transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scene_id UUID NOT NULL REFERENCES public.manga_scenes(id) ON DELETE CASCADE,
  audio_file_id UUID NOT NULL REFERENCES public.audio_files(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('dialogue', 'ambient', 'narration', 'combined')),
  character_name VARCHAR(255),
  text TEXT NOT NULL,
  segments JSONB, -- optional word/time segments
  language VARCHAR(16),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure one transcript per audio_file
CREATE UNIQUE INDEX IF NOT EXISTS idx_audio_transcripts_audio_file_id ON audio_transcripts(audio_file_id);
CREATE INDEX IF NOT EXISTS idx_audio_transcripts_scene_id ON audio_transcripts(scene_id);
CREATE INDEX IF NOT EXISTS idx_audio_transcripts_file_type ON audio_transcripts(file_type);
CREATE INDEX IF NOT EXISTS idx_audio_transcripts_character_name ON audio_transcripts(character_name);

-- Create updated_at trigger for manga_scenes
-- Security Advisor: set a fixed search_path to avoid function hijacking via mutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger idempotently
DROP TRIGGER IF EXISTS update_manga_scenes_updated_at ON public.manga_scenes;
CREATE TRIGGER update_manga_scenes_updated_at
  BEFORE UPDATE ON public.manga_scenes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE manga_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_transcripts ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, allowing all operations - you may want to restrict this based on user authentication
DROP POLICY IF EXISTS "Allow all operations on manga_scenes" ON public.manga_scenes;
CREATE POLICY "Allow all operations on manga_scenes" ON public.manga_scenes
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on audio_files" ON public.audio_files;
CREATE POLICY "Allow all operations on audio_files" ON public.audio_files
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on audio_transcripts" ON public.audio_transcripts;
CREATE POLICY "Allow all operations on audio_transcripts" ON public.audio_transcripts
  FOR ALL USING (true);
