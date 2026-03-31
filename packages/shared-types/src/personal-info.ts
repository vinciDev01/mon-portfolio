export interface PersonalInfoDto {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  avatarPath: string | null;
  bio: string | null;
}
