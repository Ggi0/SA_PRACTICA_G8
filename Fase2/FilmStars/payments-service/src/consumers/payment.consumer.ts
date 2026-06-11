// src/consumers/payment.consumer.ts

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as amqp from 'amqplib';

import { envConfig } from '../config/env.config';
import { PaymentsService } from '../payments/services/payments.service';
import { RABBITMQ_QUEUES } from '../messaging/rabbitmq.constants';

interface PaymentProcessMessage {
  reservaId: string;
  usuarioId: string;
  monto: number;
  moneda?: string;
  metodoPago: string;
  asientos?: string[];
}

@Injectable()
export class PaymentConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentConsumer.name);

  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = `amqp://${envConfig.rabbit.user}:${envConfig.rabbit.pass}@${envConfig.rabbit.host}:${envConfig.rabbit.port}/`;

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(RABBITMQ_QUEUES.PAYMENT_PROCESS, {
        durable: true,
      });

      // Consume de uno en uno para simplificar
      this.channel.prefetch(1);

      await this.channel.consume(
        RABBITMQ_QUEUES.PAYMENT_PROCESS,
        async (msg) => {
          if (!msg) return;

          try {
            const payload = JSON.parse(
              msg.content.toString(),
            ) as PaymentProcessMessage;

            this.logger.log(
              `Mensaje recibido en ${RABBITMQ_QUEUES.PAYMENT_PROCESS}: ${msg.content.toString()}`,
            );

            await this.paymentsService.procesarPagoDesdeEvento({
              reservaId: payload.reservaId,
              usuarioId: payload.usuarioId,
              monto: payload.monto,
              moneda: payload.moneda ?? 'GTQ',
              metodoPago: payload.metodoPago,
            });

            this.channel?.ack(msg);
          } catch (error) {
            this.logger.error(
              'Error procesando mensaje de payment_process_queue',
              error,
            );

            /**
             * Para evitar bucle infinito con mensajes malformados
             * o errores no recuperables, no reencolamos.
             */
            this.channel?.nack(msg, false, false);
          }
        },
        { noAck: false },
      );

      this.logger.log(
        `Consumer escuchando cola ${RABBITMQ_QUEUES.PAYMENT_PROCESS}`,
      );
    } catch (error) {
      this.logger.error('No se pudo conectar RabbitMQ consumer', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ consumer cerrado correctamente');
    } catch (error) {
      this.logger.error('Error cerrando consumer RabbitMQ', error);
    }
  }
}