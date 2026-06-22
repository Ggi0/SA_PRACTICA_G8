// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseConfig } from './config/database.config';

import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';
import { MessagingModule } from './messaging/messaging.module';
import { ConsumersModule } from './consumers/consumers.module';
import {PagosAdmModule} from './admin/pagosAdm.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    MessagingModule,
    PaymentsModule,
    ConsumersModule,
    HealthModule,
    PagosAdmModule,
  ],
})
export class AppModule {}