import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../common/tokens';

@Injectable()
export class MoviesAdmRepository {
  constructor(
    @Inject(PG_POOL)
    private readonly db: Pool,
  ) {}

  async findAll() {
  const sql = `
    SELECT
      p.*,

      COALESCE(
        json_agg(
          json_build_object(
            'id', g.id,
            'nombre', g.nombre
          )
        ) FILTER (WHERE g.id IS NOT NULL),
        '[]'
      ) AS generos

    FROM pelicula p

    LEFT JOIN pelicula_genero pg
      ON pg.pelicula_id = p.id

    LEFT JOIN genero g
      ON g.id = pg.genero_id

    GROUP BY p.id
    ORDER BY p.creado DESC
  `;

  const result = await this.db.query(sql);

  return result.rows;
}

  async findById(id: string) {
  const sql = `
    SELECT
      p.*,

      COALESCE(
        json_agg(
          json_build_object(
            'id', g.id,
            'nombre', g.nombre
          )
        ) FILTER (WHERE g.id IS NOT NULL),
        '[]'
      ) AS generos

    FROM pelicula p

    LEFT JOIN pelicula_genero pg
      ON pg.pelicula_id = p.id

    LEFT JOIN genero g
      ON g.id = pg.genero_id

    WHERE p.id = $1

    GROUP BY p.id
  `;

  const result = await this.db.query(sql, [id]);

  return result.rows[0] || null;
}

  async create(data: any) {
  const client = await this.db.connect();

  try {
    await client.query('BEGIN');

    const movieResult = await client.query(
      `
      INSERT INTO pelicula (
        titulo,
        sinopsis,
        duracion_min,
        clasificacion,
        poster_url,
        fecha_estreno,
        tipo,
        activa
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8
      )
      RETURNING *
      `,
      [
        data.titulo,
        data.sinopsis,
        data.duracion_min,
        data.clasificacion,
        data.poster_url,
        data.fecha_estreno,
        data.tipo,
        data.activa ?? true,
      ],
    );

    const movie = movieResult.rows[0];

    if (Array.isArray(data.generos)) {
      for (const generoId of data.generos) {
        await client.query(
          `
          INSERT INTO pelicula_genero (
            pelicula_id,
            genero_id
          )
          VALUES ($1,$2)
          `,
          [movie.id, generoId],
        );
      }
    }

    await client.query('COMMIT');

    return this.findById(movie.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

  async update(id: string, data: any) {
  const client = await this.db.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `
      UPDATE pelicula
      SET
        titulo = $2,
        sinopsis = $3,
        duracion_min = $4,
        clasificacion = $5,
        poster_url = $6,
        fecha_estreno = $7,
        tipo = $8,
        activa = $9,
        modificacion = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [
        id,
        data.titulo,
        data.sinopsis,
        data.duracion_min,
        data.clasificacion,
        data.poster_url,
        data.fecha_estreno,
        data.tipo,
        data.activa,
      ],
    );

    await client.query(
      `
      DELETE FROM pelicula_genero
      WHERE pelicula_id = $1
      `,
      [id],
    );

    if (Array.isArray(data.generos)) {
      for (const generoId of data.generos) {
        await client.query(
          `
          INSERT INTO pelicula_genero (
            pelicula_id,
            genero_id
          )
          VALUES ($1,$2)
          `,
          [id, generoId],
        );
      }
    }

    await client.query('COMMIT');

    return this.findById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

  async delete(id: string) {
    const sql = `
      DELETE FROM pelicula
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.db.query(sql, [id]);
    return result.rows[0];
  }

  async getGenres() {
  const sql = `
    SELECT
      id,
      nombre
    FROM genero
    WHERE activo = TRUE
    ORDER BY nombre
  `;

  const result = await this.db.query(sql);

  return result.rows;
}
}