import { Injectable } from '@nestjs/common';
import { AppError } from '../../common/app-error';
import { MoviesAdmRepository } from './moviesAdm.repository';

@Injectable()
export class MoviesAdmService {
  constructor(
    private readonly repository: MoviesAdmRepository,
  ) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const movie = await this.repository.findById(id);

    if (!movie) {
      throw new AppError(
        404,
        'Película no encontrada',
        'MOVIE_NOT_FOUND',
      );
    }

    return movie;
  }

  async create(data: any) {
    return this.repository.create(data);
  }

  async update(id: string, data: any) {
    await this.findById(id);

    return this.repository.update(id, data);
  }

  async getGenres() {
    return this.repository.getGenres();
    }

  async delete(id: string) {
    await this.findById(id);

    return this.repository.delete(id);
  }
}