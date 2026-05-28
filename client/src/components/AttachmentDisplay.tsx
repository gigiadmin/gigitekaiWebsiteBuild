import { Download, File, Image, FileText } from "lucide-react";

interface Attachment {
  id: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  createdAt: Date;
}

interface AttachmentDisplayProps {
  attachments: Attachment[];
}

export default function AttachmentDisplay({
  attachments,
}: AttachmentDisplayProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <Image className="w-4 h-4 text-[#00D4FF]" />;
    }
    if (fileType === "application/pdf") {
      return <FileText className="w-4 h-4 text-red-400" />;
    }
    return <File className="w-4 h-4 text-[#00D4FF]" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="mb-6">
      <h3 className="text-white font-bold text-sm mb-3">
        Attachments ({attachments.length})
      </h3>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between bg-[#0A0E1A] border border-[rgba(0,212,255,0.1)] rounded-lg p-3 hover:border-[rgba(0,212,255,0.3)] transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon(attachment.fileType)}
              <div className="min-w-0 flex-1">
                <p className="text-gray-300 text-sm truncate">
                  {attachment.fileName}
                </p>
                <p className="text-gray-500 text-xs">
                  {formatFileSize(attachment.fileSize)} •{" "}
                  {new Date(attachment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <a
              href={attachment.fileUrl}
              download={attachment.fileName}
              className="ml-2 p-2 text-gray-400 hover:text-[#00D4FF] transition-colors flex-shrink-0"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
