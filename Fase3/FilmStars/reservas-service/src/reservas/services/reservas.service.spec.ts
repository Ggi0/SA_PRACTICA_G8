import { Test, TestingModule } from '@nestjs/testing';
import { ReservasService } from './reservas.service';
import { DataSource } from 'typeorm';
import { ReservaRepository } from '../repositories/reserva.repository';
import { EstadoAsientoFuncionRepository } from '../repositories/estado-asiento-funcion.repository';
import { RabbitMQPublisher } from '../../messaging/rabbitmq.publisher';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReservaAsientoEntity } from '../entities/reserva-asiento.entity';

import { ReservaEstado } from '../../common/enums/reserva-estado.enum';
import { AsientoEstado } from '../../common/enums/asiento-estado.enum';

import {
  ReservaInvalidaException,
} from '../../common/exceptions/reserva-invalida.exception';

describe('ReservasService', () => {
  let service: ReservasService;

  const mockManager = {
    getRepository: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockReservaRepository = {
    findById: jest.fn(),
    findByUsuarioId: jest.fn(),
  };

  const mockEstadoAsientoRepository = {};

  const mockPublisher = {
    publish: jest.fn(),
  };

  const mockReservaAsientoRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: ReservaRepository, useValue: mockReservaRepository },
        {
          provide: EstadoAsientoFuncionRepository,
          useValue: mockEstadoAsientoRepository,
        },
        { provide: RabbitMQPublisher, useValue: mockPublisher },
        {
          provide: getRepositoryToken(ReservaAsientoEntity),
          useValue: mockReservaAsientoRepo,
        },
      ],
    }).compile();

    service = module.get<ReservasService>(ReservasService);
    jest.clearAllMocks();
  });

  describe('crearReserva - validaciones', () => {
    it('debe lanzar error si no hay asientos', async () => {
      await expect(
        service.crearReserva('user1', 'func1', []),
      ).rejects.toThrow(ReservaInvalidaException);
    });

    it('debe lanzar error si hay asientos duplicados', async () => {
      await expect(
        service.crearReserva('user1', 'func1', ['A1', 'A1']),
      ).rejects.toThrow(ReservaInvalidaException);
    });
  });

  describe('crearReserva - flujo exitoso', () => {
    it('debe crear reserva correctamente', async () => {
      const asientoMock = {
        id: 'a1',
        estado: AsientoEstado.DISPONIBLE,
        asientoIdRef: 'ref1',
        codigoAsiento: 'A1',
        fila: 'A',
        numero: 1,
      };

      const reservaMock = {
        id: 'r1',
        estado: ReservaEstado.PENDIENTE,
        precioTotal: 45,
        expiraEn: new Date(),
      };

      const reservaRepoTx = {
        create: jest.fn().mockReturnValue(reservaMock),
        save: jest.fn().mockResolvedValue(reservaMock),
      };

      const asientoRepoTx = {
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([asientoMock]),
        }),
        save: jest.fn(),
      };

      const reservaAsientoRepoTx = {
        create: jest.fn(),
        save: jest.fn(),
      };

      const mensajeriaRepoTx = {
        create: jest.fn(),
        save: jest.fn(),
      };

      mockManager.getRepository
        .mockReturnValueOnce(reservaRepoTx)
        .mockReturnValueOnce(asientoRepoTx)
        .mockReturnValueOnce(reservaAsientoRepoTx)
        .mockReturnValueOnce(mensajeriaRepoTx);

      mockDataSource.transaction.mockImplementation(async (cb) =>
        cb(mockManager),
      );

      const result = await service.crearReserva('user1', 'func1', ['a1']);

      expect(reservaRepoTx.save).toHaveBeenCalled();
      expect(asientoRepoTx.save).toHaveBeenCalled();
      expect(mensajeriaRepoTx.save).toHaveBeenCalled();
      expect(mockPublisher.publish).toHaveBeenCalled();

      expect(result.id).toBe(reservaMock.id);
    });
  });

  describe('obtenerReservaPorId', () => {
    it('debe retornar reserva existente', async () => {
      const reserva = { id: '1' };

      mockReservaRepository.findById.mockResolvedValue(reserva);

      const result = await service.obtenerReservaPorId('1');

      expect(result).toEqual(reserva);
    });

    it('debe lanzar error si no existe', async () => {
      mockReservaRepository.findById.mockResolvedValue(null);

      await expect(
        service.obtenerReservaPorId('1'),
      ).rejects.toThrow();
    });
  });

  describe('obtenerReservasDeUsuario', () => {
    it('debe retornar lista de reservas', async () => {
      const reservas = [{ id: '1' }];

      mockReservaRepository.findByUsuarioId.mockResolvedValue(reservas);

      const result = await service.obtenerReservasDeUsuario('user1');

      expect(result).toEqual(reservas);
    });
  });

  describe('cancelarReserva', () => {
    it('debe cancelar correctamente una reserva', async () => {
      const reservaMock = {
        id: 'r1',
        estado: ReservaEstado.PENDIENTE,
        usuarioIdRef: 'user1',
      };

      const reservaRepoTx = {
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(reservaMock),
        }),
        save: jest.fn(),
      };

      const asientoRepoTx = {
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn(),
      };

      const mensajeriaRepoTx = {
        create: jest.fn(),
        save: jest.fn(),
      };

      mockManager.getRepository
        .mockReturnValueOnce(reservaRepoTx)
        .mockReturnValueOnce(asientoRepoTx)
        .mockReturnValueOnce(mensajeriaRepoTx);

      mockDataSource.transaction.mockImplementation(async (cb) =>
        cb(mockManager),
      );

      const result = await service.cancelarReserva('r1', 'user1');

      expect(reservaRepoTx.save).toHaveBeenCalled();
      expect(mockPublisher.publish).toHaveBeenCalled();

      expect(result.message).toBe('Reserva cancelada');
    });
  });

  describe('confirmarReserva', () => {
    it('debe solicitar pago correctamente', async () => {
      const reservaMock = {
        id: 'r1',
        estado: ReservaEstado.PENDIENTE,
        usuarioIdRef: 'user1',
        precioTotal: 90,
      };

      const reservaRepoTx = {
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(reservaMock),
        }),
      };

      const mensajeriaRepoTx = {
        create: jest.fn(),
        save: jest.fn(),
      };

      mockManager.getRepository
        .mockReturnValueOnce(reservaRepoTx)
        .mockReturnValueOnce(mensajeriaRepoTx);

      mockDataSource.transaction.mockImplementation(async (cb) =>
        cb(mockManager),
      );

      const result = await service.confirmarReserva('r1');

      expect(mockPublisher.publish).toHaveBeenCalled();
      expect(result.estado).toBe('EN_PROCESO_PAGO');
    });
  });

  describe('confirmarReservaInterna', () => {
    it('debe confirmar reserva y ocupar asientos', async () => {
      const reservaMock = {
        id: 'r1',
        estado: ReservaEstado.PENDIENTE,
      };

      const reservaRepoTx = {
        findOneBy: jest.fn().mockResolvedValue(reservaMock),
        save: jest.fn(),
      };

      const asientoRepoTx = {
        find: jest.fn().mockResolvedValue([
          { estado: AsientoEstado.BLOQUEADO },
        ]),
        save: jest.fn(),
      };

      mockManager.getRepository
        .mockReturnValueOnce(reservaRepoTx)
        .mockReturnValueOnce(asientoRepoTx);

      mockDataSource.transaction.mockImplementation(async (cb) =>
        cb(mockManager),
      );

      await service.confirmarReservaInterna('r1', 'pago1');

      expect(reservaRepoTx.save).toHaveBeenCalled();
      expect(asientoRepoTx.save).toHaveBeenCalled();
    });
  });
});