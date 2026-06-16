import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { PG_POOL } from '../../../common/tokens';
import {
  BulkMovieParsedRow,
  CsvRowError,
  GenreCatalogItem,
} from './csv.parser';

export interface BulkInsertResult {
  insertedCount: number;
  failedCount: number;
  failedRows: CsvRowError[];
}

@Injectable()
export class BulkRepository {
  constructor(
    @Inject(PG_POOL)
    private readonly db: Pool,
  ) {}

  async getGenresCatalog(): Promise<GenreCatalogItem[]> {
    const sql = `
      SELECT
        id,
        nombre
      FROM genero
      WHERE activo = TRUE
      ORDER BY nombre ASC
    `;

    const result = await this.db.query(sql);
    return result.rows;
  }

  async bulkInsertMovies(rows: BulkMovieParsedRow[]): Promise<BulkInsertResult> {
    if (!rows.length) {
      return {
        insertedCount: 0,
        failedCount: 0,
        failedRows: [],
      };
    }

    const client = await this.db.connect();
    let insertedCount = 0;
    const failedRows: CsvRowError[] = [];

    try {
      await client.query('BEGIN');

      const chunkSize = 250;

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);

        for (const row of chunk) {
          const savepointName = `sp_bulk_row_${row.rowNumber}`;

          await client.query(`SAVEPOINT ${savepointName}`);

          try {
            const movie = await this.insertMovie(client, row);

            if (row.generoIds.length > 0) {
              await this.insertMovieGenres(client, movie.id, row.generoIds);
            }

            insertedCount++;

            await client.query(`RELEASE SAVEPOINT ${savepointName}`);
          } catch (error: any) {
            await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
            await client.query(`RELEASE SAVEPOINT ${savepointName}`);

            failedRows.push({
              rowNumber: row.rowNumber,
              raw: row.raw,
              errors: [
                {
                  field: 'database',
                  message: this.mapPgError(error),
                },
              ],
            });
          }
        }
      }

      await client.query('COMMIT');

      return {
        insertedCount,
        failedCount: failedRows.length,
        failedRows,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertMovie(client: PoolClient, row: BulkMovieParsedRow) {
    const sql = `
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const params = [
      row.titulo,
      row.sinopsis,
      row.duracion_min,
      row.clasificacion,
      row.poster_url,
      row.fecha_estreno,
      row.tipo,
      row.activa,
    ];

    const result = await client.query(sql, params);
    return result.rows[0];
  }

  private async insertMovieGenres(
    client: PoolClient,
    movieId: string,
    genreIds: string[],
  ) {
    const valuesSql: string[] = [];
    const values: string[] = [];

    genreIds.forEach((genreId, index) => {
      const base = index * 2;
      valuesSql.push(`($${base + 1}, $${base + 2})`);
      values.push(movieId, genreId);
    });

    const sql = `
      INSERT INTO pelicula_genero (
        pelicula_id,
        genero_id
      )
      VALUES ${valuesSql.join(', ')}
    `;

    await client.query(sql, values);
  }

  private mapPgError(error: any): string {
    if (!error) {
      return 'Error desconocido al insertar en la base de datos';
    }

    if (error.code === '23514') {
      return `Violación de restricción: ${error.detail || error.message}`;
    }

    if (error.code === '23505') {
      return `Registro duplicado: ${error.detail || error.message}`;
    }

    if (error.code === '23503') {
      return `Referencia inválida: ${error.detail || error.message}`;
    }

    if (error.code === '23502') {
      return `Falta un campo obligatorio: ${error.column || error.message}`;
    }

    return error.detail || error.message || 'Error al insertar la fila';
  }
}