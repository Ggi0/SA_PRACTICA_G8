import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { PaymentsService } from './payments.service';
import { PagoRepository } from '../repositories/pago.repository';
import { PagoEstado } from '../../common/enums/pago-estado.enum';
import { PAYMENT_GATEWAY } from '../interfaces/payment-gateway.interface';
import { MESSAGE_PUBLISHER } from '../../messaging/publisher.interface';
import { MensajeriaEntity } from '../../database/entities/mensajeria.entity';
import { RABBITMQ_QUEUES } from '../../messaging/rabbitmq.constants';

const buildMockPago = (overrides = {}) => ({
  id: 'pago-1',
  reservaIdRef: 'res-1',
  usuarioIdRef: 'user-1',
  monto: '90.00',
  moneda: 'GTQ',
  metodoPago: 'TARJETA',
  estado: PagoEstado.APROBADO,
  detalles: [],
  boletos: [],
  reembolsos: [],
  ...overrides,
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let pagoRepository: jest.Mocked<PagoRepository>;
  let mensajeriaRepo: { create: jest.Mock; save: jest.Mock };
  let paymentGateway: { procesarPago: jest.Mock };
  let publisher: { publish: jest.Mock };

  const defaultDto = {
    reservaId: 'res-1',
    usuarioId: 'user-1',
    monto: 90,
    metodoPago: 'TARJETA',
  };

  const gatewaySuccess = {
    estado: PagoEstado.APROBADO,
    proveedorRef: 'fake-ok-pago-1',
    mensaje: 'Pago aprobado',
    procesadoEn: new Date(),
  };

  beforeEach(async () => {
    pagoRepository = {
      createPago: jest.fn().mockResolvedValue(buildMockPago({ estado: PagoEstado.PENDIENTE })),
      updateResultado: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(buildMockPago()),
      withTransaction: jest.fn(),
    } as any;

    mensajeriaRepo = {
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockResolvedValue({}),
    };

    paymentGateway = {
      procesarPago: jest.fn().mockResolvedValue(gatewaySuccess),
    };

    publisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PagoRepository, useValue: pagoRepository },
        { provide: getRepositoryToken(MensajeriaEntity), useValue: mensajeriaRepo },
        { provide: PAYMENT_GATEWAY, useValue: paymentGateway },
        { provide: MESSAGE_PUBLISHER, useValue: publisher },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('crearYProcesarPago', () => {
    it('creates pago, calls gateway and returns updated pago on success', async () => {
      const result = await service.crearYProcesarPago(defaultDto);

      expect(pagoRepository.createPago).toHaveBeenCalledWith(
        expect.objectContaining({
          reservaIdRef: 'res-1',
          usuarioIdRef: 'user-1',
          estado: PagoEstado.PENDIENTE,
        }),
      );
      expect(paymentGateway.procesarPago).toHaveBeenCalled();
      expect(pagoRepository.updateResultado).toHaveBeenCalledWith(
        'pago-1',
        expect.objectContaining({ estado: PagoEstado.APROBADO }),
      );
      expect(publisher.publish).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.PAYMENT_RESULT,
        expect.objectContaining({ reservaId: 'res-1', estado: PagoEstado.APROBADO }),
      );
      expect(result).toEqual(buildMockPago());
    });

    it('uses GTQ as default moneda when not provided', async () => {
      await service.crearYProcesarPago(defaultDto);
      expect(pagoRepository.createPago).toHaveBeenCalledWith(
        expect.objectContaining({ moneda: 'GTQ' }),
      );
    });

    it('uses provided moneda when given', async () => {
      await service.crearYProcesarPago({ ...defaultDto, moneda: 'USD' });
      expect(pagoRepository.createPago).toHaveBeenCalledWith(
        expect.objectContaining({ moneda: 'USD' }),
      );
    });

    it('saves outbox event after successful payment', async () => {
      await service.crearYProcesarPago(defaultDto);
      expect(mensajeriaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ tipoEvento: 'pago.procesado' }),
      );
    });

    it('marks pago as FALLIDO and publishes result when gateway throws', async () => {
      paymentGateway.procesarPago.mockRejectedValueOnce(new Error('Gateway error'));
      pagoRepository.findById.mockResolvedValue(buildMockPago({ estado: PagoEstado.FALLIDO }));

      const result = await service.crearYProcesarPago(defaultDto);

      expect(pagoRepository.updateResultado).toHaveBeenCalledWith(
        'pago-1',
        expect.objectContaining({ estado: PagoEstado.FALLIDO }),
      );
      expect(publisher.publish).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.PAYMENT_RESULT,
        expect.objectContaining({ estado: PagoEstado.FALLIDO }),
      );
      expect(result.estado).toBe(PagoEstado.FALLIDO);
    });

    it('saves outbox event pago.fallido when gateway throws', async () => {
      paymentGateway.procesarPago.mockRejectedValueOnce(new Error('Gateway error'));
      pagoRepository.findById.mockResolvedValue(buildMockPago({ estado: PagoEstado.FALLIDO }));

      await service.crearYProcesarPago(defaultDto);

      expect(mensajeriaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ tipoEvento: 'pago.fallido' }),
      );
    });

    it('throws InternalServerErrorException when failed pago cannot be retrieved', async () => {
      paymentGateway.procesarPago.mockRejectedValueOnce(new Error('Gateway error'));
      pagoRepository.findById.mockResolvedValue(null);

      await expect(service.crearYProcesarPago(defaultDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws NotFoundException when processed pago is not found on reload', async () => {
      pagoRepository.findById.mockResolvedValue(null);
      await expect(service.crearYProcesarPago(defaultDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPagoById', () => {
    it('returns pago when found', async () => {
      const result = await service.getPagoById('pago-1');
      expect(result).toEqual(buildMockPago());
      expect(pagoRepository.findById).toHaveBeenCalledWith('pago-1');
    });

    it('throws NotFoundException when pago not found', async () => {
      pagoRepository.findById.mockResolvedValue(null);
      await expect(service.getPagoById('pago-1')).rejects.toThrow(NotFoundException);
      await expect(service.getPagoById('pago-1')).rejects.toThrow('Pago no encontrado');
    });
  });

  describe('procesarPagoDesdeEvento', () => {
    it('delegates to crearYProcesarPago with correct args', async () => {
      const spy = jest.spyOn(service, 'crearYProcesarPago');

      await service.procesarPagoDesdeEvento({
        reservaId: 'res-1',
        usuarioId: 'user-1',
        monto: 90,
        metodoPago: 'TARJETA',
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ reservaId: 'res-1', usuarioId: 'user-1', monto: 90 }),
      );
    });

    it('uses GTQ as default moneda when not provided', async () => {
      const spy = jest.spyOn(service, 'crearYProcesarPago');

      await service.procesarPagoDesdeEvento({
        reservaId: 'res-1',
        usuarioId: 'user-1',
        monto: 90,
        metodoPago: 'TARJETA',
      });

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ moneda: 'GTQ' }));
    });

    it('passes provided moneda through', async () => {
      const spy = jest.spyOn(service, 'crearYProcesarPago');

      await service.procesarPagoDesdeEvento({
        reservaId: 'res-1',
        usuarioId: 'user-1',
        monto: 90,
        moneda: 'USD',
        metodoPago: 'TARJETA',
      });

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ moneda: 'USD' }));
    });
  });
});
