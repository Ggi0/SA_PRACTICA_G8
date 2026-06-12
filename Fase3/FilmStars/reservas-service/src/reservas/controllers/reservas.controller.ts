import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ReservasService } from '../services/reservas.service';
import { DisponibilidadService } from '../services/disponibilidad.service';

import { CrearReservaDto } from '../dto/crear-reserva.dto';
import { ConfirmarReservaDto } from '../dto/confirmar-reserva.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserId } from '../../common/decorators/user-id.decorator';

/**
 * Controller HTTP del dominio reservas.
 *
 * Responsabilidad:
 * - recibir requests
 * - validar DTOs
 * - aplicar guards
 * - delegar a services
 *
 * NO debe contener lógica compleja de negocio.
 */
@Controller('reservas')
export class ReservasController {
  constructor(
    private readonly reservasService: ReservasService,
    private readonly disponibilidadService: DisponibilidadService,
  ) {}

  /**
   * GET /reservas/funciones/:funcionId/asientos
   * Devuelve el mapa de asientos con su estado actual.
   */
  @Get('funciones/:funcionId/asientos')
  async obtenerMapaAsientos(@Param('funcionId') funcionId: string) {
    return this.disponibilidadService.obtenerMapaAsientos(funcionId);
  }

  /**
   * GET /reservas/funciones/:funcionId/disponibilidad
   * Devuelve resumen de asientos disponibles, bloqueados y ocupados.
   */
  @Get('funciones/:funcionId/disponibilidad')
  async obtenerDisponibilidad(@Param('funcionId') funcionId: string) {
    return this.disponibilidadService.obtenerResumenDisponibilidad(funcionId);
  }

  /**
   * GET /reservas/mis-reservas
   * Requiere JWT.
   *
   * IMPORTANTE:
   * Esta ruta debe estar antes de GET /reservas/:id
   * para evitar que Nest interprete "mis-reservas" como si fuera un :id.
   */
  @UseGuards(JwtAuthGuard)
  @Get('mis-reservas')
  async obtenerMisReservas(@UserId() usuarioId: string) {
    return this.reservasService.obtenerReservasDeUsuario(usuarioId);
  }

  /**
   * POST /reservas
   * Requiere JWT.
   * Crea una reserva PENDIENTE y bloquea asientos temporalmente.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async crearReserva(
    @UserId() usuarioId: string,
    @Body() dto: CrearReservaDto,
  ) {
    return this.reservasService.crearReserva(
      usuarioId,
      dto.funcionId,
      dto.asientos,
    );
  }

  /**
   * GET /reservas/:id
   * Consulta detalle de una reserva.
   *
   * En esta versión no se protege con JWT obligatorio,
   * pero si tu práctica exige privacidad fuerte,
   * puedes protegerlo y validar propietario.
   */
  @Get(':id')
  async obtenerReserva(@Param('id') id: string) {
    return this.reservasService.obtenerReservaPorId(id);
  }

  /**
   * DELETE /reservas/:id
   * Requiere JWT.
   * Solo permite cancelar una reserva del usuario autenticado.
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async cancelarReserva(
    @Param('id') id: string,
    @UserId() usuarioId: string,
  ) {
    return this.reservasService.cancelarReserva(id, usuarioId);
  }

  /**
   * POST /reservas/:id/confirmar
   * Endpoint normalmente pensado para uso interno o por eventos futuros.
   *
   * Lo dejamos habilitado para pruebas/manual,
   * pero más adelante podría protegerse con otro mecanismo interno.
   */
  @Post(':id/confirmar')
  async confirmarReserva(
    @Param('id') id: string,
    @Body() dto: ConfirmarReservaDto,
  ) {
    return this.reservasService.confirmarReserva(id, dto.referenciaPago);
  }
}