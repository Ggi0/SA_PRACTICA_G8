import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ReservasService } from '../reservas/services/reservas.service';
import { envConfig } from '../config/env.config';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class PaymentConsumer implements OnModuleInit {
  constructor(
    @Inject(forwardRef(() => ReservasService))
    private readonly reservasService: ReservasService,
  ) {}

  async onModuleInit() {
    const connection = await amqp.connect(
      `amqp://${envConfig.rabbit.user}:${envConfig.rabbit.pass}@${envConfig.rabbit.host}:${envConfig.rabbit.port}`,
    );

    const channel = await connection.createChannel();

    await channel.assertQueue('payment_result_queue', { durable: true });

    channel.consume('payment_result_queue', async (msg) => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());

      console.log('📥 Evento recibido:', content);

      if (content.status === 'APPROVED') {
        await this.reservasService.confirmarReserva(
          content.reservaId,
          content.referenciaPago,
        );
      } else {
        await this.reservasService.cancelarReserva(content.reservaId);
      }

      channel.ack(msg);
    });

    console.log('✅ Consumer conectado a payment_result_queue');
  }
}