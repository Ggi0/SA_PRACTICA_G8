import { PaymentsService } from './payments.service';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PagoEstado } from '../../common/enums/pago-estado.enum';
import { RABBITMQ_QUEUES } from '../../messaging/rabbitmq.constants';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makePago = (overrides: any = {}) => ({
  id: 'pago-1',
  reservaIdRef: 'reserva-1',
  usuarioIdRef: 'user-1',
  monto: '100.00',
  moneda: 'GTQ',
  metodoPago: 'TARJETA',
  estado: PagoEstado.PENDIENTE,
  proveedorRef: null,
  procesadoEn: null,
  ...overrides,
});

const makeDto = (overrides: any = {}) => ({
  reservaId: 'reserva-1',
  usuarioId: 'user-1',
  monto: 100,
  moneda: 'GTQ',
  metodoPago: 'TARJETA',
  ...overrides,
});

const makeGatewayResult = (overrides: any = {}) => ({
  estado: PagoEstado.APROBADO,
  proveedorRef: 'PROV-123',
  procesadoEn: new Date(),
  ...overrides,
});

// ─── Mock factories ───────────────────────────────────────────────────────────
const makePagoRepository = () => ({
  createPago: jest.fn(),
  updateResultado: jest.fn(),
  findById: jest.fn(),
});

const makeMensajeriaRepo = () => ({
  create: jest.fn().mockReturnValue({}),
  save: jest.fn().mockResolvedValue({}),
});

const makePaymentGateway = () => ({
  procesarPago: jest.fn(),
});

const makePublisher = () => ({
  publish: jest.fn().mockResolvedValue(undefined),
});

