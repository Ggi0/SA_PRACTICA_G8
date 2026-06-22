import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { envConfig } from '../../config/env.config';

import { ReservaEntity } from '../entities/reserva.entity';
import { EstadoAsientoFuncionEntity } from '../entities/estado-asiento-funcion.entity';
import { ReservaAsientoEntity } from '../entities/reserva-asiento.entity';
import { MensajeriaEntity } from '../entities/mensajeria.entity';

import { ReservaEstado } from '../../common/enums/reserva-estado.enum';
import { AsientoEstado } from '../../common/enums/asiento-estado.enum';
import { MensajeriaEstado } from '../../common/enums/mensajeria-estado.enum';

import { ReservaRepository } from '../repositories/reserva.repository';
import { EstadoAsientoFuncionRepository } from '../repositories/estado-asiento-funcion.repository';

import { AsientoNoDisponibleException } from '../../common/exceptions/asiento-no-disponible.exception';
import { ReservaNoEncontradaException } from '../../common/exceptions/reserva-no-encontrada.exception';
import { ReservaInvalidaException } from '../../common/exceptions/reserva-invalida.exception';

import { RabbitMQPublisher } from '../../messaging/rabbitmq.publisher';

/**
 * Service central del dominio de reservas.
 *
 * Responsabilidades:
 * - crear reservas
 * - bloquear asientos
 * - consultar reservas
 * - cancelar reservas
 * - confirmar reservas
 * - registrar eventos en outbox
 *
 * SRP:
 * Esta clase solo contiene lógica de negocio del dominio reserva.
 */
@Injectable()
export class ReservasService {
  /**
   * Precio fijo por asiento para esta versión base.
   * Más adelante lo puedes reemplazar por una estrategia de precios
   * para cumplir Open/Closed sin modificar esta clase.
   */
  private readonly PRECIO_UNITARIO_BASE = 45;

  constructor(
    private readonly dataSource: DataSource,
    private readonly reservaRepository: ReservaRepository,
    private readonly estadoAsientoRepository: EstadoAsientoFuncionRepository,
    private readonly publisher: RabbitMQPublisher,


    @InjectRepository(ReservaAsientoEntity)
    private readonly reservaAsientoOrmRepo: Repository<ReservaAsientoEntity>,
  ) {}

