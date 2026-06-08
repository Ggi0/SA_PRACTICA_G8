// src/config/env.config.ts

import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Configuración centralizada de variables de entorno
 * usado en todo el payments-service
 */
export const envConfig = {
  port: parseInt(process.env.PORT ?? '3004', 10),

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

  rabbit: {
    host: process.env.RABBITMQ_HOST,
    port: parseInt(process.env.RABBITMQ_PORT ?? '5672', 10),
    user: process.env.RABBITMQ_USER,
    pass: process.env.RABBITMQ_PASS,
  },
};