import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { CITIES_REPOSITORY } from '../common/tokens';
import { ICitiesRepository } from './cities.repository';
import { PublicCity } from './city.types';

// DIP: el servicio depende de la abstracción, no de la implementación concreta
export interface ICitiesService {
  list(): Promise<PublicCity[]>;
  getById(id: string): Promise<PublicCity>;
}

@Injectable()
export class CitiesService implements ICitiesService {
  constructor(@Inject(CITIES_REPOSITORY) private readonly repo: ICitiesRepository) {}

  async list(): Promise<PublicCity[]> {
    const cities = await this.repo.findAll();
    return cities.map(toPublicCity);
  }

  async getById(id: string): Promise<PublicCity> {
    const city = await this.repo.findById(id);
    if (!city) throw new AppError(404, 'Ciudad no encontrada', 'CITY_NOT_FOUND');
    return toPublicCity(city);
  }
}

function toPublicCity(city: { id: string; nombre: string }): PublicCity {
  return { id: city.id, name: city.nombre };
}
