"use client";

import Image from "next/image";
import type { CertificationDto, OrganizationDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { cheminSceau, initialesOrganisme, regrouperParOrganisme } from "@/lib/portfolio/certifications";

const BORD_SCEAU = cheminSceau();

/**
 * Le sceau de l'organisme : un cercle festonne, comme un cachet appose sur un
 * document. Sans logo, il porte les initiales dans un anneau de petits traits.
 * Avec un logo, l'anneau cede la place a une pastille claire qui remplit le
 * feston : un logotype est allonge et dessine pour un fond clair, il y tient
 * entier. Un dessin et non une animation, qui ne double pas le nom de
 * l'organisme ecrit a cote : `alt` vide et `aria-hidden`.
 */
function Sceau({ organisme }: { organisme: OrganizationDto }) {
  const logo = getFileUrl(organisme.logoPath);
  return (
    <span className="sceau-boite">
      <svg className="sceau" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <path className="sceau-bord" d={BORD_SCEAU} />
        {!logo && (
          <>
            <circle className="sceau-anneau" cx="32" cy="32" r="22" />
            <text className="sceau-initiales" x="32" y="32" textAnchor="middle" dominantBaseline="central">
              {initialesOrganisme(organisme.label)}
            </text>
          </>
        )}
      </svg>
      {logo && (
        <span className="sceau-plaque">
          <Image src={logo} alt="" width={84} height={84} className="sceau-logo" />
        </span>
      )}
    </span>
  );
}

/**
 * Les certifications, rangees par organisme : un registre par organisme, son
 * sceau a gauche, ses certifications a droite. `SectionShell` porte le titre
 * de la section, chaque registre porte le nom de son organisme en h3.
 */
export function CertificationsSection({ certifications }: { certifications: CertificationDto[] }) {
  const { t } = useTranslation();
  if (!certifications.length) return null;

  return (
    <div className="registres-certifs mesure">
      {regrouperParOrganisme(certifications).map(({ organisme, certifications: liste }) => (
        <section key={organisme.id} className="registre-certifs" aria-labelledby={`organisme-${organisme.id}`}>
          {/* Sceau, nom et liste sont trois enfants de la grille : au palier
              etroit, la liste passe sous le sceau et reprend toute la largeur. */}
          <Sceau organisme={organisme} />
          <h3 id={`organisme-${organisme.id}`}>{organisme.label}</h3>
          <ul className="registre-liste">
            {liste.map((c) => (
              <li key={c.id}>
                <p className="registre-nom">
                  {c.name}
                  {c.issueDate && (
                    <time className="registre-annee" dateTime={c.issueDate.slice(0, 10)}>
                      {new Date(c.issueDate).getUTCFullYear()}
                    </time>
                  )}
                </p>
                {c.description && <p className="registre-description">{c.description}</p>}
                {c.credentialUrl && (
                  <a
                    href={c.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t("certifications.viewCert")} : ${c.name}`}
                    className="registre-lien"
                  >
                    {t("certifications.viewCert")}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
