"use client";

import type { CertificationDto } from "@portfolio/shared-types";
import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * Les certifications, section a part entiere depuis qu'elles ont leur entree
 * dans la colonne. Elles etaient auparavant un sous-bloc de l'experience.
 * `SectionShell` porte le titre : aucun titre ici.
 */
export function CertificationsSection({ certifications }: { certifications: CertificationDto[] }) {
  const { t } = useTranslation();
  if (!certifications.length) return null;

  return (
    <ul className="mesure space-y-4">
      {certifications.map((c) => (
        <li key={c.id}>
          <p>{c.name}</p>
          <p className="meta">
            {c.organization?.label}
            {c.issueDate ? ` · ${new Date(c.issueDate).getFullYear()}` : ""}
          </p>
          {c.description && (
            <p className="text-sm text-muted-foreground leading-relaxed" style={{ marginTop: "var(--espace-1)" }}>
              {c.description}
            </p>
          )}
          {c.credentialUrl && (
            <a
              href={c.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t("certifications.viewCert")} : ${c.name}`}
              className="meta underline underline-offset-2"
              style={{ color: "var(--accent)", marginTop: "var(--espace-1)", display: "inline-block" }}
            >
              {t("certifications.viewCert")}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
