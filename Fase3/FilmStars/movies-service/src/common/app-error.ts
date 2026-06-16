import { HttpException } from '@nestjs/common';

export class AppError extends HttpException {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = 'APP_ERROR',
  ) {
    super({ statusCode, code, message }, statusCode);
  }
}
