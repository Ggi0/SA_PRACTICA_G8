import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para obtener el usuarioId desde request.user
 * El JwtAuthGuard debe haber cargado previamente request.user
 */
export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.usuarioId;
  },
);