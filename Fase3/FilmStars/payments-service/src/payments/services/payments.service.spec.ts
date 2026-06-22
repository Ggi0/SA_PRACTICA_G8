// Fase3/FilmStars/payments-service/src/payments/services/payments.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PagoRepository } from '../repositories/pago.repository';
import { DetallePagoRepository } from '../repositories/detalle-pago.repository';
import { BoletoRepository } from '../repositories/boleto.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MensajeriaEntity } from '../../database/entities/mensajeria.entity';
import { Repository } from 'typeorm';
import { PAYMENT_GATEWAY } from '../interfaces/payment-gateway.interface';
import { MESSAGE_PUBLISHER } from '../../messaging/publisher.interface';
import { PagoEstado } from '../../common/enums/pago-estado.enum';
import { NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPagoRepository = {
    createPago: jest.fn(),
    updateResultado: jest.fn(),
    findById: jest.fn(),
  };

  const mockDetalleRepo = {
    crearDetallePago: jest.fn(),
  };

  const mockBoletoRepo = {
    crearBoletos: jest.fn(),
    buscarBoletosPorUsuario: jest.fn(),
    repo: {
      findOne: jest.fn(),
    },
  };

  const mockMensajeriaRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPaymentGateway = {
    procesarPago: jest.fn(),
  };

  const mockPublisher = {
    publish: jest.fn(),
  };

  const mockPago = {
    id: 'pago-1',
    estado: PagoEstado.PENDIENTE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PagoRepository, useValue: mockPagoRepository },
        { provide: DetallePagoRepository, useValue: mockDetalleRepo },
        { provide: BoletoRepository, useValue: mockBoletoRepo },
        {
          provide: getRepositoryToken(MensajeriaEntity),
          useValue: mockMensajeriaRepo,
        },
        { provide: PAYMENT_GATEWAY, useValue: mockPaymentGateway },
        { provide: MESSAGE_PUBLISHER, useValue: mockPublisher },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('crearYProcesarPago - éxito', () => {
    it('debe procesar un pago aprobado correctamente', async () => {
      mockPagoRepository.createPago.mockResolvedValue(mockPago);

      mockPaymentGateway.procesarPago.mockResolvedValue({
        estado: PagoEstado.APROBADO,
        proveedorRef: 'ref123',
        procesadoEn: new Date(),
      });

      mockPagoRepository.findById.mockResolvedValue(mockPago);

      const dto = {
        reservaId: 'res1',
        usuarioId: 'user1',
        monto: 100,
        moneda: 'GTQ',
        metodoPago: 'tarjeta',
      };

      const result = await service.crearYProcesarPago(dto);

      expect(mockPagoRepository.createPago).toHaveBeenCalled();
      expect(mockPaymentGateway.procesarPago).toHaveBeenCalled();
      expect(mockPagoRepository.updateResultado).toHaveBeenCalled();
      expect(mockDetalleRepo.crearDetallePago).toHaveBeenCalled();
      expect(mockBoletoRepo.crearBoletos).toHaveBeenCalled();
      expect(mockPublisher.publish).toHaveBeenCalled();

      expect(result).toEqual(mockPago);
    });
  });

  describe('crearYProcesarPago - error', () => {
    it('debe manejar error del gateway y marcar pago como fallido', async () => {
      mockPagoRepository.createPago.mockResolvedValue(mockPago);

      mockPaymentGateway.procesarPago.mockRejectedValue(
        new Error('Error de pago'),
      );

      mockPagoRepository.findById.mockResolvedValue({
        ...mockPago,
        estado: PagoEstado.FALLIDO,
      });

      const dto = {
        reservaId: 'res1',
        usuarioId: 'user1',
        monto: 100,
        metodoPago: 'tarjeta',
      };

      const result = await service.crearYProcesarPago(dto);

      expect(mockPagoRepository.updateResultado).toHaveBeenCalledWith(
        mockPago.id,
        expect.objectContaining({
          estado: PagoEstado.FALLIDO,
        }),
      );

      expect(mockPublisher.publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          estado: PagoEstado.FALLIDO,
        }),
      );

      expect(result.estado).toBe(PagoEstado.FALLIDO);
    });
  });

  describe('getPagoById', () => {
    it('debe retornar un pago existente', async () => {
      mockPagoRepository.findById.mockResolvedValue(mockPago);

      const result = await service.getPagoById('1');

      expect(result).toEqual(mockPago);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockPagoRepository.findById.mockResolvedValue(null);

      await expect(service.getPagoById('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('procesarPagoDesdeEvento', () => {
    it('debe llamar a crearYProcesarPago', async () => {
      const spy = jest
        .spyOn(service, 'crearYProcesarPago')
        .mockResolvedValue(mockPago as any);

      const payload = {
        reservaId: 'res1',
        usuarioId: 'user1',
        monto: 50,
        metodoPago: 'tarjeta',
      };

      const result = await service.procesarPagoDesdeEvento(payload);

      expect(spy).toHaveBeenCalled();
      expect(result).toEqual(mockPago);
    });
  });

  describe('obtenerBoletosUsuarioPorCodigo', () => {
    it('debe retornar boleto si existe', async () => {
      const boletoMock = { id: 'b1', codigoBoleto: 'ABC123' };

      mockBoletoRepo.repo.findOne.mockResolvedValue(boletoMock);

      const result =
        await service.obtenerBoletosUsuarioPorCodigo('ABC123');

      expect(result).toEqual(boletoMock);
    });

    it('debe lanzar error si no encuentra boleto', async () => {
      mockBoletoRepo.repo.findOne.mockResolvedValue(null);

      await expect(
        service.obtenerBoletosUsuarioPorCodigo('ABC123'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});