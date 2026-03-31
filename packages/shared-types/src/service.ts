import type { OrganizationDto } from "./organization";

export interface ServiceDto {
  id: string;
  label: string;
  description: string | null;
  organizationId: string | null;
  organization: OrganizationDto | null;
  sortOrder: number;
}
