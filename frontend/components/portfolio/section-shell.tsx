"use client";

import { useBeamTarget, useBiaisLampe } from "@/lib/lamp/lamp-context";
import { useReveal } from "@/lib/use-reveal";
import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * Coquille commune a toutes les sections : place le bloc dans la grille selon
 * la parite de `index`, declare sa zone eclairable, et rend le titre en deux
 * couches — celle du dessus n'apparait que dans le faisceau.
 *
 * `page.tsx` est un composant serveur : il ne peut pas appeler `useTranslation`
 * (hook client). C'est donc `SectionShell`, deja "use client", qui recoit une
 * cle de traduction (`cleTitre`) plutot qu'un libelle deja resolu, et appelle
 * `t()` lui-meme. Pas de divergence d'hydratation : `I18nProvider` initialise
 * son etat avec la langue par defaut du site (calculee cote serveur dans
 * `app/layout.tsx` et transmise via la prop `defaultLocale`), donc le premier
 * rendu client produit exactement le meme texte que le rendu serveur. Un
 * `useEffect` ne bascule vers la langue sauvegardee en `localStorage` qu'apres
 * le montage — une mise a jour d'etat normale, pas un ecart d'hydratation.
 * C'est le meme mecanisme que celui deja utilise par `Header` et les autres
 * composants clients traduits du site.
 */
export function SectionShell({
  id,
  cleTitre,
  index,
  children,
}: {
  id: string;
  cleTitre: string;
  index: number;
  children: React.ReactNode;
}) {
  const cible = useBeamTarget();
  const reveal = useReveal();
  const { survolTitre, relacher } = useBiaisLampe();
  const { t } = useTranslation();
  const titre = t(cleTitre);
  const aGauche = index % 2 === 1;

  return (
    <section
      id={id}
      className="grid grid-cols-12 px-8 lg:px-16"
      style={{ paddingTop: "var(--espace-section)", paddingBottom: 0 }}
    >
      <div
        ref={(el) => {
          cible(el);
          reveal(el);
        }}
        className="col-span-12 mesure zigzag"
        // L'amplitude vient du reglage `zigzagAmplitude`, normalise entre 0 et 1
        // par app/layout.tsx. A 0 les deux cotes se confondent : colonne unique.
        data-cote={aGauche ? "gauche" : "droite"}
      >
        <p className="meta" style={{ marginBottom: "var(--espace-1)" }} aria-hidden="true">
          {String(index).padStart(2, "0")}
        </p>

        <h2
          className="titre-double"
          style={{ marginBottom: "var(--espace-4)" }}
          onMouseEnter={(e) => survolTitre(e.currentTarget)}
          onMouseLeave={relacher}
        >
          <span className="titre-retrait">{titre}</span>
          <span className="titre-eclaire" aria-hidden="true">
            {titre}
          </span>
        </h2>

        {children}
      </div>
    </section>
  );
}
