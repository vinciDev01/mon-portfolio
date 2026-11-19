"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { fetchEntity, updateEntity } from "@/lib/api";
import { aUneLettre } from "@/lib/lettre";
import { ApercuLettre, type BrouillonLettre } from "@/components/apercu-lettre";
import { IconeFormat, telechargerCv } from "@/components/telechargement-cv";
import type { CvVersionDto } from "@portfolio/shared-types";

const champ = "w-full px-3 py-2 border border-border rounded-md text-sm bg-background";
const petitBouton =
  "text-xs w-7 h-7 inline-flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-30";

/** Une section en cours d'edition ; `cle` ne sert qu'a React. */
type Section = { cle: number; titre: string; corps: string };

type Saisie = {
  destinataire: string;
  lieu: string;
  /** « AAAA-MM-JJ », ou vide : le jour de la generation. */
  date: string;
  objet: string;
  sections: Section[];
};

let prochaineCle = 1;
const nouvelleSection = (titre = "", corps = ""): Section => ({ cle: prochaineCle++, titre, corps });

function saisieDe(v: CvVersionDto): Saisie {
  return {
    destinataire: v.lettreDestinataire ?? "",
    lieu: v.lettreLieu ?? "",
    date: v.lettreDate ? v.lettreDate.slice(0, 10) : "",
    objet: v.lettreObjet ?? "",
    sections: v.lettreSections.length
      ? v.lettreSections.map((s) => nouvelleSection(s.titre ?? "", s.corps))
      : [nouvelleSection()],
  };
}

/** Ce qui part a l'API, pour l'apercu comme pour l'enregistrement. */
function brouillonDe(s: Saisie, langue: "fr" | "en"): BrouillonLettre {
  return {
    langue,
    destinataire: s.destinataire.trim() || null,
    lieu: s.lieu.trim() || null,
    date: s.date || null,
    objet: s.objet.trim() || null,
    sections: s.sections
      .map((x) => ({ titre: x.titre.trim() || null, corps: x.corps.trim() }))
      .filter((x) => x.titre || x.corps),
  };
}

/** Deplace l'element `i` d'un cran vers le haut (-1) ou le bas (+1). */
function deplacer<T>(liste: T[], i: number, sens: -1 | 1): T[] {
  const j = i + sens;
  if (j < 0 || j >= liste.length) return liste;
  const copie = [...liste];
  [copie[i], copie[j]] = [copie[j], copie[i]];
  return copie;
}

/**
 * L'editeur de la lettre d'une version du CV : a gauche le destinataire, le
 * lieu, la date, l'objet et les sections du corps (ajoutees, retirees,
 * deplacees) ; a droite l'apercu PDF, qui suit la saisie.
 */
