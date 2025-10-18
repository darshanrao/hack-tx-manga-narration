import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Upload, Book } from "lucide-react";
import { useState } from "react";

interface MangaSeries {
  id: string;
  title: string;
  coverImage?: string;
}

interface MangaLibraryProps {
  series: MangaSeries[];
  selectedSeriesId: string | null;
  onSeriesSelect: (id: string) => void;
  onUpload: (files: FileList) => void;
}

export function MangaLibrary({
  series,
  selectedSeriesId,
  onSeriesSelect,
  onUpload,
}: MangaLibraryProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpload(e.target.files);
    }
  };

  return (
    <div className="h-full flex flex-col border-r-4 border-border bg-background" role="navigation" aria-label="Manga library navigation">
      <div className="p-6 border-b-4 border-border">
        <h2>Manga Library</h2>
        <label htmlFor="file-upload">
          <Button
            className="w-full mt-4 h-12"
            variant="outline"
            size="lg"
            onClick={() => document.getElementById("file-upload")?.click()}
            aria-label="Upload manga files. Press Enter to select files."
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload Manga
          </Button>
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*,.cbz,.cbr,.zip"
          onChange={handleFileInput}
          className="hidden"
          aria-label="File upload input"
        />
      </div>

      <div
        className={`flex-1 transition-colors ${
          isDragging ? "bg-accent" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ScrollArea className="h-full">
          <div className="p-3" role="list" aria-label="Manga series list. Use arrow keys to navigate.">
            {series.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Upload className="mx-auto h-16 w-16 mb-3 opacity-50" />
                <p>No manga uploaded</p>
                <p className="mt-2">
                  Upload files or drag and drop
                </p>
              </div>
            ) : (
              series.map((manga) => (
                <Button
                  key={manga.id}
                  variant={selectedSeriesId === manga.id ? "secondary" : "ghost"}
                  className="w-full justify-start mb-2 h-auto py-4 px-4 focus:ring-4 focus:ring-primary/50 focus:outline-none"
                  onClick={() => onSeriesSelect(manga.id)}
                  aria-label={`${manga.title}. ${selectedSeriesId === manga.id ? "Currently selected" : "Press Enter to select"}`}
                  aria-current={selectedSeriesId === manga.id ? "true" : "false"}
                  role="listitem"
                >
                  <Book className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="text-left">{manga.title}</span>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
