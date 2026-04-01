"use client";

import { useState, useRef } from "react";
import { uploadFile, getFileUrl } from "@/lib/api";
import { toast } from "sonner";

interface ImageUploadProps {
  currentPath: string | null;
  category: string;
  onUpload: (path: string) => void;
  label?: string;
}

function isExternalUrl(path: string | null): boolean {
  if (!path) return false;
  return path.startsWith("http://") || path.startsWith("https://");
}

export function ImageUpload({ currentPath, category, onUpload, label = "Image" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urlValue, setUrlValue] = useState(isExternalUrl(currentPath) ? currentPath ?? "" : "");
  const [urlError, setUrlError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview || getFileUrl(currentPath);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const path = await uploadFile(file, category);
      onUpload(path);
      setUrlValue("");
      toast.success("Fichier uploade");
    } catch {
      toast.error("Erreur lors de l'upload");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleUrlChange(value: string) {
    setUrlValue(value);
    setUrlError(false);

    if (!value.trim()) {
      setPreview(null);
      return;
    }

    // Live preview if it looks like a URL
    if (value.startsWith("http://") || value.startsWith("https://")) {
      setPreview(value.trim());
      onUpload(value.trim());
    }
  }

  function handleImageError() {
    if (urlValue && preview === urlValue) {
      setUrlError(true);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>

      {/* Preview zone */}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center min-h-[120px] relative"
      >
        {displayUrl && !urlError ? (
          <img
            src={displayUrl}
            alt={label}
            className="max-h-32 object-contain"
            onError={handleImageError}
          />
        ) : (
          <span className="text-muted-foreground text-sm">
            {uploading ? "Upload en cours..." : urlError ? "Image introuvable" : "Cliquez pour uploader"}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* URL input — always visible */}
      <div className="mt-2">
        <input
          type="url"
          value={urlValue}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="Ou coller une URL d'image (ex: https://...)"
          className={`w-full px-3 py-1.5 border rounded-md text-sm ${urlError ? "border-red-400" : "border-border"}`}
        />
        {urlError && (
          <p className="text-xs text-red-500 mt-0.5">URL invalide ou image inaccessible</p>
        )}
      </div>
    </div>
  );
}
