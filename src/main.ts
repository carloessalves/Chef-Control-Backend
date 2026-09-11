import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT || 3000);
  console.log(`Chef-Sys backend rodando na porta ${process.env.PORT || 3000}`);
}
bootstrap();
