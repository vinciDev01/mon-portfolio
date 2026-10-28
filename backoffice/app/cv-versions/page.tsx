"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchEntities, deleteEntity } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { IconeFormat, telechargerCv } from "@/components/telechargement-cv";
import { ApercuVersionCv } from "@/components/apercu-version-cv";
import { toast } from "sonner";
import type { CvVersionDto } from "@portfolio/shared-types";

/** Ce qu'une version retient, en une ligne : « 3 projets, toutes les technologies ». */
function resume(v: CvVersionDto): string {
  const compte = (n: number, un: string, tous: string) => (n ? `${n} ${un}${n > 1 ? "s" : ""}` : tous);
  return [
    compte(v.projetIds.length, "projet", "tous les projets"),
    compte(v.technologieIds.length, "technologie", "technologies du CV"),
    compte(v.competenceIds.length, "compétence", "toutes les compétences"),
  ].join(", ");
}

/**
 * Les versions du CV, une par candidature : chacune se telecharge en PDF ou
 * en Word, dans sa langue.
 */
export default function CvVersionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<CvVersionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [apercu, setApercu] = useState<CvVersionDto | null>(null);
  const fermerApercu = useCallback(() => setApercu(null), []);

  useEffect(() => {
    fetchEntities<CvVersionDto>("cv-versions")
      .then(setItems)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  async function telecharger(v: CvVersionDto, format: "pdf" | "docx") {
    const cle = `${v.id}:${format}`;
    setEnCours(cle);
    try {
      await telechargerCv(`${format === "pdf" ? "generate" : "generate.docx"}?version=${v.id}`, `CV.${format}`);
    } finally {
      setEnCours(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteEntity("cv-versions", deleteId);
      setItems((p) => p.filter((i) => i.id !== deleteId));
      toast.success("Version supprimée");
    } catch {
      toast.error("Erreur de suppression");
    }
    setDeleteId(null);
  }

  if (loading) return <p>Chargement...</p>;

  const bouton = "inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-50";

  return (
    <div>
      <PageHeader title="Versions du CV" addHref="/cv-versions/new" addLabel="Nouvelle version" />
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Une version par candidature : sa langue, son titre de poste, sa présentation, et ce qu&apos;elle retient des
        projets, technologies et compétences. Une version neuve donne le CV complet.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-3 px-2">Version</th>
            <th className="py-3 px-2">Langue</th>
            <th className="py-3 px-2">Retenu</th>
            <th className="py-3 px-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((v) => (
            <tr key={v.id} className="border-b border-border">
              <td className="py-3 px-2">
                <span className="font-medium">{v.nom}</span>
                {v.titrePoste && <span className="block text-xs text-muted-foreground">{v.titrePoste}</span>}
              </td>
              <td className="py-3 px-2">{v.langue === "en" ? "Anglais" : "Français"}</td>
              <td className="py-3 px-2 text-muted-foreground">{resume(v)}</td>
              <td className="py-3 px-2">
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => setApercu(v)} className={bouton}>
                    Aperçu
                  </button>
                  <button type="button" onClick={() => telecharger(v, "pdf")} disabled={enCours !== null} className={bouton}>
                    <IconeFormat format="PDF" />
                    {enCours === `${v.id}:pdf` ? "…" : "PDF"}
                  </button>
                  <button type="button" onClick={() => telecharger(v, "docx")} disabled={enCours !== null} className={bouton}>
                    <IconeFormat format="DOC" />
                    {enCours === `${v.id}:docx` ? "…" : "Word"}
                  </button>
                  <button onClick={() => router.push(`/cv-versions/${v.id}/edit`)} className="text-xs px-3 py-1 rounded border border-border hover:bg-accent">
                    Modifier
                  </button>
                  <button onClick={() => setDeleteId(v.id)} className="text-xs px-3 py-1 rounded bg-destructive text-white hover:bg-destructive/90">
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="text-center text-muted-foreground py-8">Aucune version pour l&apos;instant.</p>}
      {apercu && <ApercuVersionCv version={apercu} onClose={fermerApercu} />}
      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer"
        message="Supprimer cette version du CV ? Les données du CV ne sont pas touchées."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
