import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || process.env.MOVIES_SERVICE_PORT || 3002),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5434),
    database: process.env.DB_NAME || 'filmstars_movies',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres123',
  },
};
