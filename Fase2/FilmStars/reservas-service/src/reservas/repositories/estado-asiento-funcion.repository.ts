import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { EstadoAsientoFuncionEntity } from '../entities/estado-asiento-funcion.entity';
import { AsientoEstado } from '../../common/enums/asiento-estado.enum';

/**
 * Repositorio encargado exclusivamente de acceso a datos
 * de la tabla estado_asiento_funcion.
 *
 * SRP:
 * Solo gestiona persistencia y consultas de asientos.
 */
@Injectable()
export class EstadoAsientoFuncionRepository {
  constructor(
    @InjectRepository(EstadoAsientoFuncionEntity)
    private readonly repo: Repository<EstadoAsientoFuncionEntity>,
  ) {}

  async findByFuncionId(funcionId: string): Promise<EstadoAsientoFuncionEntity[]> {
    return this.repo.find({
      where: { funcionIdRef: funcionId },
      order: {
        fila: 'ASC',
        numero: 'ASC',
      },
    });
  }

  async findDisponiblesByIds(ids: string[]): Promise<EstadoAsientoFuncionEntity[]> {
    return this.repo.find({
      where: {
        id: In(ids),
        estado: AsientoEstado.DISPONIBLE,
      },
    });
  }

  async findByReservaId(reservaId: string): Promise<EstadoAsientoFuncionEntity[]> {
    return this.repo.find({
      where: { reservaId },
      order: {
        fila: 'ASC',
        numero: 'ASC',
      },
    });
  }

  async bloquearAsientos(ids: string[], reservaId: string, expiraEn: Date): Promise<void> {
    await this.repo.update(
      { id: In(ids) },
      {
        estado: AsientoEstado.BLOQUEADO,
        reservaId,
        bloqueadoHasta: expiraEn,
      },
    );
  }

  async ocuparAsientos(ids: string[]): Promise<void> {
    await this.repo.update(
      { id: In(ids) },
      {
        estado: AsientoEstado.OCUPADO,
        bloqueadoHasta: undefined,
      },
    );
  }

  async liberarAsientosPorReserva(reservaId: string): Promise<void> {
    await this.repo.update(
      { reservaId },
      {
        estado: AsientoEstado.DISPONIBLE,
        reservaId:  undefined,
        bloqueadoHasta: undefined
      },
    );
  }

  async countDisponibilidad(funcionId: string) {
    const disponibles = await this.repo.count({
      where: {
        funcionIdRef: funcionId,
        estado: AsientoEstado.DISPONIBLE,
      },
    });

    const bloqueados = await this.repo.count({
      where: {
        funcionIdRef: funcionId,
        estado: AsientoEstado.BLOQUEADO,
      },
    });

    const ocupados = await this.repo.count({
      where: {
        funcionIdRef: funcionId,
        estado: AsientoEstado.OCUPADO,
      },
    });

    return {
      disponibles,
      bloqueados,
      ocupados,
    };
  }
}