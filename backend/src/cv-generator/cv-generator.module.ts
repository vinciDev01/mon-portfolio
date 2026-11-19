import { Module } from '@nestjs/common';
import { CvGeneratorController } from './cv-generator.controller';
import { CvGeneratorService } from './cv-generator.service';
import { LettreService } from './lettre.service';

@Module({
  controllers: [CvGeneratorController],
  providers: [CvGeneratorService, LettreService],
})
export class CvGeneratorModule {}
