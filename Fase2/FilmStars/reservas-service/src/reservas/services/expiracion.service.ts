import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ReservaEntity } from '../entities/reserva.entity';
import { EstadoAsientoFuncionEntity } from '../entities/estado-asiento-funcion.entity';
import { MensajeriaEntity } from '../entities/mensajeria.entity';

import { ReservaEstado } from '../../common/enums/reserva-estado.enum';
import { AsientoEstado } from '../../common/enums/asiento-estado.enum';
import { MensajeriaEstado } from '../../common/enums/mensajeria-estado.enum';

import { RabbitMQPublisher } from '../../messaging/rabbitmq.publisher';



/**
 * Service encargado exclusivamente de expirar reservas vencidas.
 *
 * SRP:
 * solo gestiona la expiración automática.
 */
@Injectable()
export class ExpiracionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly publisher: RabbitMQPublisher, // ✅ nueva dependencia
  ) {}

  /**
   * Busca reservas PENDIENTE vencidas y:
   * - las marca como EXPIRADA
   * - libera sus asientos
   * - registra evento reserva.expirada en outbox
   * - publica evento en seat_release_queue
   */
  async expirarReservasVencidas() {
    return this.dataSource.transaction(async (manager) => {
      const reservaRepoTx = manager.getRepository(ReservaEntity);
      const asientoRepoTx = manager.getRepository(EstadoAsientoFuncionEntity);
      const mensajeriaRepoTx = manager.getRepository(MensajeriaEntity);

      const reservasVencidas = await reservaRepoTx
        .createQueryBuilder('reserva')
        .setLock('pessimistic_write')
        .where('reserva.estado = :estado', { estado: ReservaEstado.PENDIENTE })
        .andWhere('reserva.expira_en < NOW()')
        .getMany();

      if (reservasVencidas.length === 0) {
        return {
          procesadas: 0,
        };
      }

      for (const reserva of reservasVencidas) {
        reserva.estado = ReservaEstado.EXPIRADA;
        reserva.modificacion = new Date();
        await reservaRepoTx.save(reserva);

        const asientos = await asientoRepoTx.find({
          where: { reservaId: reserva.id },
        });

        for (const asiento of asientos) {
          asiento.estado = AsientoEstado.DISPONIBLE;
          asiento.reservaId = undefined;
          asiento.bloqueadoHasta = undefined;
          asiento.modificacion = new Date();
        }

        await asientoRepoTx.save(asientos);

        await mensajeriaRepoTx.save(
          mensajeriaRepoTx.create({
            servicioOrigen: 'reservas-service',
            agregadoTipo: 'reserva',
            agregadoId: reserva.id,
            tipoEvento: 'reserva.expirada',
            payloadJson: {
              reservaId: reserva.id,
            },
            estado: MensajeriaEstado.PENDIENTE,
            fechaCreacion: new Date(),
          }),
        );

        // ✅ Publicar en la cola de liberación
        await this.publisher.publish('seat_release_queue', {
          reservaId: reserva.id,
        });
      }

      return {
        procesadas: reservasVencidas.length,
      };
    });
  }
}