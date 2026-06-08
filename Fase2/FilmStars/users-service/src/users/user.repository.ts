import { Inject, Injectable } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import { randomUUID } from 'crypto';
import { PG_POOL } from '../common/tokens';
import { CreateUserInput, UpdateUserInput, UserFilters, UserRecord, UserRole } from './user.types';

export interface IUserRepository {
  initialize(): Promise<void>;
  countAdmins(): Promise<number>;
  findAll(filters: UserFilters): Promise<UserRecord[]>;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(input: CreateUserInput & { passwordHash: string; rol: UserRole }): Promise<UserRecord>;
  update(id: string, input: UpdateUserInput): Promise<UserRecord | null>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  updateStatus(id: string, activo: boolean): Promise<UserRecord | null>;
  softDelete(id: string): Promise<void>;
}

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}

  async initialize(): Promise<void> {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'customer')) DEFAULT 'customer',
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        telefono VARCHAR(30),
        dpi VARCHAR(30),
        fecha_nacimiento DATE,
        direccion TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await this.db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
      ON users (LOWER(email));
    `);
  }

  async countAdmins(): Promise<number> {
    const result = await this.db.query('SELECT COUNT(*)::int AS total FROM users WHERE rol = $1', ['admin']);
    return result.rows[0]?.total ?? 0;
  }

  async findAll(filters: UserFilters): Promise<UserRecord[]> {
    const where: string[] = [];
    const values: unknown[] = [];

    if (typeof filters.activo === 'boolean') {
      values.push(filters.activo);
      where.push(`activo = $${values.length}`);
    }

    if (filters.rol) {
      values.push(filters.rol);
      where.push(`rol = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search.toLowerCase()}%`);
      where.push(`(LOWER(nombre) LIKE $${values.length} OR LOWER(email) LIKE $${values.length} OR COALESCE(dpi, '') LIKE $${values.length})`);
    }

    const sql = `
      SELECT * FROM users
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(sql, values);
    return result.rows.map(mapUser);
  }

  async findById(id: string): Promise<UserRecord | null> {
    const result = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async create(input: CreateUserInput & { passwordHash: string; rol: UserRole }): Promise<UserRecord> {
    const result = await this.db.query(
      `
      INSERT INTO users (id, nombre, email, password_hash, rol, telefono, dpi, fecha_nacimiento, direccion)
      VALUES ($1, $2, LOWER($3), $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        randomUUID(),
        input.nombre.trim(),
        input.email.trim(),
        input.passwordHash,
        input.rol,
        input.telefono ?? null,
        input.dpi ?? null,
        input.fechaNacimiento ?? null,
        input.direccion ?? null,
      ],
    );
    return mapUser(result.rows[0]);
  }

  async update(id: string, input: UpdateUserInput): Promise<UserRecord | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    addUpdate(updates, values, 'nombre', input.nombre?.trim());
    addUpdate(updates, values, 'email', input.email ? input.email.trim().toLowerCase() : undefined);
    addUpdate(updates, values, 'telefono', input.telefono);
    addUpdate(updates, values, 'dpi', input.dpi);
    addUpdate(updates, values, 'fecha_nacimiento', input.fechaNacimiento);
    addUpdate(updates, values, 'direccion', input.direccion);

    if (!updates.length) {
      return this.findById(id);
    }

    values.push(id);
    const result = await this.db.query(
      `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
      `,
      values,
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, id]);
  }

  async updateStatus(id: string, activo: boolean): Promise<UserRecord | null> {
    const result = await this.db.query(
      'UPDATE users SET activo = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [activo, id],
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async softDelete(id: string): Promise<void> {
    await this.updateStatus(id, false);
  }
}

function addUpdate(updates: string[], values: unknown[], column: string, value: unknown): void {
  if (value !== undefined) {
    values.push(value);
    updates.push(`${column} = $${values.length}`);
  }
}

function mapUser(row: QueryResultRow): UserRecord {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    passwordHash: row.password_hash,
    rol: row.rol,
    activo: row.activo,
    telefono: row.telefono,
    dpi: row.dpi,
    fechaNacimiento: row.fecha_nacimiento ? new Date(row.fecha_nacimiento).toISOString().slice(0, 10) : null,
    direccion: row.direccion,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
