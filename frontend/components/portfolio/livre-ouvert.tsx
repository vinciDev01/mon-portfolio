"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { CoursPublicDto } from "@portfolio/shared-types";
import { useChangerSurcouche } from "@/components/parcours/parcours-pagine";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { getCoursUrl } from "@/lib/api";
import { tailleLisible } from "@/lib/cours/etagere";
import { BordImparfait } from "@/components/portfolio/bord-imparfait";

const LOCALES: Record<string, string> = { fr: "fr-FR", en: "en-US", de: "de-DE" };

/**
 * Le livre ouvert : deux pages couleur parchemin de part et d'autre d'une
 * reliure. A gauche la famille, le titre, la technologie et la description,
 * ouverte par une lettrine ; a droite les details et le telechargement.
 *
 * Meme mecanique que la visionneuse des certifications : `showModal`, ferme
 * par la croix, Echap ou un clic hors du livre, focus rendu au livre de
 * l'etagere, pagination suspendue tant qu'il est ouvert.
 */
export function LivreOuvert({ cours, surFermeture }: { cours: CoursPublicDto; surFermeture: () => void }) {
  const { t, locale } = useTranslation();
  const changerSurcouche = useChangerSurcouche();
  const dialogue = useRef<HTMLDialogElement>(null);

  // `close()` tant que le noeud est connecte : c'est lui qui rend le focus au
  // livre. jsdom n'a ni `showModal` ni `close` : repli par l'attribut.
  const refermer = () => {
    const d = dialogue.current;
    if (!d || !d.hasAttribute("open")) return;
    if (typeof d.close === "function") d.close();
    else d.removeAttribute("open");
  };

  // Nettoyage de MISE EN PAGE : il tourne avant le detachement du noeud.
  useLayoutEffect(() => () => refermer(), []);

  useEffect(() => {
    const d = dialogue.current;
    if (!d) return;
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
    changerSurcouche(true);
    return () => changerSurcouche(false);
  }, [changerSurcouche]);

  const fermer = () => {
    refermer();
    surFermeture();
  };

  const majLe = new Date(cours.updatedAt).toLocaleDateString(LOCALES[locale] ?? "fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const description = cours.description?.trim() ?? "";

  return (
    <dialog
      ref={dialogue}
      className="livre-ouvert"
      aria-label={cours.titre}
      onCancel={(e) => {
        e.preventDefault();
        fermer();
      }}
      onClick={(e) => {
        if (e.target === dialogue.current) fermer();
      }}
    >
      {/* La couverture et les pages ont des bords uses, comme un vieux livre. */}
      <div className="livre-reliure-ouverte cadre-imparfait">
        <BordImparfait graine={`${cours.id}:couverture`} amplitude={2} />
        <div className="livre-page livre-page-gauche cadre-imparfait">
          <BordImparfait graine={`${cours.id}:gauche`} />
          <p className="livre-famille">{cours.technology.family?.name ?? t("cours.autres")}</p>
          <h3 className="livre-titre">{cours.titre}</h3>
          <span className="livre-techno cadre-imparfait">
            <BordImparfait graine={`${cours.id}:techno`} etire />
            {cours.technology.label}
          </span>
          {description && (
            <p className="livre-description">
              {/* La lettrine est la premiere lettre, en grand ; le reste suit. */}
              <span className="livre-lettrine" aria-hidden="true">
                {description.charAt(0)}
              </span>
              <span className="sr-only">{description.charAt(0)}</span>
              {description.slice(1)}
            </p>
          )}
        </div>
        <div className="livre-page livre-page-droite cadre-imparfait">
          <BordImparfait graine={`${cours.id}:droite`} />
          <button type="button" aria-label={t("cours.fermer")} onClick={fermer} className="parchemin-fermer livre-fermer">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
              <path d="M3 3 L13 13" />
              <path d="M13 3 L3 13" />
            </svg>
          </button>
          <dl className="livre-details">
            <div>
              <dt>{t("cours.niveau")}</dt>
              <dd>{t(`cours.niveau.${cours.niveau}`)}</dd>
            </div>
            {cours.pages !== null && (
              <div>
                <dt>{t("cours.pages")}</dt>
                <dd>{cours.pages}</dd>
              </div>
            )}
            <div>
              <dt>{t("cours.fichier")}</dt>
              <dd>PDF, {tailleLisible(cours.taille, locale)}</dd>
            </div>
            <div>
              <dt>{t("cours.majLe")}</dt>
              <dd>{majLe}</dd>
            </div>
          </dl>
          <a className="livre-telecharger cadre-imparfait" href={getCoursUrl(cours.id)} download>
            <BordImparfait graine={`${cours.id}:telecharger`} amplitude={1.2} pas={30} />
            {t("cours.telecharger")}
          </a>
        </div>
      </div>
    </dialog>
  );
}