// ─── Factory del servicio ─────────────────────────────────────────────────────
function makeService(overrides: any = {}) {
  const pagoRepository = overrides.pagoRepository ?? makePagoRepository();
  const mensajeriaRepo = overrides.mensajeriaRepo ?? makeMensajeriaRepo();
  const paymentGateway = overrides.paymentGateway ?? makePaymentGateway();
  const publisher = overrides.publisher ?? makePublisher();

  const service = new PaymentsService(
    pagoRepository as any,
    mensajeriaRepo as any,
    paymentGateway as any,
    publisher as any,
  );

  return { service, pagoRepository, mensajeriaRepo, paymentGateway, publisher };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('PaymentsService', () => {

  // ── crearYProcesarPago ────────────────────────────────────────────────────
  describe('crearYProcesarPago()', () => {
    it('crea el pago, llama al gateway y retorna el pago actualizado', async () => {
      const pago = makePago();
      const pagoAprobado = makePago({ estado: PagoEstado.APROBADO });
      const gatewayResult = makeGatewayResult();

      const { service, pagoRepository, paymentGateway } = makeService();
      pagoRepository.createPago.mockResolvedValue(pago);
      paymentGateway.procesarPago.mockResolvedValue(gatewayResult);
      pagoRepository.updateResultado.mockResolvedValue(undefined);
      pagoRepository.findById.mockResolvedValue(pagoAprobado);

      const result = await service.crearYProcesarPago(makeDto());

      expect(result.estado).toBe(PagoEstado.APROBADO);
      expect(pagoRepository.createPago).toHaveBeenCalledTimes(1);
      expect(paymentGateway.procesarPago).toHaveBeenCalledTimes(1);
    });

    it('usa GTQ como moneda por defecto si no se especifica', async () => {
      const { service, pagoRepository, paymentGateway } = makeService();
      pagoRepository.createPago.mockResolvedValue(makePago());
      paymentGateway.procesarPago.mockResolvedValue(makeGatewayResult());
      pagoRepository.findById.mockResolvedValue(makePago({ estado: PagoEstado.APROBADO }));

      await service.crearYProcesarPago(makeDto({ moneda: undefined }));

      expect(pagoRepository.createPago).toHaveBeenCalledWith(
        expect.objectContaining({ moneda: 'GTQ' }),
      );
    });

    it('publica resultado en PAYMENT_RESULT queue tras pago exitoso', async () => {
      const { service, pagoRepository, paymentGateway, publisher } = makeService();
      pagoRepository.createPago.mockResolvedValue(makePago());
      paymentGateway.procesarPago.mockResolvedValue(makeGatewayResult());
      pagoRepository.findById.mockResolvedValue(makePago({ estado: PagoEstado.APROBADO }));

      await service.crearYProcesarPago(makeDto());

      expect(publisher.publish).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.PAYMENT_RESULT,
        expect.objectContaining({ reservaId: 'reserva-1' }),
      );
    });

    it('guarda evento en outbox tras pago exitoso', async () => {
      const { service, pagoRepository, paymentGateway, mensajeriaRepo } = makeService();
      pagoRepository.createPago.mockResolvedValue(makePago());
      paymentGateway.procesarPago.mockResolvedValue(makeGatewayResult());
      pagoRepository.findById.mockResolvedValue(makePago({ estado: PagoEstado.APROBADO }));

      await service.crearYProcesarPago(makeDto());

      expect(mensajeriaRepo.save).toHaveBeenCalledTimes(1);
    });

    it('lanza InternalServerErrorException si el pago procesado no se puede recargar', async () => {
      const { service, pagoRepository, paymentGateway } = makeService();
      pagoRepository.createPago.mockResolvedValue(makePago());
      paymentGateway.procesarPago.mockResolvedValue(makeGatewayResult());
      pagoRepository.updateResultado.mockResolvedValue(undefined);
      pagoRepository.findById.mockResolvedValue(null); // no se encuentra

      await expect(service.crearYProcesarPago(makeDto())).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('marca pago como FALLIDO si el gateway lanza error', async () => {
      const pagoFallido = makePago({ estado: PagoEstado.FALLIDO });
      const { service, pagoRepository, paymentGateway } = makeService();
      pagoRepository.createPago.mockResolvedValue(makePago());
      paymentGateway.procesarPago.mockRejectedValue(new Error('Gateway timeout'));
      pagoRepository.updateResultado.mockResolvedValue(undefined);
      pagoRepository.findById.mockResolvedValue(pagoFallido);

      const result = await service.crearYProcesarPago(makeDto());

      expect(result.estado).toBe(PagoEstado.FALLIDO);
      expect(pagoRepository.updateResultado).toHaveBeenCalledWith(
        'pago-1',
        expect.objectContaining({ estado: PagoEstado.FALLIDO }),
      );
    });

    it('publica resultado FALLIDO en queue cuando el gateway falla', async () => {
      const { service, pagoRepository, paymentGateway, publisher } = makeService();
      pagoRepository.createPago.mockResolvedValue(makePago());
      paymentGateway.procesarPago.mockRejectedValue(new Error('Gateway error'));
      pagoRepository.updateResultado.mockResolvedValue(undefined);
      pagoRepository.findById.mockResolvedValue(makePago({ estado: PagoEstado.FALLIDO }));

      await service.crearYProcesarPago(makeDto());

      expect(publisher.publish).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.PAYMENT_RESULT,
        expect.objectContaining({ estado: PagoEstado.FALLIDO }),
      );
    });

    it('guarda evento pago.fallido en outbox cuando el gateway falla', async () => {
      const { service, pagoRepository, paymentGateway, mensajeriaRepo } = makeService();
      pagoRepository.createPago.mockResolvedValue(makePago());
      paymentGateway.procesarPago.mockRejectedValue(new Error('Error'));
      pagoRepository.updateResultado.mockResolvedValue(undefined);
      pagoRepository.findById.mockResolvedValue(makePago({ estado: PagoEstado.FALLIDO }));

      await service.crearYProcesarPago(makeDto());

      expect(mensajeriaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipoEvento: 'pago.fallido' }),
      );
    });

    it('lanza InternalServerErrorException si falla gateway Y no se puede recuperar el pago', async () => {
      const { service, pagoRepository, paymentGateway } = makeService();
      pagoRepository.createPago.mockResolvedValue(makePago());
      paymentGateway.procesarPago.mockRejectedValue(new Error('Error'));
      pagoRepository.updateResultado.mockResolvedValue(undefined);
      pagoRepository.findById.mockResolvedValue(null); // no se puede recuperar

      await expect(service.crearYProcesarPago(makeDto())).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ── getPagoById ───────────────────────────────────────────────────────────
  describe('getPagoById()', () => {
    it('retorna el pago cuando existe', async () => {
      const { service, pagoRepository } = makeService();
      pagoRepository.findById.mockResolvedValue(makePago());

      const result = await service.getPagoById('pago-1');

      expect(result.id).toBe('pago-1');
      expect(pagoRepository.findById).toHaveBeenCalledWith('pago-1');
    });

    it('lanza NotFoundException si el pago no existe', async () => {
      const { service, pagoRepository } = makeService();
      pagoRepository.findById.mockResolvedValue(null);

      await expect(service.getPagoById('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza NotFoundException con mensaje correcto', async () => {
      const { service, pagoRepository } = makeService();
      pagoRepository.findById.mockResolvedValue(null);

      await expect(service.getPagoById('no-existe')).rejects.toThrow(
        'Pago no encontrado',
      );
    });
  });

  // ── procesarPagoDesdeEvento ───────────────────────────────────────────────
  describe('procesarPagoDesdeEvento()', () => {
    it('delega correctamente a crearYProcesarPago', async () => {
      const pagoAprobado = makePago({ estado: PagoEstado.APROBADO });
      const { service, pagoRepository, paymentGateway } = makeService();
      pagoRepository.createPago.mockResolvedValue(makePago());
      paymentGateway.procesarPago.mockResolvedValue(makeGatewayResult());
      pagoRepository.findById.mockResolvedValue(pagoAprobado);

      const result = await service.procesarPagoDesdeEvento({
        reservaId: 'reserva-1',
        usuarioId: 'user-1',
        monto: 100,
        metodoPago: 'TARJETA',
      });

      expect(result.estado).toBe(PagoEstado.APROBADO);
      expect(pagoRepository.createPago).toHaveBeenCalledTimes(1);
    });

    it('usa GTQ como moneda por defecto desde evento', async () => {
      const { service, pagoRepository, paymentGateway } = makeService();
      pagoRepository.createPago.mockResolvedValue(makePago());
      paymentGateway.procesarPago.mockResolvedValue(makeGatewayResult());
      pagoRepository.findById.mockResolvedValue(makePago({ estado: PagoEstado.APROBADO }));

      await service.procesarPagoDesdeEvento({
        reservaId: 'reserva-1',
        usuarioId: 'user-1',
        monto: 100,
        metodoPago: 'TARJETA',
      });

      expect(pagoRepository.createPago).toHaveBeenCalledWith(
        expect.objectContaining({ moneda: 'GTQ' }),
      );
    });
  });
});
