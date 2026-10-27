"use client";

import { useState, type CSSProperties } from "react";
import type { CoursPublicDto } from "@portfolio/shared-types";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { cuirDe, rangerEnPlanches } from "@/lib/cours/etagere";
import { filtrerCours } from "@/lib/cours/recherche";
import { LivreOuvert } from "@/components/portfolio/livre-ouvert";
import { BordImparfait } from "@/components/portfolio/bord-imparfait";

/** La hauteur et l'epaisseur d'un livre, variees mais stables : derivees de
 *  son identifiant, elles ne changent pas d'un rendu a l'autre. */
function gabarit(id: string): { hauteur: number; epaisseur: number } {
  let h = 7;
  for (const c of id) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return { hauteur: 132 + (h % 5) * 7, epaisseur: 34 + ((h >>> 3) % 4) * 4 };
}

/**
 * L'etagere des cours : une planche par famille, surmontee d'une plaquette
 * gravee a son nom, et des livres debout, relies du cuir de leur technologie.
 * Une planche pleine passe a la ligne, et chaque livre porte son morceau de
 * planche : la rangee suivante repose elle aussi sur du bois.
 *
 * `SectionShell` porte le titre de la section ; chaque planche porte le nom
 * de sa famille en h3.
 */
export function CoursSection({ cours }: { cours: CoursPublicDto[] }) {
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState<CoursPublicDto | null>(null);
  const [requete, setRequete] = useState("");
  if (!cours.length) return null;
  const trouves = filtrerCours(cours, requete);

  return (
    <div className="etagere">
      {/* La recherche : une etiquette de papier au bord use. Elle filtre les
          livres sur place, le site ayant deja tous les cours publics. */}
      <div className="recherche-cours cadre-imparfait" role="search">
        <BordImparfait graine="recherche-cours" amplitude={1.2} pas={28} />
        <svg className="recherche-cours-loupe" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M 16 16 L 20.5 20.5" />
        </svg>
        <label htmlFor="recherche-cours" className="sr-only">
          {t("cours.rechercher")}
        </label>
        <input
          id="recherche-cours"
          type="search"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setRequete("");
          }}
          placeholder={t("cours.rechercher")}
          autoComplete="off"
        />
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {requete.trim() ? t("cours.resultats", { n: String(trouves.length) }) : ""}
      </p>
      {requete.trim() && !trouves.length && <p className="recherche-cours-vide">{t("cours.aucun")}</p>}
      {rangerEnPlanches(trouves).map(({ famille, cours: livres }) => {
        const id = `planche-${famille?.id ?? "autres"}`;
        return (
          <section key={id} className="planche-cours" aria-labelledby={id}>
            <h3 id={id} className="plaquette cadre-imparfait">
              <BordImparfait graine={id} etire />
              {famille?.name ?? t("cours.autres")}
            </h3>
            <div className="rangee-livres">
              {livres.map((c) => {
                const cuir = cuirDe(c.technology.id);
                const { hauteur, epaisseur } = gabarit(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="livre-cours cadre-imparfait"
                    aria-haspopup="dialog"
                    aria-label={t("cours.livre", { titre: c.titre, techno: c.technology.label })}
                    onClick={() => setOuvert(c)}
                    style={
                      {
                        "--cuir": cuir.fond,
                        "--dorure": cuir.texte,
                        "--hauteur": `${hauteur}px`,
                        "--epaisseur": `${epaisseur}px`,
                      } as CSSProperties
                    }
                  >
                    {/* Le dos du livre : du cuir aux bords uses. */}
                    <BordImparfait graine={c.id} etire />
                    <span className="livre-tranche" aria-hidden="true">
                      {c.titreCourt ?? c.titre}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      {ouvert && <LivreOuvert cours={ouvert} surFermeture={() => setOuvert(null)} />}
    </div>
  );
}
