import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';

@Injectable()
export class ContactMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.contactMessage.findUnique({
      where: { id },
    });
    if (!record)
      throw new NotFoundException(`ContactMessage #${id} not found`);
    return record;
  }

  async create(dto: CreateContactMessageDto) {
    const msg = await this.prisma.contactMessage.create({ data: dto });

    const settings = await this.prisma.siteSettings.findFirst();
    if (settings?.notificationEmail) {
      this.notifications
        .sendEmail(
          settings.notificationEmail,
          `Nouveau message de ${dto.firstName} ${dto.lastName}: ${dto.subject}`,
          `<p><strong>De:</strong> ${dto.firstName} ${dto.lastName} (${dto.email})</p><p><strong>Sujet:</strong> ${dto.subject}</p><hr/><p>${dto.message}</p>`,
        )
        .catch(() => {});
    }

    return msg;
  }

  async update(id: string, dto: UpdateContactMessageDto) {
    await this.findOne(id);
    return this.prisma.contactMessage.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.contactMessage.delete({ where: { id } });
  }
}
