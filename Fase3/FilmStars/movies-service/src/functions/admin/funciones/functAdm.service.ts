import { Inject, Injectable } from '@nestjs/common';

import {
  FUNCTIONS_ADMIN_REPOSITORY,
} from '../../../common/tokens';


import { ReservasSyncService } from './reservas-sync.service';


@Injectable()
export class FunctAdmService {
  constructor(
    @Inject(FUNCTIONS_ADMIN_REPOSITORY)
    private readonly repository: any,

    private readonly reservasSyncService: ReservasSyncService,

  ) {}

  getMoviesCatalog() {
    return this.repository.getMoviesCatalog();
  }

  getRoomsCatalog() {
    return this.repository.getRoomsCatalog();
  }

  findAll() {
    return this.repository.findAll();
  }

  findById(id: string) {
    return this.repository.findById(id);
  }

  findByMovie(movieId: string) {
    return this.repository.findByMovie(movieId);
  }

  findByRoom(roomId: string) {
    return this.repository.findByRoom(roomId);
  }

  findByDate(date: string) {
    return this.repository.findByDate(date);
  }

  
async create(data: any) {
    /**
     * 1) Crear la función en movies-service
     */
    const funcionCreada = await this.repository.create(data);

    /**
     * 2) Obtener los asientos de la sala de esa función
     */
    const salaId =
      funcionCreada?.sala_id ||
      funcionCreada?.salaId ||
      data?.sala_id ||
      data?.salaId;

    const asientosSala = await this.repository.findSeatsBySalaId(salaId);

    /**
     * 3) Mandar al reservations-service los asientos iniciales
     */
    try {
      await this.reservasSyncService.inicializarAsientosFuncion({
        funcionId: funcionCreada.id,
        asientos: asientosSala.map((a: any) => ({
          asientoId: a.id,
          codigo: a.codigo,
          fila: a.fila,
          numero: Number(a.numero),
        })),
      });
    } catch (error) {
      /**
       * COMPENSACIÓN SIMPLE:
       * si falla reservations-service, borramos la función recién creada
       * para no dejar inconsistencia entre microservicios.
       */
      await this.repository.delete(funcionCreada.id);
      throw error;
    }

    return funcionCreada;
  }


  update(id: string, data: any) {
    return this.repository.update(id, data);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }
}