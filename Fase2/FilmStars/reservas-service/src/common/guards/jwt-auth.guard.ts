import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { envConfig } from '../../config/env.config';

/**
 * Guard sencillo para validar JWT.
 *
 * Este servicio NO autentica usuarios contra una base externa;
 * únicamente verifica firma y extrae usuarioId desde el token.
 *
 * Se asume que otro servicio generó el JWT.
 */
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
      const payload = jwt.verify(token, envConfig.jwt.secret) as jwt.JwtPayload & {
        sub?: string;
        usuarioId?: string;
        id?: string;
      };

      /**
       * Admitimos varias formas comunes de payload:
       * - usuarioId
       * - sub
       * - id
       *
       * Esto evita acoplar demasiado el servicio de reservas
       * a una implementación concreta del servicio de auth.
       */
      const usuarioId = payload.usuarioId ?? payload.sub ?? payload.id;

      if (!usuarioId) {
        throw new UnauthorizedException(
          'El token no contiene un identificador de usuario válido',
        );
      }

      request.user = {
        ...payload,
        usuarioId,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
