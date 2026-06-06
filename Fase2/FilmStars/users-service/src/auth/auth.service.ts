import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppError } from '../common/app-error';
import { env } from '../config/env';
import { USER_SERVICE } from '../common/tokens';
import { IUserService, toPublicUser } from '../users/user.service';
import { PublicUser, UserRecord } from '../users/user.types';

export interface AuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(@Inject(USER_SERVICE) private readonly users: IUserService) {}

  async register(input: { nombre: string; email: string; password: string }): Promise<AuthResponse> {
    const user = await this.users.create(input, 'customer');
    const record = await this.users.getRecordById(user.id);
    return this.buildResponse(record);
  }

  async login(input: { email: string; password: string }): Promise<AuthResponse> {
    const user = await this.users.getRecordByEmail(input.email);
    if (!user) throw new AppError(401, 'Credenciales incorrectas', 'INVALID_CREDENTIALS');
    if (!user.activo) throw new AppError(403, 'Cliente inactivo', 'INACTIVE_CLIENT');

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) throw new AppError(401, 'Credenciales incorrectas', 'INVALID_CREDENTIALS');
    return this.buildResponse(user);
  }

  sign(user: UserRecord): string {
    const payload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    };
    return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as SignOptions);
  }

  private buildResponse(user: UserRecord): AuthResponse {
    return {
      access_token: this.sign(user),
      token_type: 'Bearer',
      expires_in: env.jwtExpiresIn,
      user: toPublicUser(user),
    };
  }
}
