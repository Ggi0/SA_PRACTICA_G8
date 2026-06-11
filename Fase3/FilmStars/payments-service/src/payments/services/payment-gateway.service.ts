// src/payments/services/payment-gateway.service.ts

import { Injectable } from '@nestjs/common';
import { PagoEstado } from '../../common/enums/pago-estado.enum';
import {
  PaymentGatewayInterface,
  PaymentGatewayRequest,
  PaymentGatewayResponse,
} from '../interfaces/payment-gateway.interface';

@Injectable()
export class FakePaymentGatewayService implements PaymentGatewayInterface {
  /**
   * Simula una API externa de pagos.
   *
   * Reglas de prueba:
   * - TEST_APROBADO  => APROBADO
   * - TEST_RECHAZADO => RECHAZADO
   * - TEST_FALLIDO   => lanza error
   * - cualquier otro => APROBADO
   */
  async procesarPago(
    payload: PaymentGatewayRequest,
  ): Promise<PaymentGatewayResponse> {
    const metodo = payload.metodoPago.trim().toUpperCase();

    // pequeño delay artificial para simular un tercero
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (metodo === 'TEST_FALLIDO') {
      throw new Error('Fallo simulado del proveedor externo');
    }

    if (metodo === 'TEST_RECHAZADO') {
      return {
        estado: PagoEstado.RECHAZADO,
        proveedorRef: `fake-reject-${payload.pagoId}`,
        mensaje: 'Pago rechazado por el proveedor simulado',
        procesadoEn: new Date(),
      };
    }

    return {
      estado: PagoEstado.APROBADO,
      proveedorRef: `fake-ok-${payload.pagoId}`,
      mensaje: 'Pago aprobado por el proveedor simulado',
      procesadoEn: new Date(),
    };
  }
}