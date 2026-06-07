import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReservaEntity } from './entities/reserva.entity';
import { EstadoAsientoFuncionEntity } from './entities/estado-asiento-funcion.entity';
import { ReservaAsientoEntity } from './entities/reserva-asiento.entity';
import { MensajeriaEntity } from './entities/mensajeria.entity';

import { ReservaRepository } from './repositories/reserva.repository';
import { EstadoAsientoFuncionRepository } from './repositories/estado-asiento-funcion.repository';
import { MensajeriaRepository } from './repositories/mensajeria.repository';


import { ReservasService } from './services/reservas.service';
import { DisponibilidadService } from './services/disponibilidad.service';
import { ExpiracionService } from './services/expiracion.service';


/**
 * Módulo principal del dominio de reservas
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReservaEntity,
      EstadoAsientoFuncionEntity,
      ReservaAsientoEntity,
      MensajeriaEntity,
    ]),
  ],
  providers: [
    ReservaRepository,
    EstadoAsientoFuncionRepository,
    MensajeriaRepository,
    ReservasService,
    DisponibilidadService,
    ExpiracionService,
  ],
  exports: [
    ReservaRepository,
    EstadoAsientoFuncionRepository,
    MensajeriaRepository,
    ReservasService,
    DisponibilidadService,
    ExpiracionService,
  ],
})
export class ReservasModule {}
