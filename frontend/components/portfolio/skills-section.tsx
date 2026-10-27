"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { SkillDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { BordImparfait } from "./bord-imparfait";

interface SkillsSectionProps {
  skills: SkillDto[];
}

function SkillCard({ skill }: { skill: SkillDto }) {
  const logoUrl = getFileUrl(skill.technology.logoPath);

  return (
    <div className="carte-competence cadre-imparfait">
      <BordImparfait graine={skill.id} />
      <div className="size-12 flex items-center justify-center">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${skill.technology.label} logo`}
            width={48}
            height={48}
            className="object-contain"
          />
        ) : (
          <div className="size-12 rounded-lg bg-muted flex items-center justify-center">
            <span className="text-lg font-bold text-muted-foreground">
              {skill.technology.label.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-center leading-tight">{skill.technology.label}</span>
      {skill.proficiency !== null && (
        <div className="w-full">
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-foreground/60" style={{ width: `${skill.proficiency}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function Fleche({ sens }: { sens: "gauche" | "droite" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={sens === "gauche" ? "M 10 3 L 5 8 L 10 13" : "M 6 3 L 11 8 L 6 13"} />
    </svg>
  );
}

/**
 * Les competences en carrousel : une piste horizontale de cartes au bord
 * imparfait, qui defile a la souris, au doigt, au clavier (la piste prend le
 * focus) ou par les deux fleches. Chaque carte s'aimante au bord de la piste.
 *
 * Les fleches avancent d'une piste presque entiere ; elles se desactivent aux
 * butees. Le defilement est doux, sauf pour qui demande moins de mouvement.
 */
export function SkillsSection({ skills }: SkillsSectionProps) {
  const { t } = useTranslation();
  const piste = useRef<HTMLUListElement>(null);
  const [butees, setButees] = useState({ debut: true, fin: false });

  useEffect(() => {
    const el = piste.current;
    if (!el) return;
    const relever = () =>
      setButees({
        debut: el.scrollLeft <= 1,
        fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
      });
    relever();
    el.addEventListener("scroll", relever, { passive: true });
    window.addEventListener("resize", relever);
    return () => {
      el.removeEventListener("scroll", relever);
      window.removeEventListener("resize", relever);
    };
  }, [skills.length]);

  if (!skills.length) return null;

  const avancer = (sens: 1 | -1) => {
    const el = piste.current;
    if (!el) return;
    const reduit = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: sens * el.clientWidth * 0.85, behavior: reduit ? "auto" : "smooth" });
  };

  return (
    <div className="carrousel-competences">
      <ul ref={piste} className="piste-competences" tabIndex={0} aria-label={t("competences.carrousel")}>
        {skills.map((skill) => (
          <li key={skill.id}>
            <SkillCard skill={skill} />
          </li>
        ))}
      </ul>
      <div className="commandes-carrousel">
        <button
          type="button"
          className="fleche-carrousel cadre-imparfait"
          aria-label={t("competences.precedent")}
          disabled={butees.debut}
          onClick={() => avancer(-1)}
        >
          <BordImparfait graine="precedent" pas={12} amplitude={1} />
          <Fleche sens="gauche" />
        </button>
        <button
          type="button"
          className="fleche-carrousel cadre-imparfait"
          aria-label={t("competences.suivant")}
          disabled={butees.fin}
          onClick={() => avancer(1)}
        >
          <BordImparfait graine="suivant" pas={12} amplitude={1} />
          <Fleche sens="droite" />
        </button>
      </div>
    </div>
  );
}
