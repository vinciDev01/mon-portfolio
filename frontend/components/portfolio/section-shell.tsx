"use client";

import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * Coquille commune a toutes les sections : place le bloc dans la grille selon
 * la parite de `index` et rend le titre en `var(--texte)`.
 *
 * `page.tsx` est un composant serveur : il ne peut pas appeler `useTranslation`
 * (hook client). C'est donc `SectionShell`, deja "use client", qui recoit une
 * cle de traduction (`cleTitre`) plutot qu'un libelle deja resolu, et appelle
 * `t()` lui-meme. Pas de divergence d'hydratation : `I18nProvider` initialise
 * son etat avec la langue par defaut du site (calculee cote serveur dans
 * `app/layout.tsx` et transmise via la prop `defaultLocale`), donc le premier
 * rendu client produit exactement le meme texte que le rendu serveur. Un
 * `useEffect` ne bascule vers la langue sauvegardee en `localStorage` qu'apres
 * le montage : une mise a jour d'etat normale, pas un ecart d'hydratation.
 * C'est le meme mecanisme que celui deja utilise par `Header` et les autres
 * composants clients traduits du site.
 */
export function SectionShell({
  cleTitre,
  index,
  large = false,
  children,
}: {
  cleTitre: string;
  index: number;
  /** Plafond de largeur plus genereux, pour une section faite de cadres ou de
   *  colonnes plutot que de texte courant : 88 caracteres au lieu de 66. */
  large?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const titre = t(cleTitre);
  const aGauche = index % 2 === 1;

  return (
    <section
      tabIndex={-1}
      className="grid grid-cols-12 gouttiere-parcours"
      style={{
        paddingTop: "var(--espace-section)",
        // La fin du contenu ne colle pas au bord de l ecran, la ou le visiteur
        // arrive en butee pour passer a la section suivante.
        paddingBottom: "var(--section-bas, var(--espace-5))",
      }}
    >
      <div
        className="col-span-12 bloc-parcours"
        // L'amplitude vient du reglage `zigzagAmplitude`, normalise entre 0 et 1
        // par app/layout.tsx. A 0 les deux cotes se confondent : colonne unique.
        data-cote={aGauche ? "gauche" : "droite"}
        data-large={large ? "true" : undefined}
      >
        <p className="meta" style={{ marginBottom: "var(--espace-1)" }} aria-hidden="true">
          {String(index).padStart(2, "0")}
        </p>

        <h2 style={{ marginBottom: "var(--espace-4)" }}>
          {titre}
        </h2>

        {children}
      </div>
    </section>
  );
}
