// src/consumers/consumers.module.ts

import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentConsumer } from './payment.consumer';

@Module({
  imports: [PaymentsModule],
  providers: [PaymentConsumer],
})
export class ConsumersModule {}