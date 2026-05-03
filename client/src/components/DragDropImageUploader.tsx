/**
 * DragDropImageUploader — drag-and-drop or click-to-browse image upload
 * Uploads to S3 via tRPC blog.uploadImage procedure.
 * Calls onUploaded(url) when the image is ready.
 */

import { useCallback, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, ImageIcon, Loader2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DragDropImageUploaderProps {
  onUploaded: (url: string) => void;
  onCancel?: () => void;
  /** If provided, shows a current image preview */
  currentUrl?: string | null;
}

const MAX_SIZE_MB = 5;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function DragDropImageUploader({
  onUploaded,
  onCancel,
  currentUrl,
}: DragDropImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const uploadImage = trpc.blog.uploadImage.useMutation({
    onSuccess: ({ url }) => {
      setPreview(url);
      setUploaded(true);
      setUploading(false);
      onUploaded(url);
      toast.success("Image uploaded successfully");
    },
    onError: (err) => {
      setUploading(false);
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  const processFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        toast.error("Only JPEG, PNG, WebP, and GIF images are supported");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`Image must be under ${MAX_SIZE_MB} MB`);
        return;
      }
      // Local preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload via tRPC (base64 encoded)
      setUploading(true);
      setUploaded(false);
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      uploadImage.mutate({
        base64,
        mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
        fileName: file.name,
      });
    },
    [uploadImage]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
          ${dragging
            ? "border-[#00D4FF] bg-[#00D4FF]/10"
            : "border-[rgba(0,212,255,0.3)] hover:border-[#00D4FF]/60 bg-[#0A0E1A]"
          }`}
        style={{ minHeight: "160px" }}
      >
        {preview ? (
          /* Image preview */
          <div className="relative w-full h-48">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover" loading="lazy"
            />
            {/* Overlay during upload */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#00D4FF]" size={32} />
              </div>
            )}
            {/* Success badge */}
            {uploaded && (
              <div className="absolute top-2 right-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> Uploaded
              </div>
            )}
            {/* Clear button */}
            {!uploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  setUploaded(false);
                }}
                className="absolute top-2 left-2 bg-black/70 hover:bg-black text-white rounded-full p-1 transition-colors"
                title="Remove image"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            {uploading ? (
              <>
                <Loader2 className="animate-spin text-[#00D4FF] mb-3" size={32} />
                <p className="text-gray-400 text-sm">Uploading…</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center mb-3">
                  <Upload className="text-[#00D4FF]" size={20} />
                </div>
                <p className="text-white font-medium text-sm mb-1">
                  {dragging ? "Drop image here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-gray-500 text-xs">
                  JPEG, PNG, WebP, GIF — max {MAX_SIZE_MB} MB
                </p>
              </>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
        )}
        {!preview && (
          <Button
            type="button"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] border border-[#00D4FF]/30"
          >
            <ImageIcon size={14} className="mr-1.5" />
            Browse Files
          </Button>
        )}
      </div>
    </div>
  );
}
