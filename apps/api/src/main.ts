import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { corsOriginOption } from './common/cors';
import { uploadDir } from './uploads/uploads.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Uploaded job photos are served by path; the file names are random, so they are not guessable.
  app.useStaticAssets(uploadDir(), { prefix: '/uploads/' });
  app.enableCors({
    origin: corsOriginOption(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[MetroFix API] NestJS server active on http://localhost:${port}`);
}
bootstrap();