  /**
   * Crea una reserva en estado PENDIENTE.
   * Reglas:
   * - los asientos deben existir
   * - deben pertenecer a la función
   * - deben estar DISPONIBLE
   * - se bloquean por un tiempo configurable
   * - se registra evento en mensajeria (outbox)
   */
  async crearReserva(
    usuarioId: string,
    funcionId: string,
    asientosIds: string[],
  ) {
    if (!asientosIds || asientosIds.length === 0) {
      throw new ReservaInvalidaException('Debes enviar al menos un asiento');
    }

    const asientosUnicos = [...new Set(asientosIds)];

    if (asientosUnicos.length !== asientosIds.length) {
      throw new ReservaInvalidaException('No puedes enviar asientos duplicados');
    }

    const timeoutMinutes = envConfig.reservation.timeoutMinutes;
    const ahora = new Date();
    const expiraEn = new Date(ahora.getTime() + timeoutMinutes * 60 * 1000);

    return this.dataSource.transaction(async (manager) => {
      const reservaRepoTx = manager.getRepository(ReservaEntity);
      const asientoRepoTx = manager.getRepository(EstadoAsientoFuncionEntity);
      const reservaAsientoRepoTx = manager.getRepository(ReservaAsientoEntity);
      const mensajeriaRepoTx = manager.getRepository(MensajeriaEntity);

      /**
       * Lock pesimista:
       * bloquea las filas para evitar doble reserva concurrente.
       */
      const asientos = await asientoRepoTx
        .createQueryBuilder('asiento')
        .setLock('pessimistic_write')
        .where('asiento.funcion_id_ref = :funcionId', { funcionId })
        .andWhere('asiento.id IN (:...ids)', { ids: asientosUnicos })
        .getMany();

      if (asientos.length !== asientosUnicos.length) {
        throw new ReservaInvalidaException(
          'Uno o más asientos no existen o no pertenecen a la función indicada',
        );
      }

      const asientosNoDisponibles = asientos.filter(
        (asiento) => asiento.estado !== AsientoEstado.DISPONIBLE,
      );

      if (asientosNoDisponibles.length > 0) {
        throw new AsientoNoDisponibleException(
          'Uno o más asientos ya están bloqueados u ocupados',
        );
      }

      const precioTotal = asientos.length * this.PRECIO_UNITARIO_BASE;

      const reserva = reservaRepoTx.create({
        usuarioIdRef: usuarioId,
        funcionIdRef: funcionId,
        estado: ReservaEstado.PENDIENTE,
        precioTotal,
        expiraEn,
      });

      const reservaGuardada = await reservaRepoTx.save(reserva);

      for (const asiento of asientos) {
        asiento.estado = AsientoEstado.BLOQUEADO;
        asiento.reservaId = reservaGuardada.id;
        asiento.bloqueadoHasta = expiraEn;
        asiento.modificacion = new Date();
      }

      await asientoRepoTx.save(asientos);

      const relacionesReservaAsiento = asientos.map((asiento) =>
        reservaAsientoRepoTx.create({
          reservaId: reservaGuardada.id,
          estadoAsientoFuncionId: asiento.id,
          precioUnitario: this.PRECIO_UNITARIO_BASE,
          tipoEntrada: 'GENERAL',
        }),
      );

      await reservaAsientoRepoTx.save(relacionesReservaAsiento);

      await mensajeriaRepoTx.save(
        mensajeriaRepoTx.create({
          servicioOrigen: 'reservas-service',
          agregadoTipo: 'reserva',
          agregadoId: reservaGuardada.id,
          tipoEvento: 'reserva.solicitada',
          payloadJson: {
            reservaId: reservaGuardada.id,
            usuarioId,
            funcionId,
            asientos: asientos.map((a) => ({
              asientoId: a.asientoIdRef,
              codigo: a.codigoAsiento,
              fila: a.fila,
              numero: a.numero,
            })),
          },
          estado: MensajeriaEstado.PENDIENTE,
          fechaCreacion: new Date(),
        }),
      );

      await this.publisher.publish('seat_hold_queue', {
  reservaId: reservaGuardada.id,
  usuarioId,
  funcionId,
  asientos: asientos.map(a => a.id),
  expiraEn,
});

      return {
        id: reservaGuardada.id,
        estado: reservaGuardada.estado,
        precioTotal: Number(reservaGuardada.precioTotal),
        expiraEn: reservaGuardada.expiraEn,
        asientos: asientos.map((a) => ({
          id: a.id,
          codigo: a.codigoAsiento,
          fila: a.fila,
          numero: a.numero,
        })),
      };
    });
  }

  /**
   * Obtiene una reserva por id.
   */
  async obtenerReservaPorId(id: string): Promise<ReservaEntity> {
    const reserva = await this.reservaRepository.findById(id);

    if (!reserva) {
      throw new ReservaNoEncontradaException();
    }

    return reserva;
  }

  /**
   * Lista reservas del usuario autenticado.
   */
  async obtenerReservasDeUsuario(usuarioId: string): Promise<ReservaEntity[]> {
    return this.reservaRepository.findByUsuarioId(usuarioId);
  }

