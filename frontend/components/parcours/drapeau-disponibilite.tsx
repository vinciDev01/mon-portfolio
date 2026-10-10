"use client";

import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * Le drapeau de disponibilite, en tete de colonne, comme a un mat.
 *
 * Drapeau par la forme et non par l'embleme : hampe droite au mat, bord libre
 * en queue d'aronde, et un leger galbe sur les bords haut et bas qui suggere la
 * toile. Aucune animation : le vent est dans le trace, pas dans le mouvement,
 * donc le budget de deux mouvements du site reste intact.
 *
 * Seul l'etat disponible recoit la couleur d'accent. Les autres restent neutres,
 * et aucune couleur d'alerte n'entre dans la palette : c'est le texte qui
 * distingue les etats.
 */
const CLES_ETAT: Record<string, string> = {
  available: "availability.available",
  busy: "availability.busy",
  unavailable: "availability.unavailable",
};

/** Boite 200 x 56. Hampe a x = 0, queue d'aronde a x = 200, galbe en C. */
const CHEMIN_DRAPEAU =
  "M 0 2 C 54 10, 118 10, 172 4 " +
  "L 200 14 L 176 28 L 200 42 L 172 52 " +
  "C 118 46, 54 46, 0 54 Z";

/** Guidon triangulaire du repli, boite 40 x 56. */
const CHEMIN_GUIDON = "M 0 4 C 12 14, 26 22, 40 28 C 26 34, 12 42, 0 52 Z";

/** Seul l'etat disponible prend l'accent, les autres restent neutres. */
function couleurFond(etat: string): string {
  return etat === "available" ? "var(--accent)" : "var(--texte-secondaire)";
}

/** Le libelle saisi au backoffice, sinon le texte de l'etat. */
function libelleAffiche(
  t: (cle: string) => string,
  etat: string,
  libelle: string | null,
): string {
  return libelle ?? t(CLES_ETAT[etat] ?? "availability.unavailable");
}

export function DrapeauDisponibilite({
  etat,
  libelle,
}: {
  etat: string;
  libelle: string | null;
}) {
  const { t } = useTranslation();
  const libelleComplet = libelleAffiche(t, etat, libelle);
  const fond = couleurFond(etat);

  return (
    <div className="mat-disponibilite">
      <svg
        className="drapeau-disponibilite drapeau-toile"
        viewBox="0 0 200 56"
        role="img"
        aria-label={libelleComplet}
        focusable="false"
      >
        <path d={CHEMIN_DRAPEAU} fill={fond} />
      </svg>
      <svg
        className="drapeau-disponibilite drapeau-guidon"
        viewBox="0 0 40 56"
        role="img"
        aria-label={libelleComplet}
        focusable="false"
      >
        <path d={CHEMIN_GUIDON} fill={fond} />
      </svg>
      <span className="drapeau-texte" aria-hidden="true">
        {libelleComplet}
      </span>
    </div>
  );
}

/**
 * Sous 1024 px le drapeau devient un guidon sans texte : le message se reporte
 * ici, dans la section d'ouverture. L'information change de place, elle ne
 * disparait pas.
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
