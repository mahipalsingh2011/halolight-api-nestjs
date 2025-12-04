import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { AppModule } from '../src/app.module';
import { setupSwagger } from '../src/configs/swagger.config';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const expressApp = express();
// Patch ExpressAdapter to skip router inspection that relies on deprecated app.router getter
(ExpressAdapter as any).prototype.isMiddlewareApplied = () => false;
let app: INestApplication | null = null;

async function bootstrap(): Promise<INestApplication> {
  if (app) {
    return app;
  }

  app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn', 'log'],
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api', {
    exclude: ['/', '/health'],
  });

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Setup Swagger documentation
  setupSwagger(app);

  await app.init();
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await bootstrap();
  expressApp(req, res);
}
