import { Inject, Injectable } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import { PG_POOL } from '../common/tokens';
import { CityRecord } from './city.types';

// ISP: solo los métodos necesarios para ciudades
export interface ICitiesRepository {
  findAll(): Promise<CityRecord[]>;
  findById(id: string): Promise<CityRecord | null>;
}

@Injectable()
export class CitiesRepository implements ICitiesRepository {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}

  async findAll(): Promise<CityRecord[]> {
    const result = await this.db.query(
      'SELECT * FROM ciudad WHERE activa = TRUE ORDER BY nombre ASC',
    );
    return result.rows.map(mapCity);
  }

  async findById(id: string): Promise<CityRecord | null> {
    const result = await this.db.query(
      'SELECT * FROM ciudad WHERE id = $1 AND activa = TRUE',
      [id],
    );
    return result.rows[0] ? mapCity(result.rows[0]) : null;
  }
}

function mapCity(row: QueryResultRow): CityRecord {
  return {
    id: row.id,
    nombre: row.nombre,
    activa: row.activa,
    creado: row.creado,
    modificacion: row.modificacion,
  };
}
