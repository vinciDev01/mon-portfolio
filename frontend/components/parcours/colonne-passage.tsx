"use client";

import Image from "next/image";
import Link from "next/link";
import type { SiteSettingsDto, PersonalInfoDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { entreesSections } from "@/lib/parcours/entrees-sections";
import { useSectionCourante } from "@/lib/parcours/section-courante";
import { DrapeauDisponibilite } from "@/components/parcours/drapeau-disponibilite";
import { LanguageSwitcher } from "@/components/portfolio/language-switcher";

/** Pictogrammes des commandes du pied. Traits seuls, sur `currentColor`, pour
 *  qu'ils suivent la palette des deux themes sans couleur propre. */
const PICTO_CV =
  "M 8 2.5 v 7.5 M 4.5 7 L 8 10.5 L 11.5 7 M 2.5 13.5 h 11";
const PICTO_BLOG =
  "M 3.5 2.5 h 9 v 11 h -9 z M 5.5 5.5 h 5 M 5.5 8 h 5 M 5.5 10.5 h 3";

function Picto({ chemin }: { chemin: string }) {
  return (
    <svg
      className="picto-commande"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path d={chemin} />
    </svg>
  );
}

/**
 * La colonne de passage : seul morceau de chrome du site depuis la depose de
 * l'en-tete collant. De haut en bas : l'identite au sommet du mat, le drapeau
 * de disponibilite, les sections du parcours, puis les commandes au pied.
 *
 * L'ampoule occupe le coin haut droit et l'horizon viendra en bas droite : la
 * gauche reste le seul endroit ou l'on agit.
 */
export function ColonnePassage({
  reglages,
  infos,
}: {
  reglages: SiteSettingsDto;
  infos: PersonalInfoDto;
}) {
  const { t } = useTranslation();
  const entrees = entreesSections(reglages);
  const courante = useSectionCourante(entrees.map((e) => e.ancre));
  const logo = getFileUrl(reglages.logoPath);
  const nomComplet = `${infos.name} ${infos.surname}`.trim();
  const initiales = `${infos.name?.[0] ?? ""}${infos.surname?.[0] ?? ""}`.toUpperCase();

  return (
    <nav className="colonne-passage" aria-label={t("parcours.colonne")}>
      <Link href="/" className="identite-mat" aria-label={nomComplet}>
        {logo ? (
          <Image src={logo} alt="" width={36} height={36} className="identite-logo" />
        ) : (
          <span className="identite-initiales" aria-hidden="true">{initiales}</span>
        )}
        <span className="identite-nom">{nomComplet}</span>
      </Link>

      <DrapeauDisponibilite
        etat={reglages.availabilityStatus}
        libelle={reglages.availabilityLabel}
      />

      {entrees.length > 0 && (
        <ol className="entrees-parcours">
          {entrees.map((e) => (
            <li key={e.ancre}>
              <a
                href={`#${e.ancre}`}
                className="entree-parcours"
                aria-current={courante === e.ancre ? "true" : undefined}
              >
                <span className="entree-repere" aria-hidden="true" />
                <span className="entree-nom">{t(e.cleTitre)}</span>
              </a>
            </li>
          ))}
        </ol>
      )}

      <div className="pied-colonne">
        {reglages.showCvDownload && (
          <a
            href="/api/download-cv-word"
            download
            className="entree-parcours"
            aria-label={t("nav.downloadCv")}
          >
            <Picto chemin={PICTO_CV} />
            <span className="entree-nom">{t("nav.downloadCv")}</span>
          </a>
        )}
        <LanguageSwitcher />
        <Link href="/blog" className="entree-parcours" aria-label={t("nav.blog")}>
          <Picto chemin={PICTO_BLOG} />
          <span className="entree-nom">{t("nav.blog")}</span>
        </Link>
      </div>
    </nav>
  );
}
