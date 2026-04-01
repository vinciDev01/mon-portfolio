export interface ContactMessageDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
