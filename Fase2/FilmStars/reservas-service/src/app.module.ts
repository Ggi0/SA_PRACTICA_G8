
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { databaseConfig } from './config/database.config';
import { ReservasModule } from './reservas/reservas.module';


/**
 * Módulo principal de la aplicación
 */
@Module({
  imports: [
    /**
     * Carga variables de entorno automáticamente desde .env
     */
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    /**
     * Conexión a PostgreSQL usando TypeORM
     */
    TypeOrmModule.forRoot(databaseConfig),

    ReservasModule,
  ],
})
export class AppModule {}