import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { envConfig } from '../config/env.config';

@Injectable()
export class RabbitMQPublisher implements OnModuleInit {
  private channel: amqp.Channel;

  async onModuleInit() {
    const user = encodeURIComponent(envConfig.rabbit.user ?? '');
    const pass = encodeURIComponent(envConfig.rabbit.pass ?? '');

    const connection = await amqp.connect(
      `amqp://${user}:${pass}@${envConfig.rabbit.host}:${envConfig.rabbit.port}`,
    );

    this.channel = await connection.createChannel();

    console.log('✅ RabbitMQ Publisher conectado');
  }

  async publish(queue: string, message: any) {
    await this.channel.assertQueue(queue, { durable: true });

    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    console.log(`📤 Mensaje enviado a ${queue}`);
  }
}
