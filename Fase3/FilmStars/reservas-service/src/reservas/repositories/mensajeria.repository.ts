import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MensajeriaEntity } from '../entities/mensajeria.entity';
import { MensajeriaEstado } from '../../common/enums/mensajeria-estado.enum';

/**
 * Outbox pattern (mensajes para eventos)
 */
@Injectable()
export class MensajeriaRepository {
  constructor(
    @InjectRepository(MensajeriaEntity)
    private readonly repo: Repository<MensajeriaEntity>,
  ) {}

  async guardarEvento(data: Partial<MensajeriaEntity>) {
    const evento = this.repo.create({
      ...data,
      estado: MensajeriaEstado.PENDIENTE,
    });

    return this.repo.save(evento);
  }

  async findPendientes() {
    return this.repo.find({
      where: { estado: MensajeriaEstado.PENDIENTE },
    });
  }

  async markPublicado(id: string) {
    await this.repo.update(id, {
      estado: MensajeriaEstado.PUBLICADO,
      fechaProcesado: new Date(),
    });
  }
}