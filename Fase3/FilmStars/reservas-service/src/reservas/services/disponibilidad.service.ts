import { Injectable } from '@nestjs/common';
import { EstadoAsientoFuncionRepository } from '../repositories/estado-asiento-funcion.repository';

/**
 * Service dedicado únicamente a consultas de disponibilidad.
 *
 * SRP:
 * no crea ni modifica reservas,
 * solo consulta disponibilidad y mapa de asientos.
 */
@Injectable()
export class DisponibilidadService {
  constructor(
    private readonly estadoAsientoRepository: EstadoAsientoFuncionRepository,
  ) {}

  /**
   * Devuelve el mapa de asientos de una función.
   */
  async obtenerMapaAsientos(funcionId: string) {
    const asientos = await this.estadoAsientoRepository.findByFuncionId(funcionId);

    return {
      funcionId,
      asientos: asientos.map((a) => ({
        id: a.id,
        codigo: a.codigoAsiento,
        fila: a.fila,
        numero: a.numero,
        estado: a.estado,
      })),
    };
  }

  /**
   * Devuelve un resumen de disponibilidad.
   */
  async obtenerResumenDisponibilidad(funcionId: string) {
    const resumen = await this.estadoAsientoRepository.countDisponibilidad(funcionId);

    return {
      funcionId,
      ...resumen,
    };
  }
}
