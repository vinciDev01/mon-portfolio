"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import type { PersonalInfoDto } from "@portfolio/shared-types";
import { TAILLES_MEDAILLON, nomVariante } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { initialesDe } from "@/lib/parcours/identite";
import { tracerArche } from "@/lib/parcours/arche";

/**
 * La niche aux bords uses : la photo et son echo sont decoupes chacun par
 * une arche tracee a la main (`objectBoundingBox` : le meme gabarit sert aux
 * trois tailles du medaillon), et un trait de crayon suit le bord de la
 * photo. Sans `clip-path`, l'arrondi de la feuille reste le repli.
 */
function Niche({ graine, children }: { graine: string; children: ReactNode }) {
  // `useId` rend des deux-points, que `url(#...)` lirait mal.
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const photo = tracerArche(`${graine}:photo`);
  const echo = tracerArche(`${graine}:echo`);
  return (
    <span
      className="medaillon-niche"
      style={{ "--arche-photo": `url(#arche-photo-${id})`, "--arche-echo": `url(#arche-echo-${id})` } as CSSProperties}
    >
      <svg className="medaillon-gabarits" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={`arche-photo-${id}`} clipPathUnits="objectBoundingBox">
            <path d={photo} />
          </clipPath>
          <clipPath id={`arche-echo-${id}`} clipPathUnits="objectBoundingBox">
            <path d={echo} />
          </clipPath>
        </defs>
      </svg>
      {children}
      <svg className="medaillon-trait" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={photo} />
      </svg>
    </span>
  );
}

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
      <Niche graine={initiales}>
        <span className="medaillon medaillon-repli" aria-hidden="true">
          {initiales}
        </span>
      </Niche>
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
      <Niche graine={infos.avatarPath}>
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
      </Niche>
    </>
  );
}
