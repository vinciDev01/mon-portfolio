import { Module } from '@nestjs/common';
import { CvGeneratorController } from './cv-generator.controller';
import { CvGeneratorService } from './cv-generator.service';

@Module({
  controllers: [CvGeneratorController],
  providers: [CvGeneratorService],
})
export class CvGeneratorModule {}
