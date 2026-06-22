// src/payments/payments.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PagoEntity } from '../database/entities/pago.entity';
import { DetallePagoEntity } from '../database/entities/detalle-pago.entity';
import { BoletoEntity } from '../database/entities/boleto.entity';
import { ReembolsoEntity } from '../database/entities/reembolso.entity';
import { MensajeriaEntity } from '../database/entities/mensajeria.entity';

import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './services/payments.service';
import { PagoRepository } from './repositories/pago.repository';
import { DetallePagoRepository } from './repositories/detalle-pago.repository'
import { BoletoRepository } from './repositories/boleto.repository'

import { PAYMENT_GATEWAY } from './interfaces/payment-gateway.interface';
import { FakePaymentGatewayService } from './services/payment-gateway.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      PagoEntity,
      DetallePagoEntity,
      BoletoEntity,
      ReembolsoEntity,
      MensajeriaEntity,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PagoRepository,
    FakePaymentGatewayService,
    DetallePagoRepository,
    BoletoRepository,
    {
      provide: PAYMENT_GATEWAY,
      useExisting: FakePaymentGatewayService,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}