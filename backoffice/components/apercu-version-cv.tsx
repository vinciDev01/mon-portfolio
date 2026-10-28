"use client";

import { useEffect, useRef } from "react";
import { ApercuCv } from "@/components/apercu-cv";
import type { CvVersionDto } from "@portfolio/shared-types";

/**
 * Le CV d'une version, en grand, avant de le telecharger. Une fenetre par-dessus
 * la liste : Echap, un clic a cote ou « Fermer » la referment. Le focus va au
 * bouton de fermeture a l'ouverture et revient, a la fermeture, a l'element
 * qui l'avait ouverte.
 */
export function ApercuVersionCv({ version, onClose }: { version: CvVersionDto; onClose: () => void }) {
  const fermer = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null;
    fermer.current?.focus();
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", surTouche);
    return () => {
      window.removeEventListener("keydown", surTouche);
      precedent?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apercu-version-titre"
        className="flex h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-card p-5 shadow-lg"
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 id="apercu-version-titre" className="text-lg font-semibold">
              {version.nom}
            </h3>
            <p className="text-xs text-muted-foreground">
              {version.titrePoste ?? "Titre du poste des réglages du CV"} ·{" "}
              {version.langue === "en" ? "Anglais" : "Français"}
            </p>
          </div>
          <button
            ref={fermer}
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Fermer
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <ApercuCv versionCv={version.id} />
        </div>
      </div>
    </div>
  );
}
