import { Inject, Injectable } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import { PG_POOL } from '../common/tokens';
import { TheaterRecord } from './theater.types';

// ISP: solo los métodos necesarios para cines
export interface ITheatersRepository {
  findByCityId(cityId: string): Promise<TheaterRecord[]>;
  findById(id: string): Promise<TheaterRecord | null>;
}

@Injectable()
export class TheatersRepository implements ITheatersRepository {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}

  async findByCityId(cityId: string): Promise<TheaterRecord[]> {
    const result = await this.db.query(
      'SELECT * FROM cine WHERE ciudad_id = $1 AND activo = TRUE ORDER BY nombre ASC',
      [cityId],
    );
    return result.rows.map(mapTheater);
  }

  async findById(id: string): Promise<TheaterRecord | null> {
    const result = await this.db.query(
      'SELECT * FROM cine WHERE id = $1 AND activo = TRUE',
      [id],
    );
    return result.rows[0] ? mapTheater(result.rows[0]) : null;
  }
}

function mapTheater(row: QueryResultRow): TheaterRecord {
  return {
    id: row.id,
    ciudadId: row.ciudad_id,
    nombre: row.nombre,
    direccion: row.direccion,
    activo: row.activo,
    creado: row.creado,
    modificacion: row.modificacion,
  };
}
