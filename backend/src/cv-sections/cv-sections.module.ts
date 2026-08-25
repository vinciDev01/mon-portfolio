import { Module } from '@nestjs/common';
import { CvSectionsController } from './cv-sections.controller';
import { CvSectionsService } from './cv-sections.service';

@Module({
  controllers: [CvSectionsController],
  providers: [CvSectionsService],
  exports: [CvSectionsService],
})
export class CvSectionsModule {}
