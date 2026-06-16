import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../common/tokens';

@Injectable()
export class CineAdmRepository {
  constructor(
    @Inject(PG_POOL)
    private readonly db: Pool,
  ) {}

  async findAll() {
    const sql = `
      SELECT
        c.*,
        ci.nombre AS ciudad_nombre
      FROM cine c
      INNER JOIN ciudad ci
        ON ci.id = c.ciudad_id
      ORDER BY c.creado DESC
    `;

    const result = await this.db.query(sql);

    return result.rows;
  }

  async findById(id: string) {
    const sql = `
      SELECT
        c.*,
        ci.nombre AS ciudad_nombre
      FROM cine c
      INNER JOIN ciudad ci
        ON ci.id = c.ciudad_id
      WHERE c.id = $1
    `;

    const result = await this.db.query(sql, [id]);

    return result.rows[0] || null;
  }

  async create(data: any) {
    const sql = `
      INSERT INTO cine (
        ciudad_id,
        nombre,
        direccion,
        activo
      )
      VALUES (
        $1,$2,$3,$4
      )
      RETURNING *
    `;

    const result = await this.db.query(sql, [
      data.ciudad_id,
      data.nombre,
      data.direccion,
      data.activo ?? true,
    ]);

    return result.rows[0];
  }

  async update(id: string, data: any) {
    const sql = `
      UPDATE cine
      SET
        ciudad_id = $2,
        nombre = $3,
        direccion = $4,
        activo = $5,
        modificacion = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.db.query(sql, [
      id,
      data.ciudad_id,
      data.nombre,
      data.direccion,
      data.activo,
    ]);

    return result.rows[0];
  }

  async delete(id: string) {
    const sql = `
      DELETE FROM cine
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.db.query(sql, [id]);

    return result.rows[0];
  }

  async getCities() {
    const sql = `
      SELECT
        id,
        nombre
      FROM ciudad
      WHERE activa = TRUE
      ORDER BY nombre
    `;

    const result = await this.db.query(sql);

    return result.rows;
  }

  async getCinemasByCity(cityId: string) {
    const sql = `
      SELECT
        id,
        nombre,
        direccion,
        activo
      FROM cine
      WHERE ciudad_id = $1
      ORDER BY nombre
    `;

    const result = await this.db.query(sql, [cityId]);

    return result.rows;
  }
}