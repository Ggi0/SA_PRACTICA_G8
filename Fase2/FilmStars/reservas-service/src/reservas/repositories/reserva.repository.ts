import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ReservaEntity } from '../entities/reserva.entity';
import { ReservaEstado } from '../../common/enums/reserva-estado.enum';

/**
 * SRP: Solo acceso a datos de "reserva"
 */
@Injectable()
export class ReservaRepository {
  constructor(
    @InjectRepository(ReservaEntity)
    private readonly repo: Repository<ReservaEntity>,
  ) {}

  async createReserva(data: Partial<ReservaEntity>): Promise<ReservaEntity> {
    const reserva = this.repo.create(data);
    return this.repo.save(reserva);
  }

  async findById(id: string): Promise<ReservaEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByUsuarioId(usuarioId: string): Promise<ReservaEntity[]> {
    return this.repo.find({
      where: { usuarioIdRef: usuarioId },
    });
  }

  async findPendientesExpiradas(): Promise<ReservaEntity[]> {
    return this.repo
      .createQueryBuilder('r')
      .where('r.estado = :estado', { estado: ReservaEstado.PENDIENTE })
      .andWhere('r.expira_en < NOW()')
      .getMany();
  }

  async save(reserva: ReservaEntity): Promise<ReservaEntity> {
    return this.repo.save(reserva);
  }
}