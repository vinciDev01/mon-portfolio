"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchEntities, deleteEntity } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RANGS_DE_LA_BASE } from "@/components/cv-section-form";
import { toast } from "sonner";
import type { CvSectionDto } from "@portfolio/shared-types";

type Ligne =
  | { genre: "base"; rang: number; titre: string }
  | { genre: "libre"; rang: number; section: CvSectionDto };

export default function SectionsCvPage() {
  const router = useRouter();
  const [sections, setSections] = useState<CvSectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntities<CvSectionDto>("cv-sections")
      .then(setSections)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteEntity("cv-sections", deleteId);
      setSections((prev) => prev.filter((s) => s.id !== deleteId));
      toast.success("Section supprimée");
    } catch {
      toast.error("Erreur de suppression");
    }
    setDeleteId(null);
  }

  // On affiche l'ordre FUSIONNE : c'est le seul moyen de comprendre ou une
  // section libre viendra se placer dans le document final.
  const lignes: Ligne[] = [
    ...RANGS_DE_LA_BASE.map((s) => ({
      genre: "base" as const,
      rang: s.rang,
      titre: s.titre,
    })),
    ...sections.map((s) => ({
      genre: "libre" as const,
      rang: s.sortOrder,
      section: s,
    })),
  ].sort((a, b) => a.rang - b.rang);

  if (loading) return <p>Chargement…</p>;

  return (
    <div>
      <PageHeader
        title="Sections du CV"
        addHref="/cv-sections/new"
        addLabel="Nouvelle section"
      />

      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Le CV téléchargeable est composé de deux sortes de sections. Celles
        issues de la base sont produites automatiquement et occupent un rang
        fixe ; celles que vous saisissez ici s&apos;intercalent entre elles.
        L&apos;ordre ci-dessous est celui du document final.
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 w-16">Rang</th>
            <th className="py-2">Section</th>
            <th className="py-2">Origine</th>
            <th className="py-2">Dans le PDF</th>
            <th className="py-2 w-32"></th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr
              key={l.genre === "base" ? `base-${l.rang}` : l.section.id}
              className="border-b border-border/50"
            >
              <td className="py-3 tabular-nums text-muted-foreground">{l.rang}</td>
              <td className="py-3 font-medium">
                {l.genre === "base" ? l.titre : l.section.titre.toUpperCase()}
              </td>
              <td className="py-3 text-muted-foreground">
                {l.genre === "base" ? "Base de données" : "Saisie libre"}
              </td>
              <td className="py-3">
                {l.genre === "base" || l.section.publique ? (
                  <span className="text-muted-foreground">Inclus</span>
                ) : (
                  <span className="text-amber-700">Privé</span>
                )}
              </td>
              <td className="py-3">
                {l.genre === "libre" && (
                  <div className="flex gap-3">
                    <Link
                      href={`/cv-sections/${l.section.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => setDeleteId(l.section.id)}
                      className="text-red-600 hover:underline"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer cette section ?"
        message="Elle disparaîtra du CV téléchargeable. Cette action est irréversible."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
