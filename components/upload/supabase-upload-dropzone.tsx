"use client";

import { useMemo, useState } from "react";
import { Dropzone } from "@/components/ui/dropzone";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type UploadedItem = {
  fileName: string;
  path: string;
  publicUrl: string;
  mimeType: string;
  size: number;
};

type UploadApiResponse = {
  uploaded?: UploadedItem[];
  failed?: Array<{ fileName: string; error: string }>;
  publicUrl?: string;
  error?: string;
};

type UploadTask = {
  id: string;
  name: string;
  progress: number;
  status: "queued" | "uploading" | "completed" | "failed";
  error: string | null;
};

type SupabaseUploadDropzoneProps = {
  endpoint?: string;
  productId?: string;
  maxFileSizeBytes?: number;
  maxFiles?: number;
  allowedMimeTypes?: string[];
  onUploaded?: (files: UploadedItem[]) => void;
};

export function SupabaseUploadDropzone({
  endpoint = "/api/upload",
  productId,
  maxFileSizeBytes = 7 * 1024 * 1024,
  maxFiles = 5,
  allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  onUploaded,
}: SupabaseUploadDropzoneProps) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const accept = useMemo(
    () => Object.fromEntries(allowedMimeTypes.map((mime) => [mime, []])),
    [allowedMimeTypes]
  );

  const updateTask = (id: string, patch: Partial<UploadTask>) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  };

  const uploadSingleFile = async (taskId: string, file: File) => {
    const response = await new Promise<UploadApiResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const progress = Math.round((event.loaded / event.total) * 100);
        updateTask(taskId, { progress, status: "uploading" });
      };
      xhr.onerror = () => reject(new Error("Network error while uploading file"));
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText || "{}") as UploadApiResponse;
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(json);
            return;
          }
          reject(new Error(json.error ?? "Upload request failed"));
        } catch {
          reject(new Error("Invalid server response"));
        }
      };
      const formData = new FormData();
      formData.append("files", file);
      if (productId) {
        formData.append("productId", productId);
      }
      xhr.open("POST", endpoint);
      xhr.send(formData);
    });
    const uploadedItem = response.uploaded?.[0];
    if (!uploadedItem) {
      throw new Error(response.failed?.[0]?.error ?? response.error ?? "Upload failed");
    }
    return uploadedItem;
  };

  const handleAcceptedFiles = async (files: File[]) => {
    const selected = files.slice(0, maxFiles);
    const queued = selected.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      progress: 0,
      status: "queued" as const,
      error: null,
    }));
    setTasks(queued);
    setIsUploading(true);

    const uploadedItems: UploadedItem[] = [];
    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index];
      const task = queued[index];
      try {
        const uploaded = await uploadSingleFile(task.id, file);
        uploadedItems.push(uploaded);
        updateTask(task.id, { progress: 100, status: "completed", error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        updateTask(task.id, { status: "failed", error: message });
      }
    }

    setIsUploading(false);
    if (uploadedItems.length) {
      onUploaded?.(uploadedItems);
      toast.success(`Uploaded ${uploadedItems.length} file${uploadedItems.length > 1 ? "s" : ""}`);
    } else {
      toast.error("No files were uploaded");
    }
  };

  const reset = () => {
    setTasks([]);
    setIsUploading(false);
  };

  return (
    <div className="grid gap-4">
      <Dropzone
        onFilesAccepted={handleAcceptedFiles}
        accept={accept}
        maxSize={maxFileSizeBytes}
        maxFiles={maxFiles}
        title="Drag and drop files to upload"
        description={`Allowed: ${allowedMimeTypes.join(", ")} · Max ${(maxFileSizeBytes / (1024 * 1024)).toFixed(0)}MB`}
      />

      {tasks.length > 0 ? (
        <div className="grid gap-2">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-md border p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{task.name}</span>
                <span className="text-muted-foreground">{task.progress}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded bg-muted">
                <div className="h-1.5 rounded bg-primary transition-all" style={{ width: `${task.progress}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-between text-muted-foreground">
                <span>{task.status}</span>
                {task.error ? <span className="text-destructive">{task.error}</span> : null}
              </div>
            </div>
          ))}
          <div>
            <Button type="button" variant="outline" size="sm" onClick={reset} disabled={isUploading}>
              Clear uploads
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
