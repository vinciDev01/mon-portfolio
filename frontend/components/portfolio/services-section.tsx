"use client";

import Image from "next/image";
import type { ServiceDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { SectionWrapper } from "./section-wrapper";
import { SeeMoreList } from "./see-more-button";

interface ServicesSectionProps {
  services: ServiceDto[];
}

function ServiceCard({ service }: { service: ServiceDto }) {
  const orgLogoUrl = service.organization
    ? getFileUrl(service.organization.logoPath)
    : null;

  return (
    <div className="animated-card bg-card rounded-xl p-6 transition-colors flex flex-col gap-4">
      {/* Organization logo */}
      {orgLogoUrl && (
        <div className="size-10 flex items-center justify-center">
          <Image
            src={orgLogoUrl}
            alt={service.organization!.label}
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-base">{service.label}</h3>
        {service.organization && !orgLogoUrl && (
          <p className="text-xs text-muted-foreground font-medium">
            {service.organization.label}
          </p>
        )}
      </div>

      {service.description && (
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          {service.description}
        </p>
      )}
    </div>
  );
}

export function ServicesSection({ services }: ServicesSectionProps) {
  if (!services.length) return null;

  return (
    <SectionWrapper id="services" title="Services">
      <SeeMoreList
        items={services}
        initialCount={4}
        renderItem={(service) => (
          <ServiceCard key={service.id} service={service} />
        )}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      />
    </SectionWrapper>
  );
}
