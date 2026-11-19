"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { fetchEntities } from "@/lib/api";
import { aUneLettre } from "@/lib/lettre";
import { PageHeader } from "@/components/page-header";
import { ReglagesLettre } from "@/components/reglages-lettre";
import { IconeFormat, telechargerCv } from "@/components/telechargement-cv";
import type { CvVersionDto } from "@portfolio/shared-types";

/**
 * Les lettres de motivation, une par version du CV : l'en-tete commun a
 * toutes, puis chaque version avec sa lettre, a rediger ou a telecharger.
 */
export default function LettresPage() {
  const [versions, setVersions] = useState<CvVersionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [enCours, setEnCours] = useState<string | null>(null);

  useEffect(() => {
    fetchEntities<CvVersionDto>("cv-versions")
      .then(setVersions)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  async function telecharger(v: CvVersionDto, format: "pdf" | "docx") {
    setEnCours(`${v.id}:${format}`);
    try {
      await telechargerCv(`${format === "pdf" ? "lettre" : "lettre.docx"}?version=${v.id}`, `Lettre.${format}`);
    } finally {
      setEnCours(null);
    }
  }

  if (loading) return <p>Chargement...</p>;

  const bouton =
    "inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-50";

  return (
    <div>
      <PageHeader title="Lettres de motivation" />
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Une lettre par version du CV, dans sa langue. L&apos;en-tête est commun à toutes ; le destinataire, l&apos;objet
        et les sections du corps sont propres à chaque lettre, qui se réduit d&apos;elle-même pour tenir sur une page.
      </p>

      <ReglagesLettre />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-3 px-2">Version du CV</th>
              <th className="py-3 px-2">Lettre</th>
              <th className="py-3 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => {
              const lettre = aUneLettre(v);
              return (
                <tr key={v.id} className="border-b border-border">
                  <td className="py-3 px-2">
                    <span className="font-medium">{v.nom}</span>
                    <span className="block text-xs text-muted-foreground">
                      {v.langue === "en" ? "Anglais" : "Français"}
                      {v.titrePoste && ` · ${v.titrePoste}`}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {lettre ? (v.lettreObjet ?? "Sans objet") : "Pas encore de lettre"}
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      {lettre && (
                        <>
                          <button
                            type="button"
                            onClick={() => telecharger(v, "pdf")}
                            disabled={enCours !== null}
                            className={bouton}
                          >
                            <IconeFormat format="PDF" />
                            {enCours === `${v.id}:pdf` ? "…" : "PDF"}
                          </button>
                          <button
                            type="button"
                            onClick={() => telecharger(v, "docx")}
                            disabled={enCours !== null}
                            className={bouton}
                          >
                            <IconeFormat format="DOC" />
                            {enCours === `${v.id}:docx` ? "…" : "Word"}
                          </button>
                        </>
                      )}
                      <Link
                        href={`/lettres/${v.id}`}
                        className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {lettre ? "Modifier" : "Rédiger"}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {versions.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          Aucune version du CV : créez-en une dans « Versions du CV », sa lettre se rédige ici.
        </p>
      )}
    </div>
  );
}
