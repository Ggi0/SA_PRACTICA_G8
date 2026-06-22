import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BoletoEntity } from '../database/entities/boleto.entity';
import { PagoEntity } from '../database/entities/pago.entity';

import { PagosAdmController } from './pagosAdm.controller';
import { PagosAdmService } from './pagosAdm.service';
import { PagosAdmRepository } from './pagosAdm.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BoletoEntity,
      PagoEntity,
    ]),
  ],
  controllers: [PagosAdmController],
  providers: [PagosAdmService, PagosAdmRepository],
})
export class PagosAdmModule {}