import { Body, Controller, Get, NotFoundException, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/auth.guard';
import { CvGeneratorService } from './cv-generator.service';
import type { DocumentCv } from './cv-generator.service';
import { ApercuCvDto } from './dto/apercu-cv.dto';
import { langueCv } from './langue-cv';

/** La langue du CV, en parametre de requete : `fr` par defaut, ou `en`. */
const QUERY_LANGUE = { name: 'langue', required: false, enum: ['fr', 'en'] } as const;
/** Une version du CV ; sa langue prime alors sur `langue`. */
const QUERY_VERSION = { name: 'version', required: false, description: 'Identifiant d une version du CV' } as const;

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
  @ApiQuery(QUERY_LANGUE)
  @ApiQuery(QUERY_VERSION)
  async generate(
    @Query('langue') langue: string | undefined,
    @Query('version') version: string | undefined,
    @Res() res: Response,
  ) {
    this.envoyer(
      res,
      await this.cvGeneratorService.generatePdf(undefined, langueCv(langue), version || undefined),
      'application/pdf',
    );
  }

  /**
   * L'apercu du backoffice : le PDF avec la section en cours de saisie, sans
   * rien enregistrer. POST parce que la section voyage dans le corps.
   */
  @Post('apercu')
  @ApiOperation({ summary: 'Apercu du CV PDF avec une section brouillon (administrateur)' })
  async apercu(@Body() dto: ApercuCvDto, @Res() res: Response) {
    this.envoyer(
      res,
      await this.cvGeneratorService.generatePdf({
        id: dto.id,
        titre: dto.titre,
        lignes: dto.lignes,
        publique: dto.publique ?? true,
        sortOrder: dto.sortOrder ?? 0,
      }),
      'application/pdf',
    );
  }

  /** Word, pour relecture depuis le backoffice avant publication. */
  @Get('generate.docx')
  @ApiOperation({ summary: 'Telecharger le CV au format Word (administrateur)' })
  @ApiQuery(QUERY_LANGUE)
  @ApiQuery(QUERY_VERSION)
  async generateDocx(
    @Query('langue') langue: string | undefined,
    @Query('version') version: string | undefined,
    @Res() res: Response,
  ) {
    this.envoyer(res, await this.cvGeneratorService.generateDocx(langueCv(langue), version || undefined), TYPE_DOCX);
  }

  /**
   * Word, publiquement telechargeable, mais seulement si la case
   * « CV telechargeable » est cochee dans les reglages du site.
   *
   * Le refus est un 404 et non un 403 : quand la section est desactivee, la
   * ressource n'existe pas pour un visiteur, et rien ne doit lui indiquer
   * qu'elle existerait dans une autre configuration.
   */
  @Public()
  @Get('public.docx')
  @ApiOperation({ summary: 'Telecharger le CV au format Word (site public)' })
  @ApiQuery(QUERY_LANGUE)
  async publicDocx(@Query('langue') langue: string | undefined, @Res() res: Response) {
    const reglages = await this.prisma.siteSettings.findFirst({
      select: { showCvDownload: true },
    });
    if (!reglages?.showCvDownload) {
      throw new NotFoundException('CV indisponible');
    }
    this.envoyer(res, await this.cvGeneratorService.generateDocx(langueCv(langue)), TYPE_DOCX);
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
