"use client";

import Image from "next/image";
import Link from "next/link";
import type { SiteSettingsDto, PersonalInfoDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { entreesSections } from "@/lib/parcours/entrees-sections";
import { LanguageSwitcher } from "@/components/portfolio/language-switcher";
import { Button } from "@/components/ui/button";

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

      {/* La tache 4 insere ici le drapeau de disponibilite, entre l'identite
          et la liste des sections. */}

      {entrees.length > 0 && (
        <ol className="entrees-parcours">
          {entrees.map((e) => (
            <li key={e.ancre}>
              <a href={`#${e.ancre}`} className="entree-parcours">
                <span className="entree-repere" aria-hidden="true" />
                <span className="entree-nom">{t(e.cleTitre)}</span>
              </a>
            </li>
          ))}
        </ol>
      )}

      <div className="pied-colonne">
        {reglages.showCvDownload && (
          <Button asChild size="sm">
            <a href="/api/download-cv-word" download>{t("nav.downloadCv")}</a>
          </Button>
        )}
        <LanguageSwitcher />
        <Link href="/blog" className="entree-parcours">{t("nav.blog")}</Link>
      </div>
    </nav>
  );
}
