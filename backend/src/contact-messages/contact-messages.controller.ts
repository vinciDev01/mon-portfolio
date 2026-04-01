import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContactMessagesService } from './contact-messages.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';

@ApiTags('contact-messages')
@Controller('contact-messages')
export class ContactMessagesController {
  constructor(
    private readonly contactMessagesService: ContactMessagesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all contact messages' })
  findAll() {
    return this.contactMessagesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact message by ID' })
  findOne(@Param('id') id: string) {
    return this.contactMessagesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a contact message (public)' })
  create(@Body() dto: CreateContactMessageDto) {
    return this.contactMessagesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact message' })
  update(@Param('id') id: string, @Body() dto: UpdateContactMessageDto) {
    return this.contactMessagesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact message' })
  remove(@Param('id') id: string) {
    return this.contactMessagesService.remove(id);
  }
}
