
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { envConfig } from './env.config';

/**
 * Configuración de TypeORM para PostgreSQL.
 * Usa variables de entorno.
 */

console.log({
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
});


export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: envConfig.db.host,
  port: envConfig.db.port,
  username: envConfig.db.user,
  password: envConfig.db.pass,
  database: envConfig.db.name,

  /**
   * IMPORTANTE:
   * - No usamos synchronize porque ya tienes SQL manual.
   */
  synchronize: false,

  /**
   * Para desarrollo puedes dejar logs activos
   */
  logging: true,

  /**
   * Aquí luego registraremos entidades
   */
  autoLoadEntities: true,
};