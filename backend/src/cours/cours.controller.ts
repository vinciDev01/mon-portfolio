import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { Public } from '../auth/auth.guard';
import { CoursService, type FichierCours } from './cours.service';
import { TAILLE_MAX_COURS } from './fichiers-cours';
import { CreateCoursDto } from './dto/create-cours.dto';
import { UpdateCoursDto } from './dto/update-cours.dto';

@ApiTags('cours')
@Controller('cours')
export class CoursController {
  constructor(private readonly coursService: CoursService) {}

  @Get()
  @ApiOperation({
    summary: 'Tous les cours, publics et masques (administrateur)',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Recherche : chaque mot dans le titre, la description, la technologie ou la famille',
  })
  findAll(@Query('q') q?: string) {
    return this.coursService.findAll(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Un cours (administrateur)' })
  findOne(@Param('id') id: string) {
    return this.coursService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Creer un cours (administrateur)' })
  create(@Body() dto: CreateCoursDto) {
    return this.coursService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un cours (administrateur)' })
  update(@Param('id') id: string, @Body() dto: UpdateCoursDto) {
    return this.coursService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un cours et son PDF (administrateur)' })
  remove(@Param('id') id: string) {
    return this.coursService.remove(id);
  }

  /** L'envoi d'un PDF de cours, reserve a l'administrateur. Le fichier est
   *  verifie a sa signature par le service, pas a son type declare. */
  @Post('fichier')
  @ApiOperation({ summary: 'Envoyer le PDF d un cours (administrateur)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: TAILLE_MAX_COURS },
    }),
  )
  async envoyerFichier(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FichierCours> {
    if (!file) throw new BadRequestException('Fichier requis');
    return this.coursService.enregistrerFichier(file.buffer);
  }

  /** Le telechargement, seule route publique des cours : elle verifie que le
   *  cours est public et compte le telechargement. */
  @Public()
  @Get(':id/telecharger')
  @ApiOperation({ summary: 'Telecharger le PDF d un cours public' })
  async telecharger(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.coursService.telecharger(id, res);
  }
}
