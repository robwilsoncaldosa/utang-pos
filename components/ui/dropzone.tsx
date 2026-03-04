"use client";

import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

type DropzoneProps = {
  onFilesAccepted: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
};

export function Dropzone({ onFilesAccepted, accept, maxSize, className }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept,
    maxSize,
    multiple: true,
    onDropAccepted: onFilesAccepted,
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
        <p className="text-sm font-medium text-foreground">Drag and drop images here</p>
        <p className="text-xs text-muted-foreground">or click to browse files</p>
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
