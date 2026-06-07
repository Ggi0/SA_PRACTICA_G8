import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NextFunction, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import { AppModule } from './app.module';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
  };
}

const port = Number(process.env.PORT || process.env.API_GATEWAY_PORT || 8080);
const jwtSecret = process.env.JWT_SECRET || 'filmstars_jwt_secret_key_2026';
const usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://localhost:3001';
const moviesServiceUrl = process.env.MOVIES_SERVICE_URL || 'http://localhost:3002';

function jwtMiddleware(req: RequestWithUser, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      statusCode: 401,
      message: 'Token no proporcionado. Incluye Authorization: Bearer token',
    });
  }

  try {
    const payload = jwt.verify(authHeader.split(' ')[1], jwtSecret) as jwt.JwtPayload;
    req.user = {
      id: String(payload.sub),
      email: String(payload.email),
      nombre: String(payload.nombre),
      rol: String(payload.rol),
    };
    next();
  } catch {
    return res.status(401).json({ statusCode: 401, message: 'Token invalido o expirado' });
  }
}

function createUsersProxy(pathRewrite?: Record<string, string>) {
  return createProxyMiddleware({
    target: usersServiceUrl,
    changeOrigin: true,
    pathRewrite,
    onProxyReq: (proxyReq, req: RequestWithUser) => {
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Nombre', req.user.nombre);
        proxyReq.setHeader('X-User-Rol', req.user.rol);
      }
    },
  });
}

function createMoviesProxy() {
  return createProxyMiddleware({
    target: moviesServiceUrl,
    changeOrigin: true,
  });
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.use('/api/auth', createUsersProxy());
  app.use('/api/clientes', jwtMiddleware, createUsersProxy());
  app.use('/api/users', jwtMiddleware, createUsersProxy({ '^/api/users': '/api/clientes' }));

  // Movies service — rutas públicas (no requieren JWT para ver cartelera)
  app.use('/api/movies', createMoviesProxy());

  await app.listen(port);
  console.log(`API Gateway (NestJS) listening on http://localhost:${port}`);
  console.log(`Users Service upstream: ${usersServiceUrl}`);
}

bootstrap().catch((error) => {
  console.error('Unable to start api-gateway', error);
  process.exit(1);
});
