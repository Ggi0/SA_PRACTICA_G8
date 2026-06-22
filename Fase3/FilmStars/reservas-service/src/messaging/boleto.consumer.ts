import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import * as amqp from 'amqplib';

import { ReservasService } from '../reservas/services/reservas.service';
import { envConfig } from '../config/env.config';

@Injectable()
export class BoletoConsumer implements OnModuleInit {
  constructor(
    @Inject(forwardRef(() => ReservasService))
    private readonly reservasService: ReservasService,
  ) {}

  async onModuleInit() {
    const user = encodeURIComponent(envConfig.rabbit.user ?? '');
    const pass = encodeURIComponent(envConfig.rabbit.pass ?? '');

    const connection = await amqp.connect(
      `amqp://${user}:${pass}@${envConfig.rabbit.host}:${envConfig.rabbit.port}`,
    );

    const channel = await connection.createChannel();

    await channel.assertQueue('boleto_usado_queue', { durable: true });

    console.log('🎟 Esperando eventos de boletos usados...');

    channel.consume('boleto_usado_queue', async (msg) => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());

      console.log('📥 Evento boleto recibido:', content);

      try {
        await this.reservasService.procesarBoletoUsado(content);
        channel.ack(msg);
      } catch (error) {
        console.error('❌ Error procesando boleto:', error);
        // puedes usar nack si quieres retry
        channel.nack(msg, false, false);
      }
    });
  }
}
