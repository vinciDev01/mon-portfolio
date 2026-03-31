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

export function ImageUpload({ currentPath, category, onUpload, label = "Image" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview || getFileUrl(currentPath);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const path = await uploadFile(file, category);
      onUpload(path);
      toast.success("Fichier uploadé");
    } catch {
      toast.error("Erreur lors de l'upload");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center min-h-[120px]"
      >
        {displayUrl ? (
          <img src={displayUrl} alt={label} className="max-h-32 object-contain" />
        ) : (
          <span className="text-muted-foreground text-sm">
            {uploading ? "Upload en cours..." : "Cliquez pour sélectionner"}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
