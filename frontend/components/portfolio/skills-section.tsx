"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import type { SkillDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { BordImparfait } from "./bord-imparfait";
import { couleursLogo } from "@/lib/competences/couleur-logo";
import { competenceDe, rangerParFamille, remplirBande, type Competence, type Tiroir } from "@/lib/competences/outillage";

interface SkillsSectionProps {
  skills: SkillDto[];
}

/** Secondes par etiquette : le defilement reste lent quelle que soit la
 *  rangee, une etiquette passe le temps de la lire sans la poursuivre. */
export const SECONDES_PAR_ETIQUETTE = 8;

/** Le logo d'une etiquette : l'image chargee au backoffice, sinon le logo du
 *  catalogue choisi pour la technologie (son trace vient de l'API), sinon
 *  l'initiale. Decoratif : le nom suit. */
function LogoOutil({ competence }: { competence: Competence }) {
  const image = getFileUrl(competence.logoPath);
  if (image) return <Image src={image} alt="" width={18} height={18} className="etiquette-logo" />;
  const trace = competence.logoTrace;
  if (trace) {
    // Couleur de marque, une par theme : la feuille melange les deux selon
    // `--t-page`, le logo bascule avec l'ampoule.
    const { nuit, jour } = couleursLogo(competence.logoHex);
    return (
      <svg
        className="etiquette-logo"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        style={{ "--logo-nuit": nuit, "--logo-jour": jour } as CSSProperties}
      >
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

/**
 * Vrai quand la liste tient dans sa fenetre : rien ne deborde, la bande
 * n'aurait rien a reveler et ne ferait que bouger pour rien. Mesure a chaque
 * changement de taille de la fenetre ou de la liste (polices chargees,
 * ecran tourne). La liste reste sur une ligne dans les deux etats : sa
 * largeur dit donc toujours si elle deborderait.
 */
function useTientDansLaFenetre() {
  const fenetre = useRef<HTMLElement>(null);
  const liste = useRef<HTMLUListElement>(null);
  const [tient, setTient] = useState(false);

  useEffect(() => {
    const f = fenetre.current;
    const l = liste.current;
    if (!f || !l) return;
    const mesurer = () => setTient(l.scrollWidth <= f.clientWidth);
    mesurer();
    if (typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(mesurer);
    obs.observe(f);
    obs.observe(l);
    return () => obs.disconnect();
  }, []);

  return { fenetre, liste, tient };
}

function Rangee({ tiroir, rang }: { tiroir: Tiroir; rang: number }) {
  const { t } = useTranslation();
  const { fenetre, liste, tient } = useTientDansLaFenetre();
  // Une copie doit couvrir toute la fenetre de la bande, sans quoi la boucle
  // laisserait un trou : 12 etiquettes au moins.
  const bande = remplirBande(tiroir.competences, 12);
  const nom = tiroir.famille?.name ?? t("competences.autres");
  return (
    <div
      className="rangee-outils"
      data-sens={rang % 2 ? "inverse" : undefined}
      data-statique={tient ? "true" : undefined}
      style={{ "--duree": `${bande.length * SECONDES_PAR_ETIQUETTE}s` } as CSSProperties}
    >
      <dt className="tiroir-nom">{nom}</dt>
      <dd className="defilement-outils" ref={fenetre}>
        {/* La liste lue : chaque technologie une fois, fixe. Masquee a l'oeil
            tant que la bande defile, elle la remplace quand elle tient dans
            la fenetre, et pour qui demande moins de mouvement. */}
        <ul className="liste-outils-fixe" ref={liste}>
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
 * Une rangee qui tient dans sa fenetre ne defile pas : ses etiquettes sont
 * posees, fixes. Le defilement s'arrete au survol d'une rangee, et pour toute
 * la section par le bouton pause (WCAG 2.2.2). Pour qui demande moins de mouvement, il n'y a
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
