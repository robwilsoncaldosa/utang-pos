"use client";

import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

type DropzoneProps = {
  onFilesAccepted: (files: File[]) => void;
  onFilesRejected?: (rejections: FileRejection[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  title?: string;
  description?: string;
  className?: string;
};

export function Dropzone({
  onFilesAccepted,
  onFilesRejected,
  accept,
  maxSize,
  maxFiles,
  title = "Drag and drop files here",
  description = "or click to browse files",
  className,
}: DropzoneProps) {
  const allowMultiple = typeof maxFiles === "number" ? maxFiles > 1 : true;
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept,
    maxSize,
    maxFiles,
    multiple: allowMultiple,
    onDropAccepted: onFilesAccepted,
    onDropRejected: onFilesRejected,
  });

  const rejectionMessages = fileRejections.map((rejection: FileRejection) =>
    rejection.errors.map((err) => err.message).join(", ")
  );

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition",
          isDragActive ? "border-primary bg-primary/5" : "border-border"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {rejectionMessages.length > 0 && (
        <div className="mt-2 text-xs text-destructive">
          {rejectionMessages.map((message, index) => (
            <p key={`${message}-${index}`}>{message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
