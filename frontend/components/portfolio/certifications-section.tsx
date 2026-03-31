import Image from "next/image";
import type { CertificationDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { SectionWrapper } from "./section-wrapper";
import { SeeMoreList } from "./see-more-button";
import { Button } from "@/components/ui/button";

interface CertificationsSectionProps {
  certifications: CertificationDto[];
}

function CertificationCard({
  certification,
}: {
  certification: CertificationDto;
}) {
  const imageUrl = getFileUrl(certification.imagePath);
  const orgLogoUrl = getFileUrl(certification.organization.logoPath);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-muted-foreground/30 transition-colors flex flex-col">
      {/* Certification image */}
      {imageUrl && (
        <div className="relative h-40 bg-muted">
          <Image
            src={imageUrl}
            alt={certification.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Organization */}
        <div className="flex items-center gap-2">
          {orgLogoUrl ? (
            <Image
              src={orgLogoUrl}
              alt={certification.organization.label}
              width={20}
              height={20}
              className="object-contain rounded-sm"
            />
          ) : null}
          <span className="text-xs text-muted-foreground font-medium">
            {certification.organization.label}
          </span>
          {certification.issueDate && (
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(certification.issueDate).toLocaleDateString("fr-FR", {
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-sm leading-snug">{certification.name}</h3>

        {certification.description && (
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">
            {certification.description}
          </p>
        )}

        {certification.credentialUrl && (
          <Button asChild variant="outline" size="sm" className="mt-auto w-fit">
            <a
              href={certification.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir la certification
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

export function CertificationsSection({
  certifications,
}: CertificationsSectionProps) {
  if (!certifications.length) return null;

  return (
    <SectionWrapper id="certifications" title="Certifications">
      <SeeMoreList
        items={certifications}
        initialCount={4}
        renderItem={(cert) => (
          <CertificationCard key={cert.id} certification={cert} />
        )}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      />
    </SectionWrapper>
  );
}
