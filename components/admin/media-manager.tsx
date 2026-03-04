"use client";

import { useEffect, useMemo, useState } from "react";
import { Dropzone } from "@/components/ui/dropzone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type UploadedItem = {
  id: string;
  url: string;
  thumbnails: { sm: string; md: string; lg: string };
};

type GalleryItem = {
  name: string;
  url: string;
  size: number;
};

type MediaManagerProps = {
  csrfToken: string;
};

export function MediaManager({ csrfToken }: MediaManagerProps) {
  const [uploads, setUploads] = useState<UploadedItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [eta, setEta] = useState<Record<string, string>>({});

  const selectedCount = selected.size;

  const loadGallery = async () => {
    const res = await fetch("/api/admin/uploads");
    const json = await res.json();
    setGallery(json.items ?? []);
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleFilesAccepted = (files: File[]) => {
    files.forEach((file) => {
      const id = `${file.name}-${file.size}-${file.lastModified}`;
      const xhr = new XMLHttpRequest();
      const start = Date.now();
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress((prev) => ({ ...prev, [id]: percent }));
        const elapsed = (Date.now() - start) / 1000;
        const rate = event.loaded / Math.max(elapsed, 1);
        const remaining = event.total - event.loaded;
        const seconds = Math.ceil(remaining / Math.max(rate, 1));
        setEta((prev) => ({ ...prev, [id]: `${seconds}s` }));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText) as { items: UploadedItem[] };
          setUploads((prev) => [...response.items, ...prev]);
          toast.success("Upload complete", { duration: 5000 });
          loadGallery();
        } else {
          toast.error("Upload failed", { duration: 5000 });
        }
      };
      xhr.onerror = () => toast.error("Upload failed", { duration: 5000 });
      const formData = new FormData();
      formData.append("files", file);
      xhr.open("POST", "/api/admin/uploads");
      xhr.setRequestHeader("x-csrf-token", csrfToken);
      xhr.send(formData);
    });
  };

  const toggleSelection = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const bulkUrls = useMemo(
    () => gallery.filter((item) => selected.has(item.name)),
    [gallery, selected]
  );

  return (
    <div className="flex flex-col gap-6">
      <Dropzone
        onFilesAccepted={handleFilesAccepted}
        accept={{ "image/jpeg": [], "image/png": [], "image/webp": [] }}
        maxSize={10 * 1024 * 1024}
      />

      {Object.keys(progress).length > 0 && (
        <div className="grid gap-2">
          {Object.entries(progress).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">{key}</span>
              <span>
                {value}% {eta[key] ? `· ${eta[key]}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Image Gallery</h3>
          <p className="text-xs text-muted-foreground">
            {gallery.length} assets · {selectedCount} selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearSelection} disabled={selectedCount === 0}>
            Clear selection
          </Button>
          <Button
            size="sm"
            disabled={selectedCount === 0}
            onClick={() => {
              toast.success(`Selected ${selectedCount} item(s)`, { duration: 5000 });
            }}
          >
            Bulk select
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {gallery.map((item) => (
          <button
            key={item.name}
            type="button"
            className="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-2 text-left"
            onClick={() => setZoom(item.url)}
          >
            <img
              src={item.url}
              alt={item.name}
              loading="lazy"
              className="h-32 w-full rounded-md object-cover"
            />
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">{item.name}</span>
              <Checkbox
                checked={selected.has(item.name)}
                onCheckedChange={() => toggleSelection(item.name)}
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!zoom} onOpenChange={(open) => !open && setZoom(null)}>
        <DialogContent className="max-w-4xl">
          {zoom && (
            <img src={zoom} alt="Preview" className="max-h-[80vh] w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>

      {uploads.length > 0 && (
        <div className="grid gap-2">
          <h4 className="text-sm font-semibold text-foreground">Recent uploads</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {uploads.map((item) => (
              <img
                key={item.id}
                src={item.thumbnails.md}
                alt={item.id}
                className="h-24 w-full rounded-md object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {bulkUrls.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Selected items:
          <ul className="mt-2 grid gap-1">
            {bulkUrls.map((item) => (
              <li key={item.name}>{item.url}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
