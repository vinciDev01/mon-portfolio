import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const uploadsPath = path.resolve(__dirname, '..', '..', 'uploads');
  app.useStaticAssets(uploadsPath, { prefix: '/uploads' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Portfolio API')
    .setDescription('REST API for the portfolio backend')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`Application running on: http://localhost:${port}/api`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  console.log(`Static uploads served at: http://localhost:${port}/uploads`);
}

bootstrap();
