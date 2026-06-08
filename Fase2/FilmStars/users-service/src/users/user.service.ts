import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { USER_REPOSITORY } from '../common/tokens';
import { CreateUserInput, PublicUser, UpdateUserInput, UserFilters, UserRecord, UserRole } from './user.types';
import { IUserRepository } from './user.repository';

export interface IUserService {
  bootstrapDefaultAdmin(nombre: string, email: string, password: string): Promise<void>;
  list(filters: UserFilters): Promise<PublicUser[]>;
  getById(id: string): Promise<PublicUser>;
  getRecordById(id: string): Promise<UserRecord>;
  getRecordByEmail(email: string): Promise<UserRecord | null>;
  create(input: CreateUserInput, forcedRole?: UserRole): Promise<PublicUser>;
  update(id: string, input: UpdateUserInput): Promise<PublicUser>;
  changePassword(id: string, newPassword: string): Promise<void>;
  updateStatus(id: string, activo: boolean): Promise<PublicUser>;
  remove(id: string): Promise<void>;
}

@Injectable()
export class UserService implements IUserService {
  constructor(@Inject(USER_REPOSITORY) private readonly users: IUserRepository) {}

  async bootstrapDefaultAdmin(nombre: string, email: string, password: string): Promise<void> {
    const adminCount = await this.users.countAdmins();
    if (adminCount > 0) return;
    await this.create({ nombre, email, password }, 'admin');
  }

  async list(filters: UserFilters): Promise<PublicUser[]> {
    const users = await this.users.findAll(filters);
    return users.map(toPublicUser);
  }

  async getById(id: string): Promise<PublicUser> {
    return toPublicUser(await this.getRecordById(id));
  }

  async getRecordById(id: string): Promise<UserRecord> {
    const user = await this.users.findById(id);
    if (!user) throw new AppError(404, 'Cliente no encontrado', 'CLIENT_NOT_FOUND');
    return user;
  }

  async getRecordByEmail(email: string): Promise<UserRecord | null> {
    return this.users.findByEmail(email);
  }

  async create(input: CreateUserInput, forcedRole: UserRole = 'customer'): Promise<PublicUser> {
    validateCreate(input);
    const exists = await this.users.findByEmail(input.email);
    if (exists) throw new AppError(409, 'Ya existe un cliente con ese email', 'EMAIL_ALREADY_EXISTS');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.users.create({ ...input, passwordHash, rol: forcedRole });
    return toPublicUser(user);
  }

  async update(id: string, input: UpdateUserInput): Promise<PublicUser> {
    await this.getRecordById(id);
    validateUpdate(input);

    if (input.email) {
      const existing = await this.users.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new AppError(409, 'Ya existe otro cliente con ese email', 'EMAIL_ALREADY_EXISTS');
      }
    }

    const updated = await this.users.update(id, input);
    if (!updated) throw new AppError(404, 'Cliente no encontrado', 'CLIENT_NOT_FOUND');
    return toPublicUser(updated);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    await this.getRecordById(id);
    if (!newPassword || newPassword.length < 8) {
      throw new AppError(400, 'La nueva contrasena debe tener al menos 8 caracteres', 'INVALID_PASSWORD');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.users.updatePassword(id, passwordHash);
  }

  async updateStatus(id: string, activo: boolean): Promise<PublicUser> {
    await this.getRecordById(id);
    const updated = await this.users.updateStatus(id, activo);
    if (!updated) throw new AppError(404, 'Cliente no encontrado', 'CLIENT_NOT_FOUND');
    return toPublicUser(updated);
  }

  async remove(id: string): Promise<void> {
    await this.getRecordById(id);
    await this.users.softDelete(id);
  }
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    activo: user.activo,
    telefono: user.telefono,
    dpi: user.dpi,
    fechaNacimiento: user.fechaNacimiento,
    direccion: user.direccion,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function validateCreate(input: CreateUserInput): void {
  if (!input.nombre?.trim()) throw new AppError(400, 'El nombre es requerido', 'INVALID_NAME');
  if (!isValidEmail(input.email)) throw new AppError(400, 'El email debe ser valido', 'INVALID_EMAIL');
  if (!input.password || input.password.length < 8) {
    throw new AppError(400, 'La contrasena debe tener al menos 8 caracteres', 'INVALID_PASSWORD');
  }
}

function validateUpdate(input: UpdateUserInput): void {
  if (input.nombre !== undefined && !input.nombre.trim()) {
    throw new AppError(400, 'El nombre no puede quedar vacio', 'INVALID_NAME');
  }
  if (input.email !== undefined && !isValidEmail(input.email)) {
    throw new AppError(400, 'El email debe ser valido', 'INVALID_EMAIL');
  }
}

function isValidEmail(email?: string): boolean {
  return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
