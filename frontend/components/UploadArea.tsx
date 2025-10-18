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
    <div className="h-full flex flex-col items-center justify-center p-12 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
      </div>
      
      <div
        className={`relative w-full max-w-3xl border-2 border-dashed rounded-3xl p-20 transition-all duration-300 backdrop-blur-sm ${
          isDragging
            ? "border-blue-400 bg-blue-50/80 scale-105 shadow-2xl shadow-blue-500/20"
            : "border-slate-300/50 bg-white/60 hover:border-blue-300 hover:bg-white/80 hover:shadow-xl hover:shadow-blue-500/10"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center text-center space-y-8">
          {uploadedFileName ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-lg opacity-30"></div>
                <File className="relative h-24 w-24 text-green-600 drop-shadow-lg" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  File Loaded Successfully
                </h3>
                <p className="text-slate-600 font-medium text-lg">{uploadedFileName}</p>
                <label htmlFor="file-input">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => document.getElementById("file-input")?.click()}
                    className="bg-white/80 backdrop-blur-sm border-slate-300 hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all duration-200 shadow-lg"
                  >
                    Upload Different File
                  </Button>
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
                <Upload className="relative h-24 w-24 text-slate-500 drop-shadow-lg animate-float" />
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                    Drop your manga file here
                  </h3>
                  <p className="text-slate-500 text-lg font-medium">
                    or click to browse your files
                  </p>
                </div>
                <label htmlFor="file-input">
                  <Button
                    size="lg"
                    onClick={() => document.getElementById("file-input")?.click()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 animate-glow"
                  >
                    Choose File
                  </Button>
                </label>
                <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-500">
                  <span className="px-3 py-1 bg-slate-100 rounded-full">Images</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full">PDF</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full">CBZ</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full">CBR</span>
                </div>
              </div>
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

