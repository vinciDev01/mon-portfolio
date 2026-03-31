import { Module } from '@nestjs/common';
import { AboutModule } from './about/about.module';
import { CertificationsModule } from './certifications/certifications.module';
import { ExperiencesModule } from './experiences/experiences.module';
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
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    PrismaModule,
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
    PortfolioModule,
  ],
})
export class AppModule {}
