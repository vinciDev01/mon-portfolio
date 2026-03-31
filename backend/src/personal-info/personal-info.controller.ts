import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdatePersonalInfoDto } from './dto/update-personal-info.dto';
import { PersonalInfoService } from './personal-info.service';

@ApiTags('personal-info')
@Controller('personal-info')
export class PersonalInfoController {
  constructor(private readonly personalInfoService: PersonalInfoService) {}

  @Get()
  @ApiOperation({ summary: 'Get personal info' })
  findOne() {
    return this.personalInfoService.findOne();
  }

  @Patch()
  @ApiOperation({ summary: 'Update personal info' })
  update(@Body() dto: UpdatePersonalInfoDto) {
    return this.personalInfoService.update(dto);
  }
}
