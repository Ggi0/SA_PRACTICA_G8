import { Inject, Injectable } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import { PG_POOL } from '../common/tokens';
import { FunctionFilters, FunctionRecord } from './function.types';

export interface IFunctionsRepository {
  findAll(filters: FunctionFilters): Promise<FunctionRecord[]>;
  findById(id: string): Promise<FunctionRecord | null>;
}

const BASE_QUERY = `
  SELECT
    f.id, f.pelicula_id, f.sala_id, f.fecha_hora, f.precio_base, f.activa,
    s.tipo_sala,
    s.nombre AS sala_nombre,
    c.id AS cinema_id,
    c.nombre AS cine_nombre,
    ci.id AS city_id
  FROM funcion f
  INNER JOIN sala s ON s.id = f.sala_id
  INNER JOIN cine c ON c.id = s.cine_id
  INNER JOIN ciudad ci ON ci.id = c.ciudad_id
  WHERE f.activa = TRUE
`;

@Injectable()
export class FunctionsRepository implements IFunctionsRepository {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}

  async findAll(filters: FunctionFilters): Promise<FunctionRecord[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.movieId) {
      values.push(filters.movieId);
      conditions.push(`f.pelicula_id = $${values.length}`);
    }

    if (filters.cityId) {
      values.push(filters.cityId);
      conditions.push(`ci.id = $${values.length}`);
    }

    const where = conditions.length ? ` AND ${conditions.join(' AND ')}` : '';
    const sql = `${BASE_QUERY}${where} ORDER BY f.fecha_hora ASC`;

    const result = await this.db.query(sql, values);
    return result.rows.map(mapFunction);
  }

  async findById(id: string): Promise<FunctionRecord | null> {
    const result = await this.db.query(
      `${BASE_QUERY} AND f.id = $1`,
      [id],
    );
    return result.rows[0] ? mapFunction(result.rows[0]) : null;
  }
}

function mapFunction(row: QueryResultRow): FunctionRecord {
  return {
    id: row.id,
    peliculaId: row.pelicula_id,
    salaId: row.sala_id,
    cinemaId: row.cinema_id,
    cityId: row.city_id,
    fechaHora: row.fecha_hora,
    precioBase: parseFloat(row.precio_base),
    tipoSala: row.tipo_sala,
    activa: row.activa,
    salaNombre: row.sala_nombre,
    cineNombre: row.cine_nombre,
  };
}