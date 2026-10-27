"use client";

import { useState, type CSSProperties } from "react";
import type { CoursPublicDto } from "@portfolio/shared-types";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { cuirDe, rangerEnPlanches } from "@/lib/cours/etagere";
import { LivreOuvert } from "@/components/portfolio/livre-ouvert";

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
  if (!cours.length) return null;

  return (
    <div className="etagere">
      {rangerEnPlanches(cours).map(({ famille, cours: livres }) => {
        const id = `planche-${famille?.id ?? "autres"}`;
        return (
          <section key={id} className="planche-cours" aria-labelledby={id}>
            <h3 id={id} className="plaquette">
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
                    className="livre-cours"
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
