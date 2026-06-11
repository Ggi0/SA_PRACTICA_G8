import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../common/tokens';

@Injectable()
export class SalaAdmRepository {
  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
  ) {}

  async getCines() {
    const result = await this.pool.query(`
      SELECT
        c.id,
        c.nombre,
        c.direccion,
        ci.id as ciudad_id,
        ci.nombre as ciudad_nombre
      FROM cine c
      INNER JOIN ciudad ci
        ON ci.id = c.ciudad_id
      WHERE c.activo = TRUE
      ORDER BY c.nombre
    `);

    return result.rows;
  }

  async findAll() {
    const result = await this.pool.query(`
      SELECT
        s.id,
        s.nombre,
        s.capacidad,
        s.tipo_sala,
        s.activa,
        c.id as cine_id,
        c.nombre as cine_nombre
      FROM sala s
      INNER JOIN cine c
        ON c.id = s.cine_id
      ORDER BY c.nombre, s.nombre
    `);

    return result.rows;
  }

  async findByCinema(cineId: string) {
    const result = await this.pool.query(
      `
      SELECT
        id,
        nombre,
        capacidad,
        tipo_sala,
        activa
      FROM sala
      WHERE cine_id = $1
      ORDER BY nombre
      `,
      [cineId],
    );

    return result.rows;
  }

  async findById(id: string) {
    const result = await this.pool.query(
      `
      SELECT
        s.*,
        c.nombre as cine_nombre
      FROM sala s
      INNER JOIN cine c
        ON c.id = s.cine_id
      WHERE s.id = $1
      `,
      [id],
    );

    return result.rows[0];
  }

  async create(data: any) {
  const result = await this.pool.query(
    `
    INSERT INTO sala
    (
      cine_id,
      nombre,
      capacidad,
      tipo_sala,
      activa
    )
    VALUES
    (
      $1,$2,$3,$4,$5
    )
    RETURNING id
    `,
    [
      data.cineId,
      data.nombre,
      data.capacidad,
      data.tipoSala,
      data.activa,
    ],
  );

  const salaId = result.rows[0].id;

  await this.generateSeats(
    salaId,
    data.capacidad,
  );
}

  async update(
  id: string,
  data: any,
) {
  await this.pool.query(
    `
    UPDATE sala
    SET
      cine_id = $1,
      nombre = $2,
      capacidad = $3,
      tipo_sala = $4,
      activa = $5,
      modificacion = CURRENT_TIMESTAMP
    WHERE id = $6
    `,
    [
      data.cineId,
      data.nombre,
      data.capacidad,
      data.tipoSala,
      data.activa,
      id,
    ],
  );

  await this.pool.query(
    `
    DELETE FROM asiento
    WHERE sala_id = $1
    `,
    [id],
  );

  await this.generateSeats(
    id,
    data.capacidad,
  );
}

  async delete(id: string) {
    await this.pool.query(
      `
      DELETE FROM sala
      WHERE id = $1
      `,
      [id],
    );
  }


  private async generateSeats(
  salaId: string,
  capacidad: number,
) {
  const filas = ['A', 'B', 'C', 'D', 'E'];

  const asientosPorFila = Math.ceil(
    capacidad / filas.length,
  );

  let creados = 0;

  for (const fila of filas) {
    for (
      let numero = 1;
      numero <= asientosPorFila;
      numero++
    ) {
      if (creados >= capacidad) {
        return;
      }

      await this.pool.query(
        `
        INSERT INTO asiento
        (
          sala_id,
          fila,
          numero,
          codigo,
          tipo,
          activo
        )
        VALUES
        (
          $1,$2,$3,$4,'NORMAL',TRUE
        )
        `,
        [
          salaId,
          fila,
          numero,
          `${fila}${numero}`,
        ],
      );

      creados++;
    }
  }
}


}