"use client";

import type { CSSProperties } from "react";
import type { StatsDto } from "@portfolio/shared-types";
import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * Bandeau de reperes chiffres.
 *
 * A la premiere arrivee sur la section, chaque nombre compte de 0 jusqu'a sa
 * valeur, et le filet au-dessus de lui se trace de gauche a droite. Le tout
 * vit dans la feuille et non ici : un entier enregistre par `@property`,
 * anime, puis affiche par un compteur CSS, declenche par `data-decouverte`
 * que le conteneur pose a la premiere activation. Aucun JavaScript, donc
 * aucun clignotement a l'hydratation, et rien ne rejoue a un retour sur la
 * section. Le vrai nombre est un texte de la page : sans la feuille, il
 * s'affiche tel quel ; avec elle, il est masque a l'oeil mais reste lu, et le
 * compteur, que les lecteurs d'ecran ignorent, prend sa place. Sans animation
 * (mouvement reduit, navigateur sans `@property`), le compteur montre
 * directement la valeur.
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
          className="repere-chiffre"
          style={{
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
            {/* Le nombre est un vrai texte, visible sans la feuille. La
                feuille, quand elle est la, le masque et affiche a sa place le
                compteur anime : les deux arrivent ensemble ou pas du tout,
                le chiffre ne peut jamais disparaitre. */}
            <span className="repere-compte" style={{ "--cible": repere.valeur } as CSSProperties}>
              <span className="repere-texte">{repere.valeur}</span>
            </span>
          </dd>
          <dt className="meta" style={{ marginTop: "var(--espace-1)" }}>
            {t(repere.cle)}
          </dt>
        </div>
      ))}
    </dl>
  );
}
