import { Module } from '@nestjs/common';
import { LogosController } from './logos.controller';

@Module({ controllers: [LogosController] })
export class LogosModule {}
