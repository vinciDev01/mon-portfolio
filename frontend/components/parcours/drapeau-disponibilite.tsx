"use client";

import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * Le panneau de disponibilite, en tete de colonne : un rectangle vert accent
 * aux bords legerement irreguliers, comme une piece decoupee a la main, et le
 * statut ecrit dedans. Aucune animation, aucun degrade : l'irregularite est
 * dans le trace, pas dans le mouvement.
 *
 * Le fond est l'accent du site quel que soit l'etat : c'est le texte qui dit
 * l'etat. Le texte prend la couleur du fond de page, 4,5:1 sur l'accent dans
 * les deux palettes (teste).
 */
const CLES_ETAT: Record<string, string> = {
  available: "availability.available",
  busy: "availability.busy",
  unavailable: "availability.unavailable",
};

/** Boite 200 x 48. Quatre bords qui ondulent de 1 a 2 unites, jamais plus. */
const CHEMIN_PANNEAU =
  "M 2 3 L 58 1.4 L 126 3 L 197 1 " +
  "L 199.2 17 L 197.6 32 L 199.4 46.2 " +
  "L 141 47.4 L 70 45.8 L 1.4 47 " +
  "L 2.6 31 L 0.8 16 Z";

/** Le panneau replie sous 1024 px, boite 24 x 24, meme facture. */
const CHEMIN_REPLI = "M 1.6 2.2 L 12.4 1 L 22.6 2 L 23.2 12.6 L 22 22.4 L 11 23.2 L 1 22 L 2 11.4 Z";

/** Le libelle saisi au backoffice (une chaine vide n'en est pas un), sinon le texte de l'etat. */
function libelleAffiche(
  t: (cle: string) => string,
  etat: string,
  libelle: string | null,
): string {
  return libelle?.trim() || t(CLES_ETAT[etat] ?? "availability.unavailable");
}

export function DrapeauDisponibilite({
  etat,
  libelle,
}: {
  etat: string;
  libelle: string | null;
}) {
  const { t } = useTranslation();

  return (
    <div className="panneau-disponibilite">
      <svg
        className="panneau-fond panneau-plein"
        viewBox="0 0 200 48"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d={CHEMIN_PANNEAU} />
      </svg>
      <svg className="panneau-fond panneau-replie" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={CHEMIN_REPLI} />
      </svg>
      <span className="panneau-texte">{libelleAffiche(t, etat, libelle)}</span>
    </div>
  );
}

/**
 * Sous 1024 px le panneau devient un petit carre sans texte lisible : le message se reporte
 * ici, dans le contenu de la section d'ouverture. L'information change de
 * place, elle ne disparait pas. La gouttiere vient de la coquille de section
 * qui l'enveloppe : la repeter ici doublerait le retrait a gauche.
 */
export function LigneDisponibilite({
  etat,
  libelle,
}: {
  etat: string;
  libelle: string | null;
}) {
  const { t } = useTranslation();
  return (
    <p className="ligne-disponibilite">
      <span className="meta">{t("parcours.disponibilite")}</span>{" "}
      {libelleAffiche(t, etat, libelle)}
    </p>
  );
}
