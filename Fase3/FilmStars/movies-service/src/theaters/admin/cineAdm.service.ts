import { Injectable } from '@nestjs/common';
import { AppError } from '../../common/app-error';
import { CineAdmRepository } from './cineAdm.repository';

@Injectable()
export class CineAdmService {
  constructor(
    private readonly repository: CineAdmRepository,
  ) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const cinema = await this.repository.findById(id);

    if (!cinema) {
      throw new AppError(
        404,
        'Cine no encontrado',
        'CINEMA_NOT_FOUND',
      );
    }

    return cinema;
  }

  async create(data: any) {
    return this.repository.create(data);
  }

  async update(id: string, data: any) {
    await this.findById(id);

    return this.repository.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);

    return this.repository.delete(id);
  }

  async getCities() {
    return this.repository.getCities();
  }

  async getCinemasByCity(cityId: string) {
    return this.repository.getCinemasByCity(cityId);
  }
}