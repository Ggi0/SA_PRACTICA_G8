import { Inject, Injectable } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import { PG_POOL } from '../common/tokens';
import { MovieFilters, MovieRecord, MovieType, 

  MoviePageFilters,
  MoviePageQueryResult,
 } from './movie.types';

// ISP: solo los métodos necesarios para el dominio de películas
export interface IMoviesRepository {
  findAll(filters: MovieFilters): Promise<MovieRecord[]>;

  findPage(filters: MoviePageFilters): Promise<MoviePageQueryResult>;

  findById(id: string): Promise<MovieRecord | null>;
}

@Injectable()
export class MoviesRepository implements IMoviesRepository {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}

  async findAll(filters: MovieFilters): Promise<MovieRecord[]> {
    const conditions: string[] = ['p.activa = TRUE'];
    const values: unknown[] = [];

    if (filters.category) {
      const dbTipo = categoryToDbType(filters.category);
      values.push(dbTipo);
      conditions.push(`p.tipo = $${values.length}`);
    }

    const sql = `
      SELECT
        p.id, p.titulo, p.sinopsis, p.duracion_min, p.clasificacion,
        p.poster_url, p.fecha_estreno, p.tipo, p.activa, p.creado, p.modificacion,
        COALESCE(
          ARRAY_AGG(g.nombre ORDER BY g.nombre) FILTER (WHERE g.nombre IS NOT NULL),
          '{}'
        ) AS generos
      FROM pelicula p
      LEFT JOIN pelicula_genero pg ON pg.pelicula_id = p.id
      LEFT JOIN genero g ON g.id = pg.genero_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY p.id
      ORDER BY p.fecha_estreno DESC
    `;

    const result = await this.db.query(sql, values);
    return result.rows.map(mapMovie);
  }



   /* NUEVO ENDPOINT PAGINADO
   * - pagina en servidor
   * - mantiene filtros
   * - máximo 10 por página
   * - cityId opcional usando EXISTS para no duplicar películas
   */
  async findPage(filters: MoviePageFilters): Promise<MoviePageQueryResult> {
    const conditions: string[] = ['p.activa = TRUE'];
    const values: unknown[] = [];

    if (filters.category) {
      const dbTipo = categoryToDbType(filters.category);
      values.push(dbTipo);
      conditions.push(`p.tipo = $${values.length}`);
    }

    // Filtro opcional por ciudad.
    // Se usa EXISTS para evitar duplicar películas si tienen muchas funciones/salas/cines.
    if (filters.cityId) {
      values.push(filters.cityId);
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM funcion f
          INNER JOIN sala s ON s.id = f.sala_id
          INNER JOIN cine c ON c.id = s.cine_id
          WHERE f.pelicula_id = p.id
            AND f.activa = TRUE
            AND s.activa = TRUE
            AND c.activo = TRUE
            AND c.ciudad_id = $${values.length}
        )
      `);
    }

    const whereClause = conditions.join(' AND ');
    const page = filters.page > 0 ? filters.page : 1;
    const limit = filters.limit > 0 ? Math.min(filters.limit, 10) : 10;
    const offset = (page - 1) * limit;

    /**
     * 1) Contar total filtrado
     */
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM pelicula p
      WHERE ${whereClause}
    `;

    const countResult = await this.db.query(countSql, values);
    const totalItems = countResult.rows[0]?.total ?? 0;

    /**
     * 2) Traer únicamente la página solicitada
     */
    const paginatedValues = [...values, limit, offset];

    const sql = `
      SELECT
        p.id,
        p.titulo,
        p.sinopsis,
        p.duracion_min,
        p.clasificacion,
        p.poster_url,
        p.fecha_estreno,
        p.tipo,
        p.activa,
        p.creado,
        p.modificacion,
        COALESCE(
          ARRAY_AGG(g.nombre ORDER BY g.nombre) FILTER (WHERE g.nombre IS NOT NULL),
          '{}'
        ) AS generos
      FROM pelicula p
      LEFT JOIN pelicula_genero pg ON pg.pelicula_id = p.id
      LEFT JOIN genero g ON g.id = pg.genero_id
      WHERE ${whereClause}
      GROUP BY p.id
      ORDER BY p.fecha_estreno DESC, p.creado DESC
      LIMIT $${paginatedValues.length - 1}
      OFFSET $${paginatedValues.length}
    `;

    const result = await this.db.query(sql, paginatedValues);

    return {
      items: result.rows.map(mapMovie),
      totalItems,
      page,
      limit,
    };
  }


  



  async findById(id: string): Promise<MovieRecord | null> {
    const sql = `
      SELECT
        p.id, p.titulo, p.sinopsis, p.duracion_min, p.clasificacion,
        p.poster_url, p.fecha_estreno, p.tipo, p.activa, p.creado, p.modificacion,
        COALESCE(
          ARRAY_AGG(g.nombre ORDER BY g.nombre) FILTER (WHERE g.nombre IS NOT NULL),
          '{}'
        ) AS generos
      FROM pelicula p
      LEFT JOIN pelicula_genero pg ON pg.pelicula_id = p.id
      LEFT JOIN genero g ON g.id = pg.genero_id
      WHERE p.id = $1 AND p.activa = TRUE
      GROUP BY p.id
    `;
    const result = await this.db.query(sql, [id]);
    return result.rows[0] ? mapMovie(result.rows[0]) : null;
  }
}



function categoryToDbType(category: string): MovieType {
  const map: Record<string, MovieType> = {
    ESTRENO: 'ESTRENO',
    PRE_VENTA: 'PREVENTA',
    RE_ESTRENO: 'REESTRENO',
  };
  return map[category] ?? 'ESTRENO';
}

function mapMovie(row: QueryResultRow): MovieRecord {
  return {
    id: row.id,
    titulo: row.titulo,
    sinopsis: row.sinopsis,
    duracionMin: row.duracion_min,
    clasificacion: row.clasificacion,
    posterUrl: row.poster_url,
    fechaEstreno: row.fecha_estreno
      ? new Date(row.fecha_estreno).toISOString().slice(0, 10)
      : null,
    tipo: row.tipo as MovieType,
    activa: row.activa,
    creado: row.creado,
    modificacion: row.modificacion,
    generos: Array.isArray(row.generos) ? row.generos : [],
  };
}
