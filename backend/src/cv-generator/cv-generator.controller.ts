import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CvGeneratorService } from './cv-generator.service';

@ApiTags('cv-generator')
@Controller('cv-generator')
export class CvGeneratorController {
  constructor(private readonly cvGeneratorService: CvGeneratorService) {}

  @Get('generate')
  @ApiOperation({ summary: 'Generate and download CV as PDF' })
  async generate(@Res() res: Response) {
    const buffer = await this.cvGeneratorService.generatePdf();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=CV.pdf',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
