import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ReservasService } from './reservas.service';
import { ReservaRepository } from '../repositories/reserva.repository';
import { EstadoAsientoFuncionRepository } from '../repositories/estado-asiento-funcion.repository';
import { RabbitMQPublisher } from '../../messaging/rabbitmq.publisher';

import { ReservaEntity } from '../entities/reserva.entity';
import { EstadoAsientoFuncionEntity } from '../entities/estado-asiento-funcion.entity';
import { ReservaAsientoEntity } from '../entities/reserva-asiento.entity';
import { MensajeriaEntity } from '../entities/mensajeria.entity';

import { ReservaEstado } from '../../common/enums/reserva-estado.enum';
import { AsientoEstado } from '../../common/enums/asiento-estado.enum';

import { ReservaInvalidaException } from '../../common/exceptions/reserva-invalida.exception';
import { ReservaNoEncontradaException } from '../../common/exceptions/reserva-no-encontrada.exception';
import { AsientoNoDisponibleException } from '../../common/exceptions/asiento-no-disponible.exception';

const makeReserva = (overrides = {}) => ({
  id: 'res-1',
  usuarioIdRef: 'user-1',
  funcionIdRef: 'func-1',
  estado: ReservaEstado.PENDIENTE,
  precioTotal: 90,
  expiraEn: new Date(),
  modificacion: new Date(),
  referenciaPagoRef: null,
  ...overrides,
});

const makeAsiento = (overrides = {}) => ({
  id: 'seat-1',
  codigoAsiento: 'A1',
  fila: 'A',
  numero: 1,
  estado: AsientoEstado.DISPONIBLE,
  funcion_id_ref: 'func-1',
  asientoIdRef: 'base-seat-1',
  reservaId: undefined as string | undefined,
  bloqueadoHasta: undefined as Date | undefined,
  modificacion: new Date(),
  ...overrides,
});

function buildMockManager(opts: {
  reservaGetOne?: any;
  asientoGetMany?: any;
  asientoFind?: any;
} = {}) {
  const reservaRepoTx = {
    createQueryBuilder: jest.fn().mockReturnValue({
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(
        opts.reservaGetOne !== undefined ? opts.reservaGetOne : makeReserva(),
      ),
    }),
    create: jest.fn().mockImplementation((v) => ({ ...v, id: 'res-new' })),
    save: jest.fn().mockImplementation((v) =>
      Promise.resolve(Array.isArray(v) ? v : { ...v, id: (v as any).id ?? 'res-new' }),
    ),
  };

  const asientoRepoTx = {
    createQueryBuilder: jest.fn().mockReturnValue({
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(
        opts.asientoGetMany !== undefined ? opts.asientoGetMany : [makeAsiento()],
      ),
    }),
    find: jest.fn().mockResolvedValue(
      opts.asientoFind !== undefined ? opts.asientoFind : [makeAsiento()],
    ),
    save: jest.fn().mockResolvedValue([makeAsiento()]),
  };

  const reservaAsientoRepoTx = {
    create: jest.fn().mockImplementation((v) => v),
    save: jest.fn().mockResolvedValue([]),
  };

  const mensajeriaRepoTx = {
    create: jest.fn().mockImplementation((v) => v),
    save: jest.fn().mockResolvedValue({}),
  };

  return {
    getRepository: jest.fn().mockImplementation((entity: any) => {
      switch (entity) {
        case ReservaEntity:
          return reservaRepoTx;
        case EstadoAsientoFuncionEntity:
          return asientoRepoTx;
        case ReservaAsientoEntity:
          return reservaAsientoRepoTx;
        case MensajeriaEntity:
          return mensajeriaRepoTx;
        default:
          return {};
      }
    }),
  };
}

