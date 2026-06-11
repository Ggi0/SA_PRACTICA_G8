import { Module, forwardRef } from '@nestjs/common';
import { RabbitMQPublisher } from './rabbitmq.publisher';
import { PaymentConsumer } from './payment.consumer';
import { ReservasModule } from '../reservas/reservas.module';

@Module({
  imports: [
    forwardRef(() => ReservasModule), // ✅ NECESARIO
  ],

  providers: [
    RabbitMQPublisher,
    PaymentConsumer,
  ],

  exports: [
    RabbitMQPublisher,
  ],
})
export class MessagingModule {}