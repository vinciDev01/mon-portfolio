"use client";

import type { PersonalInfoDto } from "@portfolio/shared-types";
import { Coordonnees } from "@/components/portfolio/coordonnees";
import { FormulaireContact } from "@/components/portfolio/formulaire-contact";
import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * La coquille de la section contact : l'accroche, puis les deux volets.
 *
 * `SectionShell` porte deja le numero, le titre et le zigzag, donc cette
 * section ne rend que son corps : aucun titre de niveau 2 ici.
 *
 * Trois decisions la tiennent :
 *
 * 1. Les COORDONNEES viennent en premier dans l'ordre du document. Sur
 *    telephone les deux volets s'empilent, et c'est l'ordre du document qui
 *    decide alors de l'ordre a l'ecran : un visiteur presse trouve le canal
 *    direct avant d'avoir a remplir cinq champs.
 * 2. L'accroche `contact.headline` appartient a la SECTION. Le volet des
 *    coordonnees l'empruntait faute de cle propre ; il porte desormais
 *    `contact.directTitle`, et la phrase ne parait plus qu'une fois.
 * 3. Aucun jeton de shadcn et aucune couleur de Tailwind n'entre ici. Le vert,
 *    le rouge, `text-muted-foreground`, `border-border` et `bg-background`
 *    sont partis avec l'ancien corps du fichier : la palette du site porte
 *    tout, et elle ne gagne aucune couleur d'alerte.
 */
export function ContactSection({ personalInfo }: { personalInfo: PersonalInfoDto }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="contact-accroche mesure">
        <p className="contact-accroche-titre">{t("contact.headline")}</p>
        <p className="contact-accroche-detail">{t("contact.subtitle")}</p>
      </div>

      {/* Le motif maison : une colonne, puis deux des la tablette. */}
      <div className="contact-volets grid grid-cols-1 md:grid-cols-2">
        <Coordonnees infos={personalInfo} />
        {/* Le formulaire rend deux freres, sa region d'etat et son `<form>` :
            l'enveloppe en fait une seule cellule de la grille. */}
        <div className="contact-volet-formulaire">
          <FormulaireContact />
        </div>
      </div>
    </>
  );
}
