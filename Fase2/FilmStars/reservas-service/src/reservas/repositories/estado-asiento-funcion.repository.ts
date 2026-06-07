import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { EstadoAsientoFuncionEntity } from '../entities/estado-asiento-funcion.entity';
import { AsientoEstado } from '../../common/enums/asiento-estado.enum';

/**
 * Manejo del estado de los asientos (clave para concurrencia)
 */
@Injectable()
export class EstadoAsientoFuncionRepository {
  constructor(
    @InjectRepository(EstadoAsientoFuncionEntity)
    private readonly repo: Repository<EstadoAsientoFuncionEntity>,
  ) {}

  async findByFuncionId(funcionId: string) {
    return this.repo.find({
      where: { funcionIdRef: funcionId },
    });
  }

  async findDisponiblesByIds(ids: string[]) {
    return this.repo.find({
      where: {
        id: In(ids),
        estado: AsientoEstado.DISPONIBLE,
      },
    });
  }

  async bloquearAsientos(ids: string[], reservaId: string, expiraEn: Date) {
    await this.repo.update(
      { id: In(ids) },
      {
        estado: AsientoEstado.BLOQUEADO,
        reservaId,
        bloqueadoHasta: expiraEn,
      },
    );
  }

  async ocuparAsientos(ids: string[]) {
    await this.repo.update(
      { id: In(ids) },
      {
        estado: AsientoEstado.OCUPADO,
      },
    );
  }

  async liberarAsientosPorReserva(reservaId: string) {
    await this.repo.update(
      { reservaId },
      {
        estado: AsientoEstado.DISPONIBLE,
        reservaId: undefined,
        bloqueadoHasta: undefined,
      },
    );
  }

  async countDisponibilidad(funcionId: string) {
    const baseQuery = this.repo
      .createQueryBuilder('a')
      .where('a.funcion_id_ref = :funcionId', { funcionId });

    const disponibles = await baseQuery
      .andWhere('a.estado = :estado', { estado: AsientoEstado.DISPONIBLE })
      .getCount();

    const bloqueados = await baseQuery
      .andWhere('a.estado = :estado', { estado: AsientoEstado.BLOQUEADO })
      .getCount();

    const ocupados = await baseQuery
      .andWhere('a.estado = :estado', { estado: AsientoEstado.OCUPADO })
      .getCount();

    return { disponibles, bloqueados, ocupados };
  }
}