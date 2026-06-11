import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { envConfig } from '../../config/env.config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header requerido');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido');
    }

    try {
      const payload = jwt.verify(
        token,
        envConfig.jwt.secret,
      ) as jwt.JwtPayload & {
        sub?: string;
        usuarioId?: string;
        id?: string;
      };

      const usuarioId =
        payload.usuarioId ?? payload.sub ?? payload.id;

      if (!usuarioId) {
        throw new UnauthorizedException(
          'Token sin usuario válido',
        );
      }

      request.user = {
        ...payload,
        usuarioId,
      };

      return true;
    } catch {
      throw new UnauthorizedException(
        'Token inválido o expirado',
      );
    }
  }
}
