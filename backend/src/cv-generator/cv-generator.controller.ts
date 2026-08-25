import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Res } from '@nestjs/common';
import { Public } from '../auth/auth.guard';
import { CvGeneratorService } from './cv-generator.service';
import type { DocumentCv } from './cv-generator.service';

const TYPE_DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

@ApiTags('cv-generator')
@Controller('cv-generator')
export class CvGeneratorController {
  constructor(private readonly cvGeneratorService: CvGeneratorService) {}

  /**
   * Le CV genere est public : c'est ce qui permet au site de le proposer sans
   * qu'un fichier soit televerse a la main, et de le garder toujours a jour.
   * Ce qu'il contient est gouverne par le drapeau `publique` de chaque section.
   */
  @Public()
  @Get('generate')
  @ApiOperation({ summary: 'Telecharger le CV au format PDF' })
  async generate(@Res() res: Response) {
    this.envoyer(res, await this.cvGeneratorService.generatePdf(), 'application/pdf');
  }

  @Public()
  @Get('generate.docx')
  @ApiOperation({ summary: 'Telecharger le CV au format Word' })
  async generateDocx(@Res() res: Response) {
    this.envoyer(res, await this.cvGeneratorService.generateDocx(), TYPE_DOCX);
  }

  private envoyer(res: Response, document: DocumentCv, type: string) {
    res.set({
      'Content-Type': type,
      // Le nom est compose depuis l'identite : un recruteur qui recoit dix
      // fichiers nommes « CV.pdf » ne retrouve pas le votre.
      'Content-Disposition': `attachment; filename="${document.nom}"`,
      'Content-Length': document.contenu.length,
    });
    res.end(document.contenu);
  }
}
