import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserId } from '../../common/decorators/user-id.decorator';

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
}