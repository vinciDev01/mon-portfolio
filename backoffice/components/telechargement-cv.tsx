"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";

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

export function TelechargementCv() {
  const [enCours, setEnCours] = useState<string | null>(null);

  async function telecharger(chemin: string, repli: string) {
    setEnCours(chemin);
    try {
      const token = localStorage.getItem("portfolio-admin-token");
      const res = await fetch(`${getApiUrl()}/api/cv-generator/${chemin}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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
    "px-4 py-2 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => telecharger("generate", "CV.pdf")}
        disabled={enCours !== null}
        className={bouton}
      >
        {enCours === "generate" ? "Génération…" : "Télécharger le PDF"}
      </button>
      <button
        type="button"
        onClick={() => telecharger("generate.docx", "CV.docx")}
        disabled={enCours !== null}
        className={bouton}
      >
        {enCours === "generate.docx" ? "Génération…" : "Télécharger le Word"}
      </button>
    </div>
  );
}
