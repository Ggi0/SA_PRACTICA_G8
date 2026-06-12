import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SALAS_ADMIN_REPOSITORY,
} from '../../../common/tokens';
import { SalaAdmRepository } from './salaAdm.repository';

@Injectable()
export class SalaAdmService {
  constructor(
    @Inject(SALAS_ADMIN_REPOSITORY)
    private readonly repository: SalaAdmRepository,
  ) {}

  getCines() {
    return this.repository.getCines();
  }

  getAll() {
    return this.repository.findAll();
  }

  getByCinema(cineId: string) {
    return this.repository.findByCinema(cineId);
  }

  async getById(id: string) {
    const sala = await this.repository.findById(id);

    if (!sala) {
      throw new NotFoundException('Sala no encontrada');
    }

    return sala;
  }

  async create(data: any) {
    await this.repository.create(data);

    return {
      message: 'Sala creada correctamente',
    };
  }

  async update(id: string, data: any) {
    await this.getById(id);

    await this.repository.update(id, data);

    return {
      message: 'Sala actualizada correctamente',
    };
  }

  async delete(id: string) {
    await this.getById(id);

    await this.repository.delete(id);

    return {
      message: 'Sala eliminada correctamente',
    };
  }
}