export default function EditeurLettrePage() {
  const { id } = useParams() as { id: string };
  const [version, setVersion] = useState<CvVersionDto | null>(null);
  const [saisie, setSaisie] = useState<Saisie | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);
  // Ce qui est enregistre, pour savoir si la saisie a change.
  const enregistre = useRef<string>("");

  useEffect(() => {
    fetchEntity<CvVersionDto>("cv-versions", id)
      .then((v) => {
        const s = saisieDe(v);
        enregistre.current = JSON.stringify(brouillonDe(s, v.langue));
        setVersion(v);
        setSaisie(s);
      })
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [id]);

  const brouillon = useMemo(
    () => (saisie && version ? brouillonDe(saisie, version.langue) : null),
    [saisie, version],
  );
  const modifie = brouillon !== null && JSON.stringify(brouillon) !== enregistre.current;

  // Quitter la page avec des modifications non enregistrees demande confirmation.
  useEffect(() => {
    if (!modifie) return;
    const avertir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avertir);
    return () => window.removeEventListener("beforeunload", avertir);
  }, [modifie]);

  if (loading) return <p>Chargement...</p>;
  if (!version || !saisie || !brouillon) return <p>Version introuvable.</p>;

  const maj = <K extends keyof Saisie>(cle: K, v: Saisie[K]) => setSaisie({ ...saisie, [cle]: v });
  const majSection = (i: number, champs: Partial<Section>) =>
    maj(
      "sections",
      saisie.sections.map((s, j) => (j === i ? { ...s, ...champs } : s)),
    );

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!brouillon || !version) return;
    setSaving(true);
    try {
      const v = await updateEntity<CvVersionDto>("cv-versions", id, {
        lettreDestinataire: brouillon.destinataire,
        lettreLieu: brouillon.lieu,
        lettreDate: brouillon.date,
        lettreObjet: brouillon.objet,
        lettreSections: brouillon.sections,
      });
      enregistre.current = JSON.stringify(brouillon);
      setVersion(v);
      toast.success("Lettre enregistrée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function telecharger(format: "pdf" | "docx") {
    setEnCours(format);
    try {
      await telechargerCv(`${format === "pdf" ? "lettre" : "lettre.docx"}?version=${id}`, `Lettre.${format}`);
    } finally {
      setEnCours(null);
    }
  }

  const telechargeable = aUneLettre(version) && !modifie;
  const bouton =
    "inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-50";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <Link href="/lettres" className="text-xs text-muted-foreground hover:text-foreground">
            ← Lettres de motivation
          </Link>
          <h1 className="text-2xl font-bold mt-1">Lettre : {version.nom}</h1>
          <p className="text-sm text-muted-foreground">
            En {version.langue === "en" ? "anglais" : "français"}
            {version.titrePoste && ` · ${version.titrePoste}`}. L&apos;en-tête commun se règle sur la page des lettres.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => telecharger("pdf")}
            disabled={!telechargeable || enCours !== null}
            title={telechargeable ? undefined : "Enregistrez la lettre pour la télécharger"}
            className={bouton}
          >
            <IconeFormat format="PDF" />
            {enCours === "pdf" ? "…" : "PDF"}
          </button>
          <button
            type="button"
            onClick={() => telecharger("docx")}
            disabled={!telechargeable || enCours !== null}
            title={telechargeable ? undefined : "Enregistrez la lettre pour la télécharger"}
            className={bouton}
          >
            <IconeFormat format="DOC" />
            {enCours === "docx" ? "…" : "Word"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
        <form onSubmit={enregistrer} className="space-y-5">
          <div>
            <label htmlFor="lettre-destinataire" className="block text-sm font-medium mb-1">
              Destinataire
            </label>
            <textarea
              id="lettre-destinataire"
              rows={3}
              maxLength={600}
              value={saisie.destinataire}
              onChange={(e) => maj("destinataire", e.target.value)}
              placeholder={"À l'attention du Directeur des ressources humaines\nNom de l'entreprise\nAdresse"}
              className={champ}
            />
            <p className="text-xs text-muted-foreground mt-1">Une ligne par information, à droite de la lettre.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
            <div>
              <label htmlFor="lettre-lieu" className="block text-sm font-medium mb-1">
                Lieu
              </label>
              <input
                id="lettre-lieu"
                type="text"
                maxLength={80}
                value={saisie.lieu}
                onChange={(e) => maj("lieu", e.target.value)}
                placeholder="Lomé"
                className={champ}
              />
            </div>
            <div>
              <label htmlFor="lettre-date" className="block text-sm font-medium mb-1">
                Date
              </label>
              <input
                id="lettre-date"
                type="date"
                value={saisie.date}
                onChange={(e) => maj("date", e.target.value)}
                className={champ}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-3">
            Sans date, celle du jour où la lettre est générée.
            {saisie.date && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => maj("date", "")}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Date du jour à chaque génération
                </button>
              </>
            )}
          </p>

          <div>
            <label htmlFor="lettre-objet" className="block text-sm font-medium mb-1">
              Objet
            </label>
            <input
              id="lettre-objet"
              type="text"
              maxLength={200}
              value={saisie.objet}
              onChange={(e) => maj("objet", e.target.value)}
              placeholder="Candidature au poste de …"
              className={champ}
            />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium mb-1">Corps, section par section</legend>
            <p className="text-xs text-muted-foreground">
              De l&apos;appel à la formule de politesse. Le titre d&apos;une section, facultatif, s&apos;affiche en gras ;
              une ligne vide sépare deux paragraphes. Votre nom est ajouté en signature.
            </p>
            {saisie.sections.map((s, i) => (
              <div key={s.cle} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground mr-auto">Section {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => maj("sections", deplacer(saisie.sections, i, -1))}
                    disabled={i === 0}
                    aria-label={`Monter la section ${i + 1}`}
                    className={petitBouton}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => maj("sections", deplacer(saisie.sections, i, 1))}
                    disabled={i === saisie.sections.length - 1}
                    aria-label={`Descendre la section ${i + 1}`}
                    className={petitBouton}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      maj(
                        "sections",
                        saisie.sections.length > 1 ? saisie.sections.filter((_, j) => j !== i) : [nouvelleSection()],
                      )
                    }
                    aria-label={`Retirer la section ${i + 1}`}
                    className={`${petitBouton} hover:text-destructive`}
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={120}
                  value={s.titre}
                  onChange={(e) => majSection(i, { titre: e.target.value })}
                  placeholder="Titre (facultatif)"
                  aria-label={`Titre de la section ${i + 1}`}
                  className={`${champ} font-semibold`}
                />
                <textarea
                  rows={Math.min(14, Math.max(4, s.corps.split("\n").length + 1))}
                  maxLength={6000}
                  value={s.corps}
                  onChange={(e) => majSection(i, { corps: e.target.value })}
                  placeholder={i === 0 ? "Madame, Monsieur,\n\nPremier paragraphe…" : "Texte de la section…"}
                  aria-label={`Texte de la section ${i + 1}`}
                  className={champ}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => maj("sections", [...saisie.sections, nouvelleSection()])}
              disabled={saisie.sections.length >= 20}
              className="w-full text-sm px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted disabled:opacity-50"
            >
              + Ajouter une section
            </button>
          </fieldset>

          <div className="sticky bottom-0 bg-background py-3 border-t border-border flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !modifie}
              className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Sauvegarde..." : "Enregistrer"}
            </button>
            <span className="text-xs text-muted-foreground">
              {modifie ? "Modifications non enregistrées" : "Tout est enregistré"}
            </span>
          </div>
        </form>

        <div className="xl:sticky xl:top-6">
          <ApercuLettre brouillon={brouillon} />
        </div>
      </div>
    </div>
  );
}
