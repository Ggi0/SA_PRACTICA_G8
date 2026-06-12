import { FakePaymentGatewayService } from './payment-gateway.service';
import { PagoEstado } from '../../common/enums/pago-estado.enum';

describe('FakePaymentGatewayService', () => {
  let service: FakePaymentGatewayService;

  const basePayload = {
    pagoId: 'pago-1',
    reservaId: 'res-1',
    usuarioId: 'user-1',
    monto: 90,
    moneda: 'GTQ',
    metodoPago: 'TARJETA',
  };

  beforeEach(() => {
    service = new FakePaymentGatewayService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns APROBADO for a default method', async () => {
    const promise = service.procesarPago({ ...basePayload, metodoPago: 'TARJETA' });
    jest.runAllTimers();
    const result = await promise;
    expect(result.estado).toBe(PagoEstado.APROBADO);
    expect(result.proveedorRef).toContain('fake-ok-pago-1');
    expect(result.procesadoEn).toBeInstanceOf(Date);
  });

  it('returns APROBADO for TEST_APROBADO method', async () => {
    const promise = service.procesarPago({ ...basePayload, metodoPago: 'TEST_APROBADO' });
    jest.runAllTimers();
    const result = await promise;
    expect(result.estado).toBe(PagoEstado.APROBADO);
  });

  it('returns RECHAZADO for TEST_RECHAZADO method', async () => {
    const promise = service.procesarPago({ ...basePayload, metodoPago: 'TEST_RECHAZADO' });
    jest.runAllTimers();
    const result = await promise;
    expect(result.estado).toBe(PagoEstado.RECHAZADO);
    expect(result.proveedorRef).toContain('fake-reject-pago-1');
  });

  it('throws for TEST_FALLIDO method', async () => {
    const promise = service.procesarPago({ ...basePayload, metodoPago: 'TEST_FALLIDO' });
    jest.runAllTimers();
    await expect(promise).rejects.toThrow('Fallo simulado del proveedor externo');
  });

  it('comparison is case-insensitive (trim + toUpperCase)', async () => {
    const promise = service.procesarPago({ ...basePayload, metodoPago: '  test_rechazado  ' });
    jest.runAllTimers();
    const result = await promise;
    expect(result.estado).toBe(PagoEstado.RECHAZADO);
  });

  it('response includes mensaje field', async () => {
    const promise = service.procesarPago(basePayload);
    jest.runAllTimers();
    const result = await promise;
    expect(result.mensaje).toBeDefined();
    expect(typeof result.mensaje).toBe('string');
  });
});
