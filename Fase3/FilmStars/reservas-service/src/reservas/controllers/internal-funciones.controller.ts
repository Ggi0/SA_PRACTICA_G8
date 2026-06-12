import { Body, Controller, Post } from '@nestjs/common';
import { FuncionesSyncService } from '../services/funciones-sync.service';
import { InicializarFuncionAsientosDto } from '../dto/inicializar-funcion-asientos.dto';

@Controller('reservas/internal/funciones')
export class InternalFuncionesController {
  constructor(
    private readonly funcionesSyncService: FuncionesSyncService,
  ) {}

  /**
   * POST /reservas/internal/funciones/asientos
   * Recibe una función nueva creada en movies-service
   * y crea los estados iniciales de sus asientos.
   */
  @Post('asientos')
  async inicializarAsientos(@Body() dto: InicializarFuncionAsientosDto) {
    return this.funcionesSyncService.inicializarAsientosDeFuncion(dto);
  }
}