import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AboutModule } from './about/about.module';
import { AuthModule } from './auth/auth.module';
import { BlogModule } from './blog/blog.module';
import { CertificationsModule } from './certifications/certifications.module';
import { ContactMessagesModule } from './contact-messages/contact-messages.module';
import { CvGeneratorModule } from './cv-generator/cv-generator.module';
import { ExperiencesModule } from './experiences/experiences.module';
import { ExportModule } from './export/export.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PersonalInfoModule } from './personal-info/personal-info.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PresentationsModule } from './presentations/presentations.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ServicesModule } from './services/services.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { SkillsModule } from './skills/skills.module';
import { TechnologiesModule } from './technologies/technologies.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { UploadModule } from './upload/upload.module';
import { JwtAuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NotificationsModule,
    UploadModule,
    SiteSettingsModule,
    PersonalInfoModule,
    TechnologiesModule,
    OrganizationsModule,
    PresentationsModule,
    SkillsModule,
    ExperiencesModule,
    CertificationsModule,
    ProjectsModule,
    ServicesModule,
    AboutModule,
    ContactMessagesModule,
    TestimonialsModule,
    PortfolioModule,
    BlogModule,
    ExportModule,
    CvGeneratorModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
