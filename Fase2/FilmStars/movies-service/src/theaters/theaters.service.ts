import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { THEATERS_REPOSITORY } from '../common/tokens';
import { ITheatersRepository } from './theaters.repository';
import { PublicTheater, TheaterRecord } from './theater.types';

// DIP: el servicio depende de la abstracción ITheatersRepository
export interface ITheatersService {
  listByCity(cityId: string): Promise<PublicTheater[]>;
  getById(id: string): Promise<PublicTheater>;
}

@Injectable()
export class TheatersService implements ITheatersService {
  constructor(@Inject(THEATERS_REPOSITORY) private readonly repo: ITheatersRepository) {}

  async listByCity(cityId: string): Promise<PublicTheater[]> {
    const theaters = await this.repo.findByCityId(cityId);
    return theaters.map(toPublicTheater);
  }

  async getById(id: string): Promise<PublicTheater> {
    const theater = await this.repo.findById(id);
    if (!theater) throw new AppError(404, 'Cine no encontrado', 'THEATER_NOT_FOUND');
    return toPublicTheater(theater);
  }
}

function toPublicTheater(t: TheaterRecord): PublicTheater {
  return { id: t.id, name: t.nombre, address: t.direccion, cityId: t.ciudadId };
}
