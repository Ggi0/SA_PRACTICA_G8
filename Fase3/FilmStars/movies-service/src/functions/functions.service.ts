import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { FUNCTIONS_REPOSITORY } from '../common/tokens';
import { IFunctionsRepository } from './functions.repository';
import { FunctionFilters, FunctionRecord, PublicFunction } from './function.types';

export interface IFunctionsService {
  listByMovie(movieId: string, cityId?: string): Promise<PublicFunction[]>;
  getById(id: string): Promise<PublicFunction>;
}

@Injectable()
export class FunctionsService implements IFunctionsService {
  constructor(
    @Inject(FUNCTIONS_REPOSITORY) private readonly repo: IFunctionsRepository,
  ) {}

  async listByMovie(movieId: string, cityId?: string): Promise<PublicFunction[]> {
    const filters: FunctionFilters = { movieId, cityId };
    const functions = await this.repo.findAll(filters);
    return functions.map(toPublicFunction);
  }

  async getById(id: string): Promise<PublicFunction> {
    const fn = await this.repo.findById(id);
    if (!fn) throw new AppError(404, 'Función no encontrada', 'FUNCTION_NOT_FOUND');
    return toPublicFunction(fn);
  }
}

function toPublicFunction(fn: FunctionRecord): PublicFunction {
  return {
    id: fn.id,
    movieId: fn.peliculaId,
    roomId: fn.salaId,
    cinemaId: fn.cinemaId,
    cityId: fn.cityId,
    startTime: fn.fechaHora instanceof Date
      ? fn.fechaHora.toISOString()
      : new Date(fn.fechaHora).toISOString(),
    projectionType: fn.tipoSala,
    price: fn.precioBase,
    roomName: fn.salaNombre,
    cinemaName: fn.cineNombre,
  };
}