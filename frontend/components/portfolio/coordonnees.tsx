"use client";

import type { PersonalInfoDto } from "@portfolio/shared-types";
import { canaux } from "@/lib/parcours/contact";
import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * Le volet des coordonnees : les canaux directs par lesquels on joint le
 * proprietaire. La regle de ce qui s'affiche vit dans `canaux()` ; ici on
 * rend, sans second filtre. Quand aucun canal n'est exploitable, ni le titre
 * ni la liste ne paraissent : un titre sans rien dessous serait orphelin.
 */
export function Coordonnees({ infos }: { infos: PersonalInfoDto }) {
  const { t } = useTranslation();
  const liste = canaux(infos);

  if (liste.length === 0) return null;

  return (
    <div>
      <h3 className="coordonnees-titre">{t("contact.headline")}</h3>
      <ul className="coordonnees-liste">
        {liste.map((c) => (
          <li key={c.cle}>
            <a className="coordonnee-lien" href={c.href}>
              <span className="coordonnee-libelle">{t(c.cleLibelle)}</span>
              <span className="coordonnee-valeur">{c.valeur}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
