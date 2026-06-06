import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser } from '../common/auth-user';

export interface RequestWithUser extends Request {
  user?: AuthUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const payload = jwt.verify(header.split(' ')[1], env.jwtSecret) as jwt.JwtPayload;
      request.user = {
        id: String(payload.sub),
        email: String(payload.email),
        nombre: String(payload.nombre),
        rol: payload.rol === 'admin' ? 'admin' : 'customer',
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token invalido o expirado');
    }
  }
}
