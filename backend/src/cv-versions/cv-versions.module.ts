import { Module } from '@nestjs/common';
import { CvVersionsController } from './cv-versions.controller';
import { CvVersionsService } from './cv-versions.service';

@Module({
  controllers: [CvVersionsController],
  providers: [CvVersionsService],
  exports: [CvVersionsService],
})
export class CvVersionsModule {}
