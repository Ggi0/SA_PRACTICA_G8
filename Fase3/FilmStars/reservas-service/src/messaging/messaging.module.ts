import { Module, forwardRef } from '@nestjs/common';
import { RabbitMQPublisher } from './rabbitmq.publisher';
import { PaymentConsumer } from './payment.consumer';
import { ReservasModule } from '../reservas/reservas.module';
import { BoletoConsumer } from './boleto.consumer';

@Module({
  imports: [
    forwardRef(() => ReservasModule), // ✅ NECESARIO
  ],

  providers: [
    RabbitMQPublisher,
    PaymentConsumer,
    BoletoConsumer,
  ],

  exports: [
    RabbitMQPublisher,
  ],
})
export class MessagingModule {}