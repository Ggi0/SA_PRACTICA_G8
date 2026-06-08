// src/common/decorators/user-id.decorator.ts// src/common/decorators/user-id.decor 

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserId = createParamDecorator(
  (_, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.usuarioId;
  },
);


