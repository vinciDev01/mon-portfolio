import { Controller, Get, NotFoundException, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/auth.guard';
import { CvGeneratorService } from './cv-generator.service';
import type { DocumentCv } from './cv-generator.service';

const TYPE_DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

@ApiTags('cv-generator')
@Controller('cv-generator')
export class CvGeneratorController {
  constructor(
    private readonly cvGeneratorService: CvGeneratorService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * PDF : reserve a l'administrateur.
   *
   * Il sert a l'envoi par courriel, pas a la publication. Le laisser public
   * sans lien depuis le site ne serait qu'une securite par l'obscurite :
   * l'adresse figure dans la documentation Swagger.
   */
  @Get('generate')
  @ApiOperation({ summary: 'Telecharger le CV au format PDF (administrateur)' })
  async generate(@Res() res: Response) {
    this.envoyer(
      res,
      await this.cvGeneratorService.generatePdf(),
      'application/pdf',
    );
  }

  /** Word, pour relecture depuis le backoffice avant publication. */
  @Get('generate.docx')
  @ApiOperation({ summary: 'Telecharger le CV au format Word (administrateur)' })
  async generateDocx(@Res() res: Response) {
    this.envoyer(res, await this.cvGeneratorService.generateDocx(), TYPE_DOCX);
  }

  /**
   * Word, publiquement telechargeable — mais seulement si la case
   * « CV telechargeable » est cochee dans les reglages du site.
   *
   * Le refus est un 404 et non un 403 : quand la section est desactivee, la
   * ressource n'existe pas pour un visiteur, et rien ne doit lui indiquer
   * qu'elle existerait dans une autre configuration.
   */
  @Public()
  @Get('public.docx')
  @ApiOperation({ summary: 'Telecharger le CV au format Word (site public)' })
  async publicDocx(@Res() res: Response) {
    const reglages = await this.prisma.siteSettings.findFirst({
      select: { showCvDownload: true },
    });
    if (!reglages?.showCvDownload) {
      throw new NotFoundException('CV indisponible');
    }
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
