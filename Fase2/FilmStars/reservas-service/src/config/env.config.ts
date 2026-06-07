import * as dotenv from 'dotenv';

dotenv.config();


/**
 * Configuración centralizada de variables de entorno.
 * Evita usar process.env por todo el proyecto.
 */


export const envConfig = {
  port: parseInt(process.env.PORT ?? '3003', 10),

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
  },

jwt: {
    secret: process.env.JWT_SECRET ?? 'filmstars_jwt_secret_key_2026',
  },

  reservation: {
    timeoutMinutes: parseInt(process.env.RESERVATION_TIMEOUT_MINUTES ?? '10', 10),
  },

};