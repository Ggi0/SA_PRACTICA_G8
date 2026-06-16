export type UserRole = 'admin' | 'customer';

export interface UserRecord {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: UserRole;
  activo: boolean;
  telefono: string | null;
  dpi: string | null;
  fechaNacimiento: string | null;
  direccion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  telefono: string | null;
  dpi: string | null;
  fechaNacimiento: string | null;
  direccion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  nombre: string;
  email: string;
  password: string;
  rol?: UserRole;
  telefono?: string | null;
  dpi?: string | null;
  fechaNacimiento?: string | null;
  direccion?: string | null;
}

export interface UpdateUserInput {
  nombre?: string;
  email?: string;
  telefono?: string | null;
  dpi?: string | null;
  fechaNacimiento?: string | null;
  direccion?: string | null;
}

export interface UserFilters {
  search?: string;
  activo?: boolean;
  rol?: UserRole;
}
