import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/auth.guard';
import { CvGeneratorService } from './cv-generator.service';
import { LettreService, type PdfLettre } from './lettre.service';
import { enTeteParDefaut } from './lettre';
import type { DocumentCv } from './cv-generator.service';
import { ApercuCvDto } from './dto/apercu-cv.dto';
import { ApercuLettreDto } from './dto/apercu-lettre.dto';
import { UpdateCvVersionDto } from '../cv-versions/dto/update-cv-version.dto';
import { langueCv } from './langue-cv';

/** La langue du CV, en parametre de requete : `fr` par defaut, ou `en`. */
const QUERY_LANGUE = {
  name: 'langue',
  required: false,
  enum: ['fr', 'en'],
} as const;
/** Une version du CV ; sa langue prime alors sur `langue`. */
const QUERY_VERSION = {
  name: 'version',
  required: false,
  description: 'Identifiant d une version du CV',
} as const;

const TYPE_DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

@ApiTags('cv-generator')
@Controller('cv-generator')
export class CvGeneratorController {
  constructor(
    private readonly cvGeneratorService: CvGeneratorService,
    private readonly lettreService: LettreService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * L'en-tete des lettres pour le backoffice : celui enregistre, et celui
   * qu'on deduit des informations personnelles (prerempli tant que rien
   * n'est saisi, et repris par « Revenir a l'en-tete par defaut »).
   */
  @Get('lettre/en-tete')
  @ApiOperation({ summary: 'En-tete des lettres de motivation' })
  async enTeteLettre() {
    const [reglages, info] = await Promise.all([
      this.prisma.siteSettings.findFirst({
        select: { lettreEnTete: true, siteUrl: true },
      }),
      this.prisma.personalInfo.findFirst(),
    ]);
    return {
      enTete: reglages?.lettreEnTete ?? null,
      parDefaut: enTeteParDefaut(info, reglages?.siteUrl),
    };
  }

  /** La lettre de motivation d'une version, en PDF (administrateur). */
  @Get('lettre')
  @ApiOperation({ summary: 'Lettre de motivation PDF d une version' })
  @ApiQuery({ ...QUERY_VERSION, required: true })
  async lettre(@Query('version') version: string, @Res() res: Response) {
    this.envoyerLettre(res, await this.lettreService.pdf(version));
  }

  /**
   * L'apercu de l'editeur de lettre : le PDF de la saisie, sans rien
   * enregistrer. POST parce que la lettre voyage dans le corps.
   */
  @Post('lettre/apercu')
  @ApiOperation({ summary: 'Apercu PDF d une lettre en cours de saisie' })
  async apercuLettre(@Body() dto: ApercuLettreDto, @Res() res: Response) {
    this.envoyerLettre(
      res,
      await this.lettreService.apercu({
        langue: dto.langue ?? 'fr',
        enTete: dto.enTete,
        destinataire: dto.destinataire ?? null,
        lieu: dto.lieu ?? null,
        date: dto.date
          ? new Date(`${dto.date.slice(0, 10)}T00:00:00.000Z`)
          : null,
        objet: dto.objet ?? null,
        sections: dto.sections ?? [],
      }),
    );
  }

  /** La meme lettre, en Word, pour la retoucher avant l'envoi. */
  @Get('lettre.docx')
  @ApiOperation({ summary: 'Lettre de motivation Word d une version' })
  @ApiQuery({ ...QUERY_VERSION, required: true })
  async lettreDocx(@Query('version') version: string, @Res() res: Response) {
    this.envoyer(res, await this.lettreService.docx(version), TYPE_DOCX);
  }

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
      await this.cvGeneratorService.generatePdf(
        undefined,
        langueCv(langue),
        version || undefined,
      ),
      'application/pdf',
    );
  }

  /**
   * L'apercu de la page de modification d'une version : le CV de la saisie,
   * sans rien enregistrer. `id` : la version modifiee ; absent pour une
   * version a creer.
   */
  @Post('apercu-version')
  @ApiOperation({
    summary: 'Apercu PDF d une version du CV en cours de saisie',
  })
  @ApiQuery({ name: 'id', required: false })
  async apercuVersion(
    @Query('id') id: string | undefined,
    @Body() dto: UpdateCvVersionDto,
    @Res() res: Response,
  ) {
    this.envoyer(
      res,
      await this.cvGeneratorService.apercuVersion(id || undefined, {
        langue: dto.langue,
        titrePoste: dto.titrePoste,
        presentation: dto.presentation,
        sectionsMasquees: dto.sectionsMasquees,
        projetIds: dto.projetIds,
        technologieIds: dto.technologieIds,
        competenceIds: dto.competenceIds,
      }),
      'application/pdf',
    );
  }

  /**
   * L'apercu du backoffice : le PDF avec la section en cours de saisie, sans
   * rien enregistrer. POST parce que la section voyage dans le corps.
   */
  @Post('apercu')
  @ApiOperation({
    summary: 'Apercu du CV PDF avec une section brouillon (administrateur)',
  })
  async apercu(@Body() dto: ApercuCvDto, @Res() res: Response) {
    this.envoyer(
      res,
      await this.cvGeneratorService.generatePdf({
        id: dto.id,
        titre: dto.titre,
        lignes: dto.lignes,
        publique: dto.publique ?? true,
        // Une section pas encore creee prendra place en fin de CV.
        sortOrder: dto.sortOrder ?? Number.MAX_SAFE_INTEGER,
        format: dto.format,
      }),
      'application/pdf',
    );
  }

  /** Word, pour relecture depuis le backoffice avant publication. */
  @Get('generate.docx')
  @ApiOperation({
    summary: 'Telecharger le CV au format Word (administrateur)',
  })
  @ApiQuery(QUERY_LANGUE)
  @ApiQuery(QUERY_VERSION)
  async generateDocx(
    @Query('langue') langue: string | undefined,
    @Query('version') version: string | undefined,
    @Res() res: Response,
  ) {
    this.envoyer(
      res,
      await this.cvGeneratorService.generateDocx(
        langueCv(langue),
        version || undefined,
      ),
      TYPE_DOCX,
    );
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
  async publicDocx(
    @Query('langue') langue: string | undefined,
    @Res() res: Response,
  ) {
    const reglages = await this.prisma.siteSettings.findFirst({
      select: { showCvDownload: true },
    });
    if (!reglages?.showCvDownload) {
      throw new NotFoundException('CV indisponible');
    }
    this.envoyer(
      res,
      await this.cvGeneratorService.generateDocx(langueCv(langue)),
      TYPE_DOCX,
    );
  }

  /** Le PDF d'une lettre, avec son nombre de pages et la taille du corps
   *  retenue, que l'editeur affiche. */
  private envoyerLettre(res: Response, lettre: PdfLettre) {
    res.set({
      'X-Lettre-Pages': String(lettre.pages),
      'X-Lettre-Corps': String(lettre.mise.corps),
    });
    this.envoyer(res, lettre, 'application/pdf');
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
