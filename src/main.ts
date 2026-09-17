// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Serve arquivos estáticos da pasta /public
  // (usado pela página de consulta pública via QR code das etiquetas)
  app.useStaticAssets(join(process.cwd(), 'public'));

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: isProduction
      ? allowedOrigins.length > 0
        ? allowedOrigins
        : false // produção sem origens configuradas => bloqueia tudo
      : true, // desenvolvimento => libera qualquer origem
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT || 3000);
  console.log(`Chef-Sys backend rodando na porta ${process.env.PORT || 3000}`);
}
bootstrap();
