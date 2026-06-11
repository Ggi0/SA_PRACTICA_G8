// src/messaging/rabbitmq.publisher.ts

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as amqp from 'amqplib';

import { envConfig } from '../config/env.config';
import { MessagePublisher } from './publisher.interface';
import { RABBITMQ_QUEUES } from './rabbitmq.constants';

@Injectable()
export class RabbitMqPublisher
  implements MessagePublisher, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RabbitMqPublisher.name);

  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  async onModuleInit(): Promise<void> {
    const url = `amqp://${envConfig.rabbit.user}:${envConfig.rabbit.pass}@${envConfig.rabbit.host}:${envConfig.rabbit.port}/`;

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      // Las colas ya existen por definitions.json, pero assertQueue no estorba
      await this.channel.assertQueue(RABBITMQ_QUEUES.PAYMENT_RESULT, {
        durable: true,
      });

      this.logger.log('RabbitMQ publisher conectado correctamente');
    } catch (error) {
      this.logger.error('No se pudo conectar RabbitMQ publisher', error);
      throw error;
    }
  }

  async publish(
    queue: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel no inicializado');
    }

    const buffer = Buffer.from(JSON.stringify(payload));

    this.channel.sendToQueue(queue, buffer, {
      persistent: true,
      contentType: 'application/json',
    });

    this.logger.log(
      `Mensaje publicado en cola ${queue}: ${JSON.stringify(payload)}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ publisher cerrado correctamente');
    } catch (error) {
      this.logger.error('Error cerrando publisher RabbitMQ', error);
    }
  }
}