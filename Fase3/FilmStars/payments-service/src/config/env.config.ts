// src/config/env.config.ts

import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

function readSecret(name: string): string | undefined {
  const file = process.env[`${name}_FILE`];
  if (file) return readFileSync(file, 'utf8').trim();
  return process.env[name];
}

function requiredSecret(name: string): string {
  const value = readSecret(name);
  if (!value) throw new Error(`Missing required secret ${name} or ${name}_FILE`);
  return value;
}

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
    pass: requiredSecret('DB_PASS'),
  },

  jwt: {
    secret: requiredSecret('JWT_SECRET'),
  },

  rabbit: {
    host: process.env.RABBITMQ_HOST,
    port: parseInt(process.env.RABBITMQ_PORT ?? '5672', 10),
    user: process.env.RABBITMQ_USER,
    pass: requiredSecret('RABBITMQ_PASS'),
  },
};
