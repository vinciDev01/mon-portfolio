"use client";

import { useEffect, useId, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Le libelle du bouton de confirmation ; « Supprimer » par defaut. */
  confirmLabel?: string;
}

/**
 * Une fenetre de confirmation par-dessus la page. Le focus va a « Annuler » a
 * l'ouverture : Entree par megarde n'execute pas l'action. Echap ou un clic a
 * cote annulent ; a la fermeture, le focus revient a l'element qui l'avait
 * ouverte.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Supprimer",
}: ConfirmDialogProps) {
  const annuler = useRef<HTMLButtonElement>(null);
  const idTitre = useId();
  const idMessage = useId();
  // La derniere fonction recue : les pages la passent souvent en ligne, et
  // la fenetre ne doit pas reprendre le focus a chaque rendu de la page.
  const surAnnuler = useRef(onCancel);
  useEffect(() => {
    surAnnuler.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;
    const precedent = document.activeElement as HTMLElement | null;
    annuler.current?.focus();
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") surAnnuler.current();
    };
    window.addEventListener("keydown", surTouche);
    return () => {
      window.removeEventListener("keydown", surTouche);
      precedent?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        aria-describedby={idMessage}
        className="bg-card rounded-lg shadow-lg p-6 max-w-sm w-full mx-4"
      >
        <h3 id={idTitre} className="text-lg font-semibold mb-2">
          {title}
        </h3>
        <p id={idMessage} className="text-sm text-muted-foreground mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            ref={annuler}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-md bg-destructive text-white hover:bg-destructive/90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
