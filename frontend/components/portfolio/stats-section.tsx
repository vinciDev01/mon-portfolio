"use client";

import type { StatsDto } from "@portfolio/shared-types";
import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * Bandeau de reperes chiffres.
 *
 * Volontairement sans compteur anime : la contrainte du projet n'admet que
 * deux mouvements sur tout le site, l'entree d'un bloc et la lampe. Et sur des
 * nombres a un ou deux chiffres, un compteur qui defile jusqu'a « 2 » dessert
 * le propos qu'il pretend servir. On informe, on ne cherche pas a impressionner.
 *
 * L'enveloppe, le titre et l'observateur d'entree sont fournis par
 * SectionShell : ce composant ne rend que la grille.
 */
export function StatsSection({ stats }: { stats: StatsDto }) {
  const { t } = useTranslation();

  const reperes = [
    { valeur: stats.technologies, cle: "stats.technologies" },
    { valeur: stats.certifications, cle: "stats.certifications" },
    { valeur: stats.projects, cle: "stats.projects" },
    { valeur: stats.experiences, cle: "stats.experiences" },
  ] as const;

  return (
    <dl className="grid grid-cols-2 md:grid-cols-4">
      {reperes.map((repere) => (
        <div
          key={repere.cle}
          className="border-t"
          style={{
            borderColor: "var(--bordure)",
            paddingTop: "var(--espace-2)",
            paddingBottom: "var(--espace-3)",
            paddingRight: "var(--espace-3)",
          }}
        >
          <dd
            style={{
              fontSize: "var(--h2)",
              lineHeight: 1.1,
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            {repere.valeur}
          </dd>
          <dt className="meta" style={{ marginTop: "var(--espace-1)" }}>
            {t(repere.cle)}
          </dt>
        </div>
      ))}
    </dl>
  );
}
