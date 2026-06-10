// src/payments/interfaces/payment-gateway.interface.ts

import { PagoEstado } from '../../common/enums/pago-estado.enum';

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

export interface PaymentGatewayRequest {
  pagoId: string;
  reservaId: string;
  usuarioId: string;
  monto: number;
  moneda: string;
  metodoPago: string;
}

export interface PaymentGatewayResponse {
  estado: PagoEstado;
  proveedorRef: string;
  mensaje: string;
  procesadoEn: Date;
}

export interface PaymentGatewayInterface {
  procesarPago(
    payload: PaymentGatewayRequest,
  ): Promise<PaymentGatewayResponse>;
}