// src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { databaseConfig } from './config/database.config';

/**
 * Módulo principal del payments-service
 */
@Module({
  imports: [
    /**
     * Variables de entorno globales
     */
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    /**
     * Conexión a PostgreSQL
     */
    TypeOrmModule.forRoot(databaseConfig),
  ],
})
export class AppModule {}