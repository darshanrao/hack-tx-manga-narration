import { useState } from "react";
import { Upload, File } from "lucide-react";
import { Button } from "./ui/button";

interface UploadAreaProps {
  onFileUpload: (file: File) => void;
  uploadedFileName?: string;
}

export function UploadArea({ onFileUpload, uploadedFileName }: UploadAreaProps) {
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
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <div
        className={`w-full max-w-2xl border-4 border-dashed rounded-2xl p-16 transition-all duration-200 ${
          isDragging
            ? "border-primary bg-primary/5 scale-105"
            : "border-border bg-muted/30"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          {uploadedFileName ? (
            <>
              <File className="h-20 w-20 text-primary" />
              <div>
                <h3 className="text-primary mb-2">File Loaded</h3>
                <p className="text-muted-foreground mb-6">{uploadedFileName}</p>
                <label htmlFor="file-input">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    Upload Different File
                  </Button>
                </label>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-20 w-20 text-muted-foreground" />
              <div>
                <h3 className="mb-2">Drop your manga file here</h3>
                <p className="text-muted-foreground mb-6">
                  or click to browse
                </p>
                <label htmlFor="file-input">
                  <Button
                    size="lg"
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    Choose File
                  </Button>
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                Supports: Images, PDF, CBZ, CBR
              </p>
            </>
          )}
        </div>
      </div>
      
      <input
        id="file-input"
        type="file"
        accept="image/*,.pdf,.cbz,.cbr"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}
