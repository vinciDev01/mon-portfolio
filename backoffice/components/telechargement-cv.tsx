"use client";

import { useState } from "react";
import { toast } from "sonner";
import { appelerApi } from "@/lib/api";

/**
 * Telechargement du CV depuis le backoffice.
 *
 * Ces routes sont reservees a l'administrateur : un simple lien ne suffit pas,
 * il faut porter le jeton. On recupere donc le fichier par fetch, puis on
 * declenche l'enregistrement depuis le blob obtenu.
 */
function nomDepuisEnTete(entete: string | null, repli: string): string {
  const m = entete?.match(/filename="([^"]+)"/);
  return m ? m[1] : repli;
}

/** Une page cornee et l'etiquette du format, dans sa couleur d'usage :
 *  rouge pour le PDF, bleu pour Word. Decorative, le texte du bouton dit
 *  deja le format. */
function IconeFormat({ format }: { format: "PDF" | "DOC" }) {
  const couleur = format === "PDF" ? "#b91c1c" : "#1d4ed8";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 shrink-0" fill="none">
      <path
        d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        className="text-muted-foreground"
      />
      <path d="M14 2.5V8h5.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" className="text-muted-foreground" />
      <rect x="2" y="11.5" width="15" height="7" rx="1.2" fill={couleur} />
      <text
        x="9.5"
        y="16.6"
        textAnchor="middle"
        fontSize="5.2"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="#fff"
      >
        {format}
      </text>
    </svg>
  );
}

export function TelechargementCv() {
  const [enCours, setEnCours] = useState<string | null>(null);

  async function telecharger(chemin: string, repli: string) {
    setEnCours(chemin);
    try {
      const res = await appelerApi(`/api/cv-generator/${chemin}`);
      if (!res.ok) throw new Error(String(res.status));

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomDepuisEnTete(res.headers.get("content-disposition"), repli);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erreur de génération du CV");
    } finally {
      setEnCours(null);
    }
  }

  const bouton =
    "inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => telecharger("generate", "CV.pdf")}
        disabled={enCours !== null}
        className={bouton}
      >
        <IconeFormat format="PDF" />
        {enCours === "generate" ? "Génération…" : "Télécharger le PDF"}
      </button>
      <button
        type="button"
        onClick={() => telecharger("generate.docx", "CV.docx")}
        disabled={enCours !== null}
        className={bouton}
      >
        <IconeFormat format="DOC" />
        {enCours === "generate.docx" ? "Génération…" : "Télécharger le Word"}
      </button>
    </div>
  );
}
