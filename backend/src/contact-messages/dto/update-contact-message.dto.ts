import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateContactMessageDto } from './create-contact-message.dto';

export class UpdateContactMessageDto extends PartialType(
  CreateContactMessageDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