describe('ReservasService', () => {
  let service: ReservasService;
  let dataSource: { transaction: jest.Mock };
  let reservaRepository: jest.Mocked<ReservaRepository>;
  let estadoAsientoRepository: jest.Mocked<EstadoAsientoFuncionRepository>;
  let publisher: jest.Mocked<RabbitMQPublisher>;

  beforeEach(async () => {
    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb: any) => cb(buildMockManager())),
    };

    reservaRepository = {
      findById: jest.fn().mockResolvedValue(makeReserva()),
      findByUsuarioId: jest.fn().mockResolvedValue([makeReserva()]),
    } as any;

    estadoAsientoRepository = {
      findByFuncionId: jest.fn().mockResolvedValue([makeAsiento()]),
      countDisponibilidad: jest.fn().mockResolvedValue({ disponibles: 5, ocupados: 2, bloqueados: 1 }),
    } as any;

    publisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: DataSource, useValue: dataSource },
        { provide: ReservaRepository, useValue: reservaRepository },
        { provide: EstadoAsientoFuncionRepository, useValue: estadoAsientoRepository },
        { provide: RabbitMQPublisher, useValue: publisher },
        { provide: getRepositoryToken(ReservaAsientoEntity), useValue: {} },
      ],
    }).compile();

    service = module.get<ReservasService>(ReservasService);
  });

  // ─── crearReserva ────────────────────────────────────────────────────────────

  describe('crearReserva - validaciones previas (sin transacción)', () => {
    it('throws ReservaInvalidaException when asientos array is empty', async () => {
      await expect(service.crearReserva('user-1', 'func-1', [])).rejects.toThrow(
        ReservaInvalidaException,
      );
    });

    it('throws ReservaInvalidaException when asientos is null', async () => {
      await expect(service.crearReserva('user-1', 'func-1', null as any)).rejects.toThrow(
        ReservaInvalidaException,
      );
    });

    it('throws ReservaInvalidaException when asientos has duplicates', async () => {
      await expect(service.crearReserva('user-1', 'func-1', ['s1', 's1'])).rejects.toThrow(
        ReservaInvalidaException,
      );
    });

    it('throws with correct message for duplicates', async () => {
      await expect(
        service.crearReserva('user-1', 'func-1', ['s1', 's2', 's1']),
      ).rejects.toThrow('duplicados');
    });
  });

  describe('crearReserva - lógica en transacción', () => {
    it('throws ReservaInvalidaException when returned seats count does not match', async () => {
      dataSource.transaction.mockImplementationOnce(async (cb: any) =>
        cb(buildMockManager({ asientoGetMany: [] })),
      );
      await expect(service.crearReserva('user-1', 'func-1', ['s1'])).rejects.toThrow(
        ReservaInvalidaException,
      );
    });

    it('throws AsientoNoDisponibleException when any seat is not DISPONIBLE', async () => {
      dataSource.transaction.mockImplementationOnce(async (cb: any) =>
        cb(buildMockManager({ asientoGetMany: [makeAsiento({ estado: AsientoEstado.BLOQUEADO })] })),
      );
      await expect(service.crearReserva('user-1', 'func-1', ['s1'])).rejects.toThrow(
        AsientoNoDisponibleException,
      );
    });

    it('creates reservation and publishes to seat_hold_queue on success', async () => {
      const result = await service.crearReserva('user-1', 'func-1', ['s1']);
      expect(result).toBeDefined();
      expect(result.estado).toBe(ReservaEstado.PENDIENTE);
      expect(publisher.publish).toHaveBeenCalledWith('seat_hold_queue', expect.any(Object));
    });

    it('calculates total price based on seat count', async () => {
      const twoSeats = [makeAsiento({ id: 's1', codigoAsiento: 'A1' }), makeAsiento({ id: 's2', codigoAsiento: 'A2' })];
      dataSource.transaction.mockImplementationOnce(async (cb: any) =>
        cb(buildMockManager({ asientoGetMany: twoSeats })),
      );
      const result = await service.crearReserva('user-1', 'func-1', ['s1', 's2']);
      expect(result.precioTotal).toBe(90); // 2 * 45
    });
  });

  // ─── obtenerReservaPorId ─────────────────────────────────────────────────────

  describe('obtenerReservaPorId', () => {
    it('returns reserva when found', async () => {
      const result = await service.obtenerReservaPorId('res-1');
      expect(result).toMatchObject({ id: 'res-1' });
      expect(reservaRepository.findById).toHaveBeenCalledWith('res-1');
    });

    it('throws ReservaNoEncontradaException when not found', async () => {
      reservaRepository.findById.mockResolvedValue(null);
      await expect(service.obtenerReservaPorId('no-existe')).rejects.toThrow(
        ReservaNoEncontradaException,
      );
    });
  });

  // ─── obtenerReservasDeUsuario ────────────────────────────────────────────────

  describe('obtenerReservasDeUsuario', () => {
    it('returns list of reservas for the user', async () => {
      const result = await service.obtenerReservasDeUsuario('user-1');
      expect(result).toHaveLength(1);
      expect(reservaRepository.findByUsuarioId).toHaveBeenCalledWith('user-1');
    });

    it('returns empty array when user has no reservations', async () => {
      reservaRepository.findByUsuarioId.mockResolvedValue([]);
      const result = await service.obtenerReservasDeUsuario('user-empty');
      expect(result).toEqual([]);
    });
  });

  // ─── cancelarReserva ─────────────────────────────────────────────────────────

  describe('cancelarReserva', () => {
    it('throws ReservaNoEncontradaException when reserva does not exist', async () => {
      dataSource.transaction.mockImplementationOnce(async (cb: any) =>
        cb(buildMockManager({ reservaGetOne: null })),
      );
      await expect(service.cancelarReserva('no-existe')).rejects.toThrow(
        ReservaNoEncontradaException,
      );
    });

    it('throws ReservaInvalidaException when user does not own the reservation', async () => {
      dataSource.transaction.mockImplementationOnce(async (cb: any) =>
        cb(buildMockManager({ reservaGetOne: makeReserva({ usuarioIdRef: 'otro-user' }) })),
      );
      await expect(service.cancelarReserva('res-1', 'user-1')).rejects.toThrow(
        ReservaInvalidaException,
      );
    });

    it('throws ReservaInvalidaException when reserva is not PENDIENTE', async () => {
      dataSource.transaction.mockImplementationOnce(async (cb: any) =>
        cb(buildMockManager({ reservaGetOne: makeReserva({ estado: ReservaEstado.CONFIRMADA }) })),
      );
      await expect(service.cancelarReserva('res-1')).rejects.toThrow(ReservaInvalidaException);
    });

    it('cancels reservation and publishes to seat_release_queue', async () => {
      const result = await service.cancelarReserva('res-1', 'user-1');
      expect(result).toEqual({ message: 'Reserva cancelada' });
      expect(publisher.publish).toHaveBeenCalledWith('seat_release_queue', expect.any(Object));
    });

    it('cancels without checking owner when usuarioId is not provided', async () => {
      const result = await service.cancelarReserva('res-1');
      expect(result).toEqual({ message: 'Reserva cancelada' });
    });
  });

  // ─── confirmarReserva ─────────────────────────────────────────────────────────

  describe('confirmarReserva', () => {
    it('throws ReservaNoEncontradaException when reserva does not exist', async () => {
      dataSource.transaction.mockImplementationOnce(async (cb: any) =>
        cb(buildMockManager({ reservaGetOne: null })),
      );
      await expect(service.confirmarReserva('no-existe')).rejects.toThrow(
        ReservaNoEncontradaException,
      );
    });

    it('throws ReservaInvalidaException when reserva is not PENDIENTE', async () => {
      dataSource.transaction.mockImplementationOnce(async (cb: any) =>
        cb(buildMockManager({ reservaGetOne: makeReserva({ estado: ReservaEstado.CANCELADA }) })),
      );
      await expect(service.confirmarReserva('res-1')).rejects.toThrow(ReservaInvalidaException);
    });

    it('confirms reservation and returns CONFIRMADA state', async () => {
      const result = await service.confirmarReserva('res-1');
      expect(result).toEqual({ estado: ReservaEstado.CONFIRMADA });
    });

    it('publishes to payment_process_queue and ticket_issued_queue', async () => {
      await service.confirmarReserva('res-1');
      expect(publisher.publish).toHaveBeenCalledWith('payment_process_queue', expect.any(Object));
      expect(publisher.publish).toHaveBeenCalledWith('ticket_issued_queue', expect.any(Object));
      expect(publisher.publish).toHaveBeenCalledTimes(2);
    });

    it('stores referenciaPagoRef when provided', async () => {
      const result = await service.confirmarReserva('res-1', 'pago-ext-ref-123');
      expect(result).toEqual({ estado: ReservaEstado.CONFIRMADA });
    });
  });
});
