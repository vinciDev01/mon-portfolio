import type { OrganizationDto } from "./organization";

export interface CertificationDto {
  id: string;
  name: string;
  imagePath: string | null;
  organizationId: string;
  organization: OrganizationDto;
  description: string | null;
  issueDate: string | null;
  credentialUrl: string | null;
  sortOrder: number;
}
