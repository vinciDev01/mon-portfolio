"use client";

import type { PersonalInfoDto } from "@portfolio/shared-types";
import { canaux } from "@/lib/parcours/contact";
import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * Le volet des coordonnees : les canaux directs par lesquels on joint le
 * proprietaire. La regle de ce qui s'affiche vit dans `canaux()` ; ici on
 * rend, sans second filtre. Quand aucun canal n'est exploitable, ni le titre
 * ni la liste ne paraissent : un titre sans rien dessous serait orphelin.
 *
 * Le titre est le SIEN (`contact.directTitle`) et non l'accroche de la
 * section : la coquille rend deja `contact.headline`, et emprunter cette
 * phrase ferait paraitre deux fois le meme texte dans la section assemblee.
 */
export function Coordonnees({ infos }: { infos: PersonalInfoDto }) {
  const { t } = useTranslation();
  const liste = canaux(infos);

  if (liste.length === 0) return null;

  return (
    <div>
      <h3 className="coordonnees-titre">{t("contact.directTitle")}</h3>
      <ul className="coordonnees-liste">
        {liste.map((c) => {
          const libelle = t(c.cleLibelle);
          return (
            <li key={c.cle}>
              <a className="coordonnee-lien" href={c.href}>
                {/* Libelle et valeur identiques (GitHub, LinkedIn) : le dire
                    une fois, sinon le nom accessible serait « GitHub GitHub ». */}
                {libelle !== c.valeur && (
                  <>
                    <span className="coordonnee-libelle">{libelle}</span>{" "}
                  </>
                )}
                <span className="coordonnee-valeur">{c.valeur}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
