import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { Public } from '../auth/auth.guard';
import { CoursService, type FichierCours } from './cours.service';
import { TAILLE_MAX_COURS } from './fichiers-cours';

@ApiTags('cours')
@Controller('cours')
export class CoursController {
  constructor(private readonly coursService: CoursService) {}

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
  async envoyerFichier(@UploadedFile() file: Express.Multer.File): Promise<FichierCours> {
    if (!file) throw new BadRequestException('Fichier requis');
    return this.coursService.enregistrerFichier(file.buffer);
  }

  /** Le telechargement, seule route publique des cours : elle verifie que le
   *  cours est public et compte le telechargement. */
  @Public()
  @Get(':id/telecharger')
  @ApiOperation({ summary: 'Telecharger le PDF d un cours public' })
  async telecharger(@Param('id') id: string, @Res() res: Response): Promise<void> {
    await this.coursService.telecharger(id, res);
  }
}
