"use client";

import { useState } from "react";
import { uploadFile, getFileUrl } from "@/lib/api";
import { toast } from "sonner";
import { ZoneDepot } from "@/components/zone-depot";

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

  const displayUrl = preview || getFileUrl(currentPath);

  async function handleFile(file: File) {
    setUrlError(false);
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
    // Un seul parametre pour la recherche des pages, fichier et URL compris.
    <div data-param="">
      <ZoneDepot
        label={label}
        accept="image/*"
        envoi={uploading}
        onFichier={(f) => void handleFile(f)}
        refus="Seules les images sont acceptées"
        rempli={Boolean(displayUrl && !urlError)}
        apercu={
          displayUrl && !urlError ? (
            <img
              src={displayUrl}
              alt=""
              className="h-20 w-20 shrink-0 rounded-md border border-border object-contain bg-muted/40"
              onError={handleImageError}
            />
          ) : undefined
        }
        titre={
          urlError
            ? "Image introuvable"
            : displayUrl
              ? "Image en place"
              : "Glissez une image ici ou cliquez pour choisir"
        }
        detail={displayUrl && !urlError ? "Cliquez ou glissez une autre image pour la remplacer" : "Elle sera convertie en WebP"}
      />

      {/* URL input - always visible */}
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
