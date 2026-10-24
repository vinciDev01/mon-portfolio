"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchEntities, deleteEntity, fetchSingleton, updateEntity, updateSingleton } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RANGS_DE_LA_BASE } from "@/components/cv-section-form";
import { ApercuCv } from "@/components/apercu-cv";
import { TitrePosteCv } from "@/components/titre-poste-cv";
import { toast } from "sonner";
import type { CvSectionDto, SiteSettingsDto } from "@portfolio/shared-types";

type Ligne =
  | { genre: "base"; rang: number; titre: string; page: string; cle: string }
  | { genre: "libre"; rang: number; section: CvSectionDto };

export default function SectionsCvPage() {
  const router = useRouter();
  const [sections, setSections] = useState<CvSectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Incremente a chaque changement des sections : l'apercu se regenere.
  const [versionApercu, setVersionApercu] = useState(0);
  // Les sections de la base retirees du CV, lues dans les reglages du site.
  const [masquees, setMasquees] = useState<string[]>([]);
  // La ligne dont l'inclusion est en cours d'enregistrement.
  const [bascule, setBascule] = useState<string | null>(null);

  useEffect(() => {
    fetchSingleton<SiteSettingsDto>("site-settings")
      .then((r) => setMasquees(r.cvBaseMasquees ?? []))
      .catch(() => toast.error("Erreur de chargement des sections incluses"));
  }, []);

  const estIncluse = (l: Ligne) =>
    l.genre === "base" ? !masquees.includes(l.cle) : l.section.publique;

  /** Inclut ou retire une section du CV, enregistre aussitot, et regenere
   *  l'apercu. Base : la liste des masquees, dans les reglages du site.
   *  Libre : la case « publique » de la section, qui jouait deja ce role. */
  async function basculerInclusion(l: Ligne) {
    const cle = l.genre === "base" ? l.cle : l.section.id;
    const incluse = !estIncluse(l);
    setBascule(cle);
    try {
      if (l.genre === "base") {
        const suivantes = incluse ? masquees.filter((m) => m !== l.cle) : [...masquees, l.cle];
        await updateSingleton("site-settings", { cvBaseMasquees: suivantes });
        setMasquees(suivantes);
      } else {
        await updateEntity("cv-sections", l.section.id, { publique: incluse });
        setSections((prev) => prev.map((s) => (s.id === l.section.id ? { ...s, publique: incluse } : s)));
      }
      setVersionApercu((v) => v + 1);
      toast.success(incluse ? "Section incluse dans le CV" : "Section retirée du CV");
    } catch {
      toast.error("Erreur d'enregistrement");
    } finally {
      setBascule(null);
    }
  }

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
      setVersionApercu((v) => v + 1);
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
      page: s.page,
      cle: s.cle,
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

      {/* La liste a gauche, l'apercu du document a droite des 1280 px ; en
          dessous, l'apercu passe sous la liste. Colle en haut, il reste a
          l'ecran pendant qu'on parcourt une longue liste. */}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(420px,42%)] items-start">
      <div>
      <TitrePosteCv surEnregistrement={() => setVersionApercu((v) => v + 1)} />

      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Le CV téléchargeable est composé de deux sortes de sections. Celles
        issues de la base sont produites automatiquement et occupent un rang
        fixe ; celles que vous saisissez ici s&apos;intercalent entre elles.
        L&apos;ordre ci-dessous est celui du document final. Décochez
        « Inclus » pour retirer une section du CV sans la supprimer.
      </p>

      <table className="w-full text-sm [&_th]:pr-4 [&_td]:pr-4">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 w-16">Rang</th>
            <th className="py-2">Section</th>
            <th className="py-2">Origine</th>
            <th className="py-2">Inclus</th>
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
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={estIncluse(l)}
                    disabled={bascule !== null}
                    onChange={() => basculerInclusion(l)}
                    aria-label={`Inclure « ${l.genre === "base" ? l.titre : l.section.titre} » dans le CV`}
                  />
                  <span className={estIncluse(l) ? "text-muted-foreground" : "text-amber-700"}>
                    {estIncluse(l) ? "Oui" : "Non"}
                  </span>
                </label>
              </td>
              <td className="py-3">
                {/* Une section de la base se modifie dans la page de ses
                    donnees : le lien y mene. */}
                {l.genre === "base" && (
                  <Link
                    href={l.page}
                    className="text-primary hover:underline"
                    title="Ses éléments se modifient dans leur propre page"
                  >
                    Modifier
                  </Link>
                )}
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
      </div>

      <aside className="xl:sticky xl:top-8 h-[80vh]">
        <ApercuCv version={versionApercu} />
      </aside>
      </div>

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
