"use client";

import type { ReactNode } from "react";
import type { PersonalInfoDto } from "@portfolio/shared-types";
import { TAILLES_MEDAILLON, nomVariante } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { initialesDe } from "@/lib/parcours/identite";
import { BordImparfait } from "@/components/portfolio/bord-imparfait";

/**
 * Le tableau : un cadre de bois brut aux bords uses (le bois de l'etagere
 * des cours), un passe-partout creme, et la photo au centre. Il pend a un
 * clou par une ficelle, un rien de travers, comme accroche a la main.
 * Ficelle et clou sont decoratifs.
 */
function Tableau({ graine, children }: { graine: string; children: ReactNode }) {
  return (
    <span className="medaillon-niche">
      <span className="tableau-accroche" aria-hidden="true">
        <svg className="tableau-ficelle" viewBox="0 0 100 20" preserveAspectRatio="none" focusable="false">
          <path d="M 22 20 L 50 1.5 L 78 20" />
        </svg>
        <span className="tableau-clou" />
      </span>
      <span className="tableau-bois cadre-imparfait">
        <BordImparfait graine={`${graine}:bois`} amplitude={1.6} pas={26} />
        <span className="tableau-passe cadre-imparfait">
          <BordImparfait graine={`${graine}:passe`} amplitude={1} pas={22} />
          {children}
        </span>
      </span>
    </span>
  );
}

/** Vrai quand le medaillon a quelque chose a montrer : photo ou initiales. */
export function aUnPortrait(infos: PersonalInfoDto): boolean {
  return Boolean(infos.avatarPath) || initialesDe(infos) !== "";
}

/**
 * Le portrait d'ouverture, un tableau de 176 x 220 px cadre compris (128 x
 * 160, puis 88 x 110 aux paliers etroits), a gauche dans la colonne de texte.
 *
 * Un rectangle et non un cercle : un cercle rogne les epaules et renvoie au
 * registre de l'avatar de reseau social.
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
      <Tableau graine={initiales}>
        <span className="medaillon medaillon-repli" aria-hidden="true">
          {initiales}
        </span>
      </Tableau>
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
      <Tableau graine={infos.avatarPath}>
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
      </Tableau>
    </>
  );
}
