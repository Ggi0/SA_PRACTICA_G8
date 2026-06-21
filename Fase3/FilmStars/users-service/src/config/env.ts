import 'dotenv/config';
import { readFileSync } from 'fs';

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

export const env = {
  port: Number(process.env.PORT || process.env.USERS_SERVICE_PORT || 3001),
  jwtSecret: requiredSecret('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5433),
    database: process.env.DB_NAME || 'filmstars_users',
    user: process.env.DB_USER || 'postgres',
    password: requiredSecret('DB_PASS'),
  },
  defaultAdmin: {
    nombre: process.env.DEFAULT_ADMIN_NAME || 'FilmStars Admin',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@filmstars.com',
    password: requiredSecret('DEFAULT_ADMIN_PASSWORD'),
  },
};
