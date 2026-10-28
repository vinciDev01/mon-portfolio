import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { rechercherLogos } from './catalogue-logos';

@ApiTags('logos')
@Controller('logos')
export class LogosController {
  @Get()
  @ApiOperation({ summary: 'Logos du catalogue dont le nom ressemble a la saisie (administrateur)' })
  @ApiQuery({ name: 'q', required: true, description: 'Nom de la technologie saisi' })
  rechercher(@Query('q') q = '') {
    return rechercherLogos(q.slice(0, 60));
  }
}
