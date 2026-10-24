"use client";

import type { PersonalInfoDto } from "@portfolio/shared-types";
import { TAILLES_MEDAILLON, nomVariante } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { initialesDe } from "@/lib/parcours/identite";

/** Vrai quand le medaillon a quelque chose a montrer : photo ou initiales. */
export function aUnPortrait(infos: PersonalInfoDto): boolean {
  return Boolean(infos.avatarPath) || initialesDe(infos) !== "";
}

/**
 * Le medaillon d'ouverture, une arche de 176 x 220 px (128 x 160 au palier
 * etroit), a gauche dans la colonne de texte.
 *
 * Une arche et non un cercle : un cercle rogne les epaules et renvoie au
 * registre de l'avatar de reseau social. Sans cadre : son relief est l'echo
 * de la meme arche, en aplat d'accent, decale derriere elle (voir la feuille).
 *
 * Il est a gauche, donc hors de l'ellipse du halo a tous les paliers, et les
 * couches de lumiere sont de toute facon en z-index -1, derriere le contenu :
 * aucune cohabitation avec la lumiere n'est a verifier.
 *
 * Aucun mouvement propre : il apparait avec sa section, par l'opacite seule.
 */
export function Medaillon({ infos }: { infos: PersonalInfoDto }) {
  const { t } = useTranslation();
  const initiales = initialesDe(infos);

  // Ni photo ni initiales : rien a montrer, jamais de carre vide.
  if (!aUnPortrait(infos)) return null;

  if (!infos.avatarPath) {
    return (
      <span className="medaillon-niche">
        <span className="medaillon medaillon-repli" aria-hidden="true">
          {initiales}
        </span>
      </span>
    );
  }

  const base = getFileUrl(infos.avatarPath)!;
  // L'arche fait 176 x 220 : la plus grande variante carree (264) couvre sa
  // hauteur en simple densite, l'original non retaille sert au-dela.
  const variante = nomVariante(base, TAILLES_MEDAILLON[TAILLES_MEDAILLON.length - 1]);
  return (
    // Fragment porteur : il permet les deux commentaires JSX ci-dessous, un
    // conteneur d'expression ne pouvant se trouver a la racine d'un return.
    <>
      {/* next/image ne sait pas exprimer un srcSet de densite construit a la
          main sur des variantes generees au televersement. */}
      <span className="medaillon-niche">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="medaillon"
          src={variante}
          srcSet={`${variante} 1x, ${base} 2x`}
          width={176}
          height={220}
          alt={t("parcours.portrait", {
            nom: [infos.name, infos.surname].filter(Boolean).join(" "),
          })}
        />
      </span>
    </>
  );
}
