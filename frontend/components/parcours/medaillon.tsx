"use client";

import type { PersonalInfoDto } from "@portfolio/shared-types";
import { TAILLES_MEDAILLON, nomVariante } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * Le medaillon d'ouverture, carre de 88 px, a gauche dans la colonne de texte.
 *
 * Carre a peine adouci et non cercle : un cercle rogne les epaules et renvoie
 * au registre de l'avatar de reseau social, la ou un carre renvoie a celui du
 * document.
 *
 * Il est a gauche, donc hors de l'ellipse du halo a tous les paliers, et les
 * couches de lumiere sont de toute facon en z-index -1, derriere le contenu :
 * aucune cohabitation avec la lumiere n'est a verifier.
 *
 * Aucun mouvement propre : il herite de l'entree de bloc, qui est l'un des deux
 * mouvements autorises.
 */
export function initialesDe(infos: PersonalInfoDto): string {
  return `${infos.name?.trim()[0] ?? ""}${infos.surname?.trim()[0] ?? ""}`.toUpperCase();
}

/** Vrai quand le medaillon a quelque chose a montrer : photo ou initiales. */
export function aUnPortrait(infos: PersonalInfoDto): boolean {
  return Boolean(infos.avatarPath) || initialesDe(infos) !== "";
}

export function Medaillon({ infos }: { infos: PersonalInfoDto }) {
  const { t } = useTranslation();
  const initiales = initialesDe(infos);

  // Ni photo ni initiales : rien a montrer, jamais de carre vide.
  if (!aUnPortrait(infos)) return null;

  if (!infos.avatarPath) {
    return (
      <div className="medaillon medaillon-repli" aria-hidden="true">
        {initiales}
      </div>
    );
  }

  const base = getFileUrl(infos.avatarPath)!;
  const [un, deux, trois] = TAILLES_MEDAILLON;
  return (
    <>
      {/* next/image ne sait pas exprimer un srcSet de densite construit a la
          main sur des variantes generees au televersement. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="medaillon"
        src={nomVariante(base, un)}
        srcSet={`${nomVariante(base, deux)} 2x, ${nomVariante(base, trois)} 3x`}
        width={un}
        height={un}
        alt={t("parcours.portrait", { nom: `${infos.name} ${infos.surname}`.trim() })}
      />
    </>
  );
}
