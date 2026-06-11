// src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { envConfig } from './config/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * Validaciones globales
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  /**
   * Verificar conexión DB
   */
  const dataSource = app.get(DataSource);

  try {
    if (dataSource.isInitialized) {
      console.log('Conexión a PostgreSQL (payments) OK');
      console.log(`DB: ${dataSource.options.database}`);
      console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    } else {
      console.error(' DataSource NO inicializado');
    }
  } catch (error) {
    console.error(' Error DB:', error);
  }

  /**
   * Levantar servidor
   */
  await app.listen(envConfig.port);

  console.log(` Payments Service corriendo en puerto ${envConfig.port}`);
}

bootstrap();