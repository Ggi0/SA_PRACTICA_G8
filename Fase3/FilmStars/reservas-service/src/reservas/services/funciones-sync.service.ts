import { Injectable } from '@nestjs/common';
import { EstadoAsientoFuncionRepository } from '../repositories/estado-asiento-funcion.repository';
import { InicializarFuncionAsientosDto } from '../dto/inicializar-funcion-asientos.dto';

@Injectable()
export class FuncionesSyncService {
  constructor(
    private readonly estadoAsientoRepository: EstadoAsientoFuncionRepository,
  ) {}

  async inicializarAsientosDeFuncion(dto: InicializarFuncionAsientosDto) {
    await this.estadoAsientoRepository.crearEstadosInicialesDeFuncion(
      dto.funcionId,
      dto.asientos,
    );

    return {
      ok: true,
      funcionId: dto.funcionId,
      totalAsientosRecibidos: dto.asientos.length,
    };
  }
}