"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import type { SkillDto, TechnologyDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { BordImparfait } from "./bord-imparfait";
import { niveauDe, rangerParFamille, remplirBande, type Tiroir } from "@/lib/competences/outillage";

interface SkillsSectionProps {
  skills: SkillDto[];
  technologies?: TechnologyDto[];
}

/** Secondes par etiquette : le defilement reste lent quelle que soit la rangee. */
const SECONDES_PAR_ETIQUETTE = 3.5;

function Etiquette({ techno, niveau, graine }: { techno: TechnologyDto; niveau: number; graine: string }) {
  const logo = getFileUrl(techno.logoPath);
  return (
    <li className="etiquette-outil cadre-imparfait">
      <BordImparfait graine={graine} etire />
      {logo && <Image src={logo} alt="" width={16} height={16} className="etiquette-logo" />}
      {techno.label}
      {niveau > 0 && (
        <span className="etiquette-niveau" data-niveau={niveau}>
          <span />
          <span />
          <span />
        </span>
      )}
    </li>
  );
}

function Rangee({ tiroir, rang, niveaux }: { tiroir: Tiroir; rang: number; niveaux: Map<string, number> }) {
  const { t } = useTranslation();
  const bande = remplirBande(tiroir.technologies);
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
          {tiroir.technologies.map((techno) => (
            <Etiquette key={techno.id} techno={techno} niveau={niveaux.get(techno.id) ?? 0} graine={techno.id} />
          ))}
        </ul>
        {/* La bande : deux copies identiques bout a bout, decalees d'une
            copie en boucle. Decorative, elle n'est pas lue. */}
        <div className="bande-outils" aria-hidden="true">
          {[0, 1].map((copie) => (
            <ul key={copie} className="piste-outils">
              {bande.map((techno, i) => (
                <Etiquette key={i} techno={techno} niveau={niveaux.get(techno.id) ?? 0} graine={`${techno.id}:${i}`} />
              ))}
            </ul>
          ))}
        </div>
      </dd>
    </div>
  );
}

/**
 * Les competences : toutes les technologies, une rangee par famille, en
 * etiquettes de papier au bord imparfait qui defilent sans fin, lentement,
 * une rangee sur deux dans l'autre sens. Les technologies qui sont des
 * competences portent leur niveau en trois pierres.
 *
 * Le defilement s'arrete au survol d'une rangee, et pour toute la section par
 * le bouton pause (WCAG 2.2.2). Pour qui demande moins de mouvement, il n'y a
 * pas de defilement du tout : les etiquettes sont posees, fixes.
 */
export function SkillsSection({ skills, technologies = [] }: SkillsSectionProps) {
  const { t } = useTranslation();
  const [pause, setPause] = useState(false);

  // Sans liste de technologies, celles des competences suffisent.
  const outils = technologies.length ? technologies : skills.map((s) => s.technology);
  const tiroirs = rangerParFamille(outils);
  if (!tiroirs.length) return null;
  const niveaux = new Map(skills.map((s) => [s.technology.id, niveauDe(s.proficiency)]));

  return (
    <div className="boite-outils" data-pause={pause ? "true" : undefined}>
      <dl className="tiroirs-outils">
        {tiroirs.map((tiroir, rang) => (
          <Rangee key={tiroir.famille?.id ?? "autres"} tiroir={tiroir} rang={rang} niveaux={niveaux} />
        ))}
      </dl>
      <button type="button" className="pause-outils" onClick={() => setPause((p) => !p)}>
        {pause ? t("competences.reprendre") : t("competences.pause")}
      </button>
    </div>
  );
}
