"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dropzone } from "@/components/ui/dropzone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { FileRejection } from "react-dropzone";
import { Check, ChevronDown, Image as ImageIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type UploadedItem = {
  id: string;
  name: string;
  path: string;
  url: string;
  bucket: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

type UploadStatus = "queued" | "uploading" | "retrying" | "failed" | "completed";

type UploadTask = {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  eta: string;
  attempts: number;
  error: string | null;
  previewUrl: string | null;
};

type MediaManagerProps = {
  csrfToken?: string;
  table: string;
  targetField: string;
  bucket: string;
  allowedTypes: string[];
  maxSize: number;
  maxFiles: number;
  onSelectAsset?: (asset: { url: string; name: string }) => void;
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPreviewable(mime: string) {
  return mime.startsWith("image/");
}

function humanizeAssetName(name: string) {
  const segments = name.split("/");
  const baseName = segments[segments.length - 1] ?? name;
  return baseName.replace(/^[0-9a-f]{8}-[0-9a-f-]{27,}-/i, "");
}

type UploadResponse = {
  items?: UploadedItem[];
  failed?: Array<{ name: string; reason: string }>;
  error?: string;
};

export function MediaManager({
  csrfToken,
  table,
  targetField,
  bucket,
  allowedTypes,
  maxSize,
  maxFiles,
  onSelectAsset,
}: MediaManagerProps) {
  const [csrf, setCsrf] = useState(csrfToken ?? "");
  const [uploadHistory, setUploadHistory] = useState<UploadedItem[]>([]);
  const [gallery, setGallery] = useState<UploadedItem[]>([]);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [zoom, setZoom] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  const historyKey = `admin-upload-history:${table}:${targetField}`;
  const selectedCount = selectedPath ? 1 : 0;
  const acceptedTypes = useMemo(
    () => Object.fromEntries(allowedTypes.map((mime) => [mime, []])),
    [allowedTypes]
  );

  const loadGallery = useCallback(async () => {
    setIsLoadingGallery(true);
    setGalleryError(null);
    try {
      const params = new URLSearchParams({ table, targetField });
      const res = await fetch(`/api/admin/uploads?${params.toString()}`, { cache: "no-store" });
      const json = (await res.json()) as { items?: UploadedItem[]; csrfToken?: string; error?: string };
      if (!res.ok) {
        const message = json.error ?? "Failed to load uploaded files";
        setGalleryError(message);
        toast.error(message);
        return;
      }
      if (json.csrfToken) {
        setCsrf(json.csrfToken);
      }
      setGallery(json.items ?? []);
    } catch {
      setGalleryError("Failed to load uploaded files");
      toast.error("Failed to load uploaded files");
    } finally {
      setIsLoadingGallery(false);
    }
  }, [table, targetField]);

  useEffect(() => {
    void loadGallery();
  }, [loadGallery]);

  useEffect(() => {
    const raw = localStorage.getItem(historyKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as UploadedItem[];
      setUploadHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setUploadHistory([]);
    }
  }, [historyKey]);

  useEffect(() => {
    localStorage.setItem(historyKey, JSON.stringify(uploadHistory.slice(0, 50)));
  }, [historyKey, uploadHistory]);

  const uploadSingleFile = async (taskId: string, file: File): Promise<UploadedItem> => {
    const response = await new Promise<UploadResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const start = Date.now();
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? { ...task, progress: percent } : task))
        );
        const elapsed = (Date.now() - start) / 1000;
        const rate = event.loaded / Math.max(elapsed, 1);
        const remaining = event.total - event.loaded;
        const seconds = Math.ceil(remaining / Math.max(rate, 1));
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? { ...task, eta: `${seconds}s` } : task))
        );
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText || "{}") as UploadResponse;
          resolve(json);
        } catch {
          reject(new Error("Invalid upload response"));
        }
      };
      const formData = new FormData();
      formData.append("table", table);
      formData.append("targetField", targetField);
      formData.append("files", file);
      xhr.open("POST", "/api/admin/uploads");
      xhr.setRequestHeader("x-csrf-token", csrf);
      xhr.send(formData);
    });
    const uploadedItem = response.items?.[0];
    if (!uploadedItem) {
      const failedReason = response.failed?.[0]?.reason ?? response.error ?? "Upload failed";
      throw new Error(failedReason);
    }
    return uploadedItem;
  };

  const processTask = async (taskId: string, file: File) => {
    if (!csrf) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: "failed", error: "Missing CSRF token", eta: "—" } : task
        )
      );
      toast.error(`${file.name}: Missing CSRF token`);
      return;
    }
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, status: attempt === 1 ? "uploading" : "retrying", attempts: attempt, error: null }
            : task
        )
      );
      try {
        const uploaded = await uploadSingleFile(taskId, file);
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, status: "completed", progress: 100, eta: "0s", error: null }
              : task
          )
        );
        setUploadHistory((prev) => [uploaded, ...prev.filter((item) => item.path !== uploaded.path)]);
        setGallery((prev) => [uploaded, ...prev.filter((item) => item.path !== uploaded.path)]);
        setSelectedPath(uploaded.path);
        onSelectAsset?.({ url: uploaded.url, name: humanizeAssetName(uploaded.name) });
        toast.success(`Uploaded ${uploaded.name}`);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        if (attempt < 3) {
          setTasks((prev) =>
            prev.map((task) => (task.id === taskId ? { ...task, error: message } : task))
          );
          await wait(700 * attempt);
          continue;
        }
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: "failed", error: message, eta: "—" } : task
          )
        );
        toast.error(`${file.name}: ${message}`);
      }
    }
  };

  const handleFilesAccepted = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const id = `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
    const task: UploadTask = {
      id,
      file,
      status: "queued",
      progress: 0,
      eta: "—",
      attempts: 0,
      error: null,
      previewUrl: isPreviewable(file.type) ? URL.createObjectURL(file) : null,
    };
    setTasks((prev) => [task, ...prev].slice(0, 50));
    void processTask(task.id, task.file);
  };

  const handleFilesRejected = (rejections: FileRejection[]) => {
    if (rejections.length === 0) return;
    const errors = rejections.flatMap((item) => item.errors.map((error) => error.code));
    if (errors.includes("file-invalid-type")) {
      toast.error("Only JPG, PNG, GIF, and WebP images are allowed.");
      return;
    }
    if (errors.includes("too-many-files")) {
      toast.error("Only one image can be selected.");
      return;
    }
    if (errors.includes("file-too-large")) {
      toast.error(`Image must be ${(maxSize / (1024 * 1024)).toFixed(0)}MB or smaller.`);
      return;
    }
    const message = rejections
      .flatMap((item) => item.errors.map((error) => `${item.file.name}: ${error.message}`))
      .slice(0, 2)
      .join(" | ");
    toast.error(message || "Image was rejected");
  };

  const retryTask = (task: UploadTask) => {
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, status: "queued", progress: 0, eta: "—", error: null } : item))
    );
    void processTask(task.id, task.file);
  };

  const clearSelection = () => setSelectedPath("");
  const selectedItem = gallery.find((item) => item.path === selectedPath);
  const latestUploads = tasks.filter((task) => task.status !== "completed").slice(0, 12);

  useEffect(() => {
    setSelectedPath((prev) => (gallery.some((item) => item.path === prev) ? prev : ""));
  }, [gallery]);

  return (
    <div className="flex flex-col gap-6">
      <Dropzone
        onFilesAccepted={handleFilesAccepted}
        onFilesRejected={handleFilesRejected}
        accept={acceptedTypes}
        maxSize={maxSize}
        maxFiles={maxFiles}
        title={maxFiles === 1 ? `Upload one image to ${bucket}` : `Upload images to ${bucket}`}
        description={`JPG, PNG, GIF, WebP · ${maxFiles === 1 ? "single image only" : `up to ${maxFiles} images`} · up to ${formatBytes(maxSize)}`}
      />

      {latestUploads.length > 0 && (
        <div className="grid gap-2">
          {latestUploads.map((task) => (
            <div key={task.id} className="rounded-md border p-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate">{task.file.name}</span>
                <span className="text-muted-foreground">
                  {task.progress}% {task.eta !== "—" ? `· ${task.eta}` : ""}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded bg-muted">
                <div className="h-1.5 rounded bg-primary transition-all" style={{ width: `${task.progress}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">
                  {task.status === "retrying" ? `Retrying (${task.attempts}/3)` : task.status}
                </span>
                {task.status === "failed" ? (
                  <Button size="sm" variant="outline" onClick={() => retryTask(task)}>
                    Retry
                  </Button>
                ) : null}
              </div>
              {task.error ? (
                <p className="mt-1 text-destructive">{task.error}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Uploaded Files</h3>
          <p className="text-xs text-muted-foreground">
            {gallery.length} assets · {selectedCount} selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadGallery()}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection} disabled={selectedCount === 0}>
            Clear selection
          </Button>
          <Button
            size="sm"
            disabled={!selectedItem || !onSelectAsset}
            onClick={() => {
              if (!onSelectAsset || !selectedItem) return;
              onSelectAsset({ url: selectedItem.url, name: humanizeAssetName(selectedItem.name) });
              toast.success(`Applied ${humanizeAssetName(selectedItem.name)}`);
            }}
          >
            Use selected
          </Button>
        </div>
      </div>

      <div className="grid gap-2 rounded-md border p-3">
        <label className="text-xs font-medium">Select uploaded image</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full justify-between px-3 font-normal"
              disabled={isLoadingGallery || !!galleryError || gallery.length === 0}
            >
              <span className="flex min-w-0 items-center gap-2">
                {selectedItem?.url ? (
                  <img
                    src={selectedItem.url}
                    alt={humanizeAssetName(selectedItem.name)}
                    className="h-6 w-6 rounded object-cover"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                )}
                <span className="truncate">
                  {isLoadingGallery
                    ? "Loading uploaded images..."
                    : galleryError
                      ? "Unable to load uploaded images"
                      : selectedItem
                        ? humanizeAssetName(selectedItem.name)
                        : "Choose an uploaded image"}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
          >
            {gallery.map((item) => (
              <DropdownMenuItem
                key={item.path}
                onSelect={() => {
                  setSelectedPath(item.path);
                  onSelectAsset?.({ url: item.url, name: humanizeAssetName(item.name) });
                }}
              >
                <span className="flex flex-1 items-center gap-2">
                  {isPreviewable(item.mimeType) ? (
                    <img src={item.url} alt={humanizeAssetName(item.name)} className="h-6 w-6 rounded object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  )}
                  <span className="truncate">{humanizeAssetName(item.name)}</span>
                </span>
                {selectedPath === item.path ? <Check className="h-4 w-4" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {galleryError ? <p className="text-xs text-destructive">{galleryError}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {gallery.map((item) => (
          <div
            key={item.path}
            className={cn(
              "group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-2 text-left",
              selectedPath === item.path && "ring-2 ring-primary"
            )}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedPath(item.path);
                onSelectAsset?.({ url: item.url, name: humanizeAssetName(item.name) });
              }}
              className="text-left"
            >
              {isPreviewable(item.mimeType) ? (
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  className="h-32 w-full rounded-md object-cover"
                />
              ) : (
                <div className="flex h-32 w-full items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                  {item.mimeType || "File"}
                </div>
              )}
            </button>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">{humanizeAssetName(item.name)}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setZoom(item.url)}>
                Preview
              </Button>
            </div>
            <p className="truncate text-[10px] text-muted-foreground">{formatBytes(item.size)}</p>
          </div>
        ))}
      </div>

      <Dialog open={!!zoom} onOpenChange={(open) => !open && setZoom(null)}>
        <DialogContent className="max-w-4xl">
          {zoom && (
            <img src={zoom} alt="Preview" className="max-h-[80vh] w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>

      {uploadHistory.length > 0 && (
        <div className="grid gap-2">
          <h4 className="text-sm font-semibold text-foreground">Upload history</h4>
          <div className="grid gap-2">
            {uploadHistory.slice(0, 8).map((item) => (
              <div key={item.path} className="flex items-center justify-between rounded-md border p-2 text-xs">
                <span className="truncate">{humanizeAssetName(item.name)}</span>
                <span>
                  {formatBytes(item.size)}
                  {item.uploadedAt ? ` · ${new Date(item.uploadedAt).toLocaleString()}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.some((task) => task.previewUrl) ? (
        <div className="grid gap-2">
          <h4 className="text-sm font-semibold text-foreground">Local previews</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tasks
              .filter((task) => task.previewUrl)
              .slice(0, 8)
              .map((task) => (
                <img
                  key={task.id}
                  src={task.previewUrl ?? ""}
                  alt={task.file.name}
                  className="h-24 w-full rounded-md object-cover"
                />
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
