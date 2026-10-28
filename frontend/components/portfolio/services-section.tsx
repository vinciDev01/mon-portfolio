"use client";

import type { ServiceDto } from "@portfolio/shared-types";
import { BordImparfait } from "./bord-imparfait";
import { useTranslation } from "@/lib/i18n/i18n-context";

interface ServicesSectionProps {
  services: ServiceDto[];
}

/**
 * La carte des prestations : une seule feuille, comme le tarif d'un artisan
 * pose sur le comptoir. Une ligne par service, son nom relie a l'organisme par
 * des points de conduite, la description dessous. Tout se lit d'un coup
 * d'oeil : pas de « voir plus ». Le logo de l'organisme n'y figure pas, une
 * couleur de marque casserait le registre de la feuille.
 */
export function ServicesSection({ services }: ServicesSectionProps) {
  const { t } = useTranslation();
  if (!services.length) return null;

  return (
    <div className="carte-prestations cadre-imparfait">
      <BordImparfait graine="carte-prestations" amplitude={2} />
      {/* Le titre de la section l'annonce deja : l'entete n'est que decor. */}
      <p className="carte-prestations-entete" aria-hidden="true">{t("services.carte")}</p>
      <ul className="carte-prestations-liste">
        {services.map((service) => (
          <li key={service.id} className="prestation">
            <div className="prestation-ligne">
              <h3 className="prestation-nom">{service.label}</h3>
              <span className="prestation-points" aria-hidden="true" />
              {service.organization && (
                <span className="prestation-organisme">{service.organization.label}</span>
              )}
            </div>
            {service.description && <p className="prestation-description">{service.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
