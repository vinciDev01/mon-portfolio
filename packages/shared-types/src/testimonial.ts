export interface TestimonialDto {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  role: string | null;
  content: string;
  isApproved: boolean;
  sortOrder: number;
  createdAt: string;
}
