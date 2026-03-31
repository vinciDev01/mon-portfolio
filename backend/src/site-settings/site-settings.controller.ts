import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { SiteSettingsService } from './site-settings.service';

@ApiTags('site-settings')
@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get site settings' })
  findOne() {
    return this.siteSettingsService.findOne();
  }

  @Patch()
  @ApiOperation({ summary: 'Update site settings' })
  update(@Body() dto: UpdateSiteSettingsDto) {
    return this.siteSettingsService.update(dto);
  }
}
