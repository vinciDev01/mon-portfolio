import { Module } from '@nestjs/common';
import { TechnologyFamiliesController } from './technology-families.controller';
import { TechnologyFamiliesService } from './technology-families.service';

@Module({
  controllers: [TechnologyFamiliesController],
  providers: [TechnologyFamiliesService],
})
export class TechnologyFamiliesModule {}
