// src/messaging/messaging.module.ts

import { Global, Module } from '@nestjs/common';

import { RabbitMqPublisher } from './rabbitmq.publisher';
import { MESSAGE_PUBLISHER } from './publisher.interface';

@Global()
@Module({
  providers: [
    RabbitMqPublisher,
    {
      provide: MESSAGE_PUBLISHER,
      useExisting: RabbitMqPublisher,
    },
  ],
  exports: [MESSAGE_PUBLISHER, RabbitMqPublisher],
})
export class MessagingModule {}