"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import type { SkillDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { BordImparfait } from "./bord-imparfait";
import { competenceDe, rangerParFamille, remplirBande, type Competence, type Tiroir } from "@/lib/competences/outillage";
import { traceDeLogo } from "@/lib/competences/logos";

interface SkillsSectionProps {
  skills: SkillDto[];
}

/** Secondes par etiquette : le defilement reste lent quelle que soit la
 *  rangee, une etiquette passe le temps de la lire sans la poursuivre. */
export const SECONDES_PAR_ETIQUETTE = 8;

/** Le logo d'une etiquette : celui charge au backoffice, sinon celui de la
 *  technologie s'il est connu, sinon son initiale. Decoratif : le nom suit. */
function LogoOutil({ competence }: { competence: Competence }) {
  const image = getFileUrl(competence.logoPath);
  if (image) return <Image src={image} alt="" width={18} height={18} className="etiquette-logo" />;
  const trace = traceDeLogo(competence.nom);
  if (trace) {
    return (
      <svg className="etiquette-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={trace} />
      </svg>
    );
  }
  return (
    <span className="etiquette-logo etiquette-initiale" aria-hidden="true">
      {competence.nom.charAt(0).toUpperCase()}
    </span>
  );
}

function Etiquette({ competence, graine }: { competence: Competence; graine: string }) {
  return (
    <li className="etiquette-outil cadre-imparfait">
      <BordImparfait graine={graine} etire />
      <LogoOutil competence={competence} />
      <span className="etiquette-nom">{competence.nom}</span>
      {competence.niveau > 0 && (
        <span className="etiquette-niveau" data-niveau={competence.niveau}>
          <span />
          <span />
          <span />
        </span>
      )}
    </li>
  );
}

function Rangee({ tiroir, rang }: { tiroir: Tiroir; rang: number }) {
  const { t } = useTranslation();
  // Une copie doit couvrir toute la fenetre de la bande, sans quoi la boucle
  // laisserait un trou : 12 etiquettes au moins.
  const bande = remplirBande(tiroir.competences, 12);
  const nom = tiroir.famille?.name ?? t("competences.autres");
  return (
    <div
      className="rangee-outils"
      data-sens={rang % 2 ? "inverse" : undefined}
      style={{ "--duree": `${bande.length * SECONDES_PAR_ETIQUETTE}s` } as CSSProperties}
    >
      <dt className="tiroir-nom">{nom}</dt>
      <dd className="defilement-outils">
        {/* La liste lue : chaque technologie une fois, fixe. Masquee a l'oeil
            tant que la bande defile, elle la remplace pour qui demande moins
            de mouvement. */}
        <ul className="liste-outils-fixe">
          {tiroir.competences.map((c) => (
            <Etiquette key={c.id} competence={c} graine={c.id} />
          ))}
        </ul>
        {/* La bande : deux copies identiques bout a bout, decalees d'une
            copie en boucle. Decorative, elle n'est pas lue. */}
        <div className="bande-outils" aria-hidden="true">
          {[0, 1].map((copie) => (
            <ul key={copie} className="piste-outils">
              {bande.map((c, i) => (
                <Etiquette key={i} competence={c} graine={`${c.id}:${i}`} />
              ))}
            </ul>
          ))}
        </div>
      </dd>
    </div>
  );
}

/**
 * Les competences : celles saisies au backoffice, techniques (Java) ou non
 * (Management), une rangee par famille, en etiquettes de papier au bord
 * imparfait qui defilent sans fin, lentement, une rangee sur deux dans
 * l'autre sens. Chacune porte son niveau en trois pierres.
 *
 * Le defilement s'arrete au survol d'une rangee, et pour toute la section par
 * le bouton pause (WCAG 2.2.2). Pour qui demande moins de mouvement, il n'y a
 * pas de defilement du tout : les etiquettes sont posees, fixes.
 */
export function SkillsSection({ skills }: SkillsSectionProps) {
  const { t } = useTranslation();
  const [pause, setPause] = useState(false);

  const tiroirs = rangerParFamille(skills.map(competenceDe));
  if (!tiroirs.length) return null;

  return (
    <div className="boite-outils" data-pause={pause ? "true" : undefined}>
      <dl className="tiroirs-outils">
        {tiroirs.map((tiroir, rang) => (
          <Rangee key={tiroir.famille?.id ?? "autres"} tiroir={tiroir} rang={rang} />
        ))}
      </dl>
      <button type="button" className="pause-outils" onClick={() => setPause((p) => !p)}>
        {pause ? t("competences.reprendre") : t("competences.pause")}
      </button>
    </div>
  );
}
