import { Upload, X, File } from "lucide-react";
import { useRef } from "react";

interface FileUploadAreaProps {
  attachments: File[];
  onFilesAdded: (files: File[]) => void;
  onFileRemoved: (index: number) => void;
  dragActive: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function FileUploadArea({
  attachments,
  onFilesAdded,
  onFileRemoved,
  dragActive,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* File Upload Area */}
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-4 mb-3 transition-colors ${
          dragActive
            ? "border-[#00D4FF] bg-[#00D4FF]/5"
            : "border-[rgba(0,212,255,0.2)] bg-[#0A0E1A]/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && onFilesAdded(Array.from(e.target.files))}
          className="hidden"
          accept="image/jpeg,image/png,image/gif,application/pdf,text/plain"
        />
        <div className="flex flex-col items-center justify-center cursor-pointer">
          <Upload className="w-6 h-6 text-[#00D4FF] mb-2" />
          <p className="text-gray-300 text-sm font-medium">
            Drag files here or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[#00D4FF] hover:underline"
            >
              click to browse
            </button>
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Max 10MB per file. Allowed: JPG, PNG, GIF, PDF, TXT
          </p>
        </div>
      </div>

      {/* Attached Files List */}
      {attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-gray-300 text-sm font-medium">
            Attachments ({attachments.length})
          </p>
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-[#0A0E1A] border border-[rgba(0,212,255,0.1)] rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-[#00D4FF]" />
                <div>
                  <p className="text-gray-300 text-sm">{file.name}</p>
                  <p className="text-gray-500 text-xs">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onFileRemoved(index)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