  /**
   * Cancela una reserva PENDIENTE y libera sus asientos.
   *
   * NOTA:
   * En esta versión base solo permitimos cancelar reservas PENDIENTE.
   * Si después quieres permitir cancelación de confirmadas con otras reglas,
   * se puede extender.
   */
  async cancelarReserva(id: string, usuarioId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const reservaRepoTx = manager.getRepository(ReservaEntity);
      const asientoRepoTx = manager.getRepository(EstadoAsientoFuncionEntity);
      const mensajeriaRepoTx = manager.getRepository(MensajeriaEntity);

      const reserva = await reservaRepoTx
        .createQueryBuilder('reserva')
        .setLock('pessimistic_write')
        .where('reserva.id = :id', { id })
        .getOne();

      if (!reserva) {
        throw new ReservaNoEncontradaException();
      }

      if (usuarioId && reserva.usuarioIdRef !== usuarioId) {
        throw new ReservaInvalidaException(
          'No puedes cancelar una reserva que no te pertenece',
        );
      }

      if (reserva.estado !== ReservaEstado.PENDIENTE) {
        throw new ReservaInvalidaException(
          'Solo se pueden cancelar reservas en estado PENDIENTE',
        );
      }

      reserva.estado = ReservaEstado.CANCELADA;
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
          tipoEvento: 'reserva.cancelada',
          payloadJson: {
            reservaId: reserva.id,
          },
          estado: MensajeriaEstado.PENDIENTE,
          fechaCreacion: new Date(),
        }),
      );


await this.publisher.publish('seat_release_queue', {
  reservaId: reserva.id,
});



      return {
        message: 'Reserva cancelada',
      };
    });
  }

  /**
   * Confirma una reserva pendiente.
   * Cambia:
   * - reserva PENDIENTE -> CONFIRMADA
   * - asientos BLOQUEADO -> OCUPADO
   */
async confirmarReserva(id: string) {
  return this.dataSource.transaction(async (manager) => {
    const reservaRepoTx = manager.getRepository(ReservaEntity);
    const mensajeriaRepoTx = manager.getRepository(MensajeriaEntity);

    const reserva = await reservaRepoTx
      .createQueryBuilder('reserva')
      .setLock('pessimistic_write')
      .where('reserva.id = :id', { id })
      .getOne();

    if (!reserva) {
      throw new ReservaNoEncontradaException();
    }

    if (reserva.estado !== ReservaEstado.PENDIENTE) {
      throw new ReservaInvalidaException(
        'Solo se pueden confirmar reservas en estado PENDIENTE',
      );
    }

    /**
     * Guardar evento en Outbox
     */
    await mensajeriaRepoTx.save(
      mensajeriaRepoTx.create({
        servicioOrigen: 'reservas-service',
        agregadoTipo: 'reserva',
        agregadoId: reserva.id,
        tipoEvento: 'pago.solicitado',
        payloadJson: {
          reservaId: reserva.id,
          usuarioId: reserva.usuarioIdRef,
          monto: Number(reserva.precioTotal),
          moneda: 'GTQ',
          metodoPago: 'TEST_APROBADO',
        },
        estado: MensajeriaEstado.PENDIENTE,
        fechaCreacion: new Date(),
      }),
    );

    /**
     * Solo solicitar pago.
     * No se modifica la reserva ni los asientos.
     */
    await this.publisher.publish('payment_process_queue', {
      reservaId: reserva.id,
      usuarioId: reserva.usuarioIdRef,
      monto: Number(reserva.precioTotal),
      moneda: 'GTQ',
      metodoPago: 'TEST_APROBADO',
    });

    return {
      estado: 'EN_PROCESO_PAGO',
      reservaId: reserva.id,
    };
  });
}


async confirmarReservaInterna(reservaId: string, pagoId?: string) {
  return this.dataSource.transaction(async (manager) => {
    const reservaRepoTx = manager.getRepository(ReservaEntity);
    const asientoRepoTx = manager.getRepository(EstadoAsientoFuncionEntity);

    const reserva = await reservaRepoTx.findOneBy({ id: reservaId });

    if (!reserva) return;

    reserva.estado = ReservaEstado.CONFIRMADA;
    reserva.referenciaPagoRef = pagoId;

    await reservaRepoTx.save(reserva);

    const asientos = await asientoRepoTx.find({
      where: { reservaId: reserva.id },
    });

    for (const asiento of asientos) {
      asiento.estado = AsientoEstado.OCUPADO;
      asiento.bloqueadoHasta = undefined;
    }

    await asientoRepoTx.save(asientos);
  });
}




}
