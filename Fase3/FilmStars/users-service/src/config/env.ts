import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || process.env.USERS_SERVICE_PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || 'filmstars_jwt_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5433),
    database: process.env.DB_NAME || 'filmstars_users',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres123',
  },
  defaultAdmin: {
    nombre: process.env.DEFAULT_ADMIN_NAME || 'FilmStars Admin',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@filmstars.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin12345',
  },
};
