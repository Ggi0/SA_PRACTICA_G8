import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';

import {
  PG_POOL,
  FUNCTIONS_ADMIN_REPOSITORY,
} from '../../../common/tokens';

@Injectable()
export class FunctAdmRepository {
  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
  ) {}

  async getMoviesCatalog() {
    const result = await this.pool.query(`
      SELECT
        id,
        titulo,
        tipo,
        duracion_min AS "duracionMin",
        activa
      FROM pelicula
      ORDER BY titulo
    `);

    return result.rows;
  }

  async getRoomsCatalog() {
    const result = await this.pool.query(`
      SELECT
        s.id,
        s.nombre,
        s.tipo_sala AS "tipoSala",
        s.capacidad,

        json_build_object(
          'id', c.id,
          'nombre', c.nombre
        ) AS cine

      FROM sala s
      INNER JOIN cine c
        ON c.id = s.cine_id
      ORDER BY c.nombre, s.nombre
    `);

    return result.rows;
  }

  async findAll() {
    const result = await this.pool.query(`
      SELECT
        f.id,
        f.fecha_hora AS "fechaHora",
        f.precio_base AS "precioBase",
        f.activa,

        json_build_object(
          'id', p.id,
          'titulo', p.titulo,
          'tipo', p.tipo
        ) AS pelicula,

        json_build_object(
          'id', s.id,
          'nombre', s.nombre,
          'tipoSala', s.tipo_sala
        ) AS sala,

        json_build_object(
          'id', c.id,
          'nombre', c.nombre
        ) AS cine

      FROM funcion f
      INNER JOIN pelicula p
        ON p.id = f.pelicula_id
      INNER JOIN sala s
        ON s.id = f.sala_id
      INNER JOIN cine c
        ON c.id = s.cine_id

      ORDER BY f.fecha_hora DESC
    `);

    return result.rows;
  }

  async findById(id: string) {
    const result = await this.pool.query(
      `
      SELECT
        f.id,
        f.fecha_hora AS "fechaHora",
        f.precio_base AS "precioBase",
        f.activa,

        json_build_object(
          'id', p.id,
          'titulo', p.titulo,
          'tipo', p.tipo
        ) AS pelicula,

        json_build_object(
          'id', s.id,
          'nombre', s.nombre,
          'tipoSala', s.tipo_sala
        ) AS sala,

        json_build_object(
          'id', c.id,
          'nombre', c.nombre
        ) AS cine

      FROM funcion f
      INNER JOIN pelicula p
        ON p.id = f.pelicula_id
      INNER JOIN sala s
        ON s.id = f.sala_id
      INNER JOIN cine c
        ON c.id = s.cine_id

      WHERE f.id = $1
      `,
      [id],
    );

    return result.rows[0];
  }

  async findByMovie(movieId: string) {
    const result = await this.pool.query(
      `
      SELECT *
      FROM funcion
      WHERE pelicula_id = $1
      ORDER BY fecha_hora DESC
      `,
      [movieId],
    );

    return result.rows;
  }

  async findByRoom(roomId: string) {
    const result = await this.pool.query(
      `
      SELECT *
      FROM funcion
      WHERE sala_id = $1
      ORDER BY fecha_hora DESC
      `,
      [roomId],
    );

    return result.rows;
  }

  async findByDate(date: string) {
    const result = await this.pool.query(
      `
      SELECT *
      FROM funcion
      WHERE DATE(fecha_hora) = $1
      ORDER BY fecha_hora
      `,
      [date],
    );

    return result.rows;
  }

  async create(data: any) {
  const client = await this.pool.connect();

  try {
    await client.query('BEGIN');

    const movie = await client.query(
      `SELECT id FROM pelicula WHERE id = $1`,
      [data.peliculaId],
    );

    if (!movie.rowCount) {
      throw new BadRequestException('Película no existe');
    }

    const room = await client.query(
      `SELECT id FROM sala WHERE id = $1`,
      [data.salaId],
    );

    if (!room.rowCount) {
      throw new BadRequestException('Sala no existe');
    }

    const duplicated = await client.query(
      `
      SELECT id
      FROM funcion
      WHERE sala_id = $1
      AND fecha_hora = $2
      `,
      [data.salaId, data.fechaHora],
    );

    if (duplicated.rowCount) {
      throw new BadRequestException(
        'La sala ya tiene una función programada en ese horario',
      );
    }

    await client.query(
      `
      UPDATE pelicula
      SET tipo = $1,
          modificacion = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [data.tipo, data.peliculaId],
    );

    // ✅ CLAVE: RETURNING
    const result = await client.query(
      `
      INSERT INTO funcion
      (
        pelicula_id,
        sala_id,
        fecha_hora,
        precio_base,
        activa
      )
      VALUES ($1,$2,$3,45,$4)
      RETURNING
        id,
        pelicula_id,
        sala_id,
        fecha_hora,
        precio_base,
        activa
      `,
      [
        data.peliculaId,
        data.salaId,
        data.fechaHora,
        data.activa,
      ],
    );

    await client.query('COMMIT');

    return result.rows[0]; // ✅ IMPORTANTÍSIMO
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

  async update(id: string, data: any) {
    await this.pool.query(
      `
      UPDATE pelicula
      SET
        tipo = $1,
        modificacion = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [data.tipo, data.peliculaId],
    );

    await this.pool.query(
      `
      UPDATE funcion
      SET
        pelicula_id = $1,
        sala_id = $2,
        fecha_hora = $3,
        precio_base = 45,
        activa = $4,
        modificacion = CURRENT_TIMESTAMP
      WHERE id = $5
      `,
      [
        data.peliculaId,
        data.salaId,
        data.fechaHora,
        data.activa,
        id,
      ],
    );
  }

  async delete(id: string) {
    await this.pool.query(
      `
      DELETE FROM funcion
      WHERE id = $1
      `,
      [id],
    );
  }

  async findSeatsBySalaId(salaId: string) {
  const result = await this.pool.query(
    `
    SELECT
      id,
      codigo,
      fila,
      numero
    FROM asiento
    WHERE sala_id = $1
      AND activo = TRUE
    ORDER BY fila ASC, numero ASC
    `,
    [salaId],
  );

  return result.rows;
}

}