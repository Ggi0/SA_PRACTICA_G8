import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';

import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserId } from '../../common/decorators/user-id.decorator';


import { FilterBoletosDto } from '../dto/filter-boletos.dto';


@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * POST /payments
   * Protegido con JWT
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async crearPago(
    @UserId() usuarioId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    const pago =
      await this.paymentsService.crearYProcesarPago({
        ...dto,
        usuarioId, // ✅ lo tomamos del token
      });

    return {
      id: pago.id,
      estado: pago.estado,
      monto: pago.monto,
      moneda: pago.moneda,
      reservaId: pago.reservaIdRef,
      usuarioId: pago.usuarioIdRef,
      metodoPago: pago.metodoPago,
      proveedorRef: pago.proveedorRef,
      procesadoEn: pago.procesadoEn,
    };
  }

  /**
   * GET /payments/:id
   * También protegido
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getPago(@Param('id') id: string) {
    const pago =
      await this.paymentsService.getPagoById(id);

    return {
      id: pago.id,
      estado: pago.estado,
      monto: pago.monto,
      moneda: pago.moneda,
      reservaId: pago.reservaIdRef,
      usuarioId: pago.usuarioIdRef,
      metodoPago: pago.metodoPago,
      proveedorRef: pago.proveedorRef,
      procesadoEn: pago.procesadoEn,
    };
  }



@UseGuards(JwtAuthGuard)
@Get('boletos/mis-boletos')
async getMisBoletos(
  @UserId() usuarioId: string,
  @Query() filtros: FilterBoletosDto,
) {
  const boletos =
    await this.paymentsService.obtenerBoletosUsuario(
      usuarioId,
      filtros,
    );

  return boletos.map((b) => ({
    id: b.id,
    codigo: b.codigoBoleto,
    estado: b.estado,
    reservaId: b.reservaIdRef,
    creado: b.creado,
  }));
}


@UseGuards(JwtAuthGuard)
@Get('boletos/codigo/:codigo')
async buscarPorCodigo(
  @Param('codigo') codigo: string,
) {
  const boleto =
    await this.paymentsService.obtenerBoletosUsuarioPorCodigo(
      codigo,
    );

  return {
    id: boleto.id,
    codigo: boleto.codigoBoleto,
    estado: boleto.estado,
    reservaId: boleto.reservaIdRef,
    creado: boleto.creado,
  };
}



}