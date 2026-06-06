import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  app.getHttpAdapter().get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'users-service', framework: 'nestjs', timestamp: new Date().toISOString() });
  });

  await app.listen(env.port);
  console.log(`Users Service (NestJS) listening on http://localhost:${env.port}`);
}

bootstrap().catch((error) => {
  console.error('Unable to start users-service', error);
  process.exit(1);
});
