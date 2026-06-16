import { DisponibilidadService } from './disponibilidad.service';
import { ExpiracionService } from './expiracion.service';
import { EstadoAsientoFuncionRepository } from '../repositories/estado-asiento-funcion.repository';
import { AsientoEstado } from '../../common/enums/asiento-estado.enum';
import { ReservaEstado } from '../../common/enums/reserva-estado.enum';
import { MensajeriaEstado } from '../../common/enums/mensajeria-estado.enum';

// ════════════════════════════════════════════════════════════════════════════
//  DISPONIBILIDAD SERVICE
// ════════════════════════════════════════════════════════════════════════════

const makeAsiento = (overrides: any = {}) => ({
  id: 'asiento-1',
  codigoAsiento: 'A-1',
  fila: 'A',
  numero: 1,
  estado: AsientoEstado.DISPONIBLE,
  ...overrides,
});

const makeAsientoRepo = (): jest.Mocked<EstadoAsientoFuncionRepository> => ({
  findByFuncionId: jest.fn(),
  countDisponibilidad: jest.fn(),
} as any);

describe('DisponibilidadService', () => {
  let service: DisponibilidadService;
  let repo: jest.Mocked<EstadoAsientoFuncionRepository>;

  beforeEach(() => {
    repo = makeAsientoRepo();
    service = new DisponibilidadService(repo);
  });

  describe('obtenerMapaAsientos()', () => {
    it('retorna el mapa con los asientos de la función', async () => {
      repo.findByFuncionId.mockResolvedValue([
        makeAsiento(),
        makeAsiento({ id: 'asiento-2', codigoAsiento: 'A-2', numero: 2 }),
      ]);

      const result = await service.obtenerMapaAsientos('funcion-1');

      expect(result.funcionId).toBe('funcion-1');
      expect(result.asientos).toHaveLength(2);
    });

    it('retorna mapa vacío si la función no tiene asientos', async () => {
      repo.findByFuncionId.mockResolvedValue([]);

      const result = await service.obtenerMapaAsientos('funcion-sin-asientos');

      expect(result.asientos).toHaveLength(0);
    });

    it('mapea correctamente los campos de cada asiento', async () => {
      repo.findByFuncionId.mockResolvedValue([
        makeAsiento({ estado: AsientoEstado.OCUPADO }),
      ]);

      const result = await service.obtenerMapaAsientos('funcion-1');

      expect(result.asientos[0]).toMatchObject({
        id: 'asiento-1',
        codigo: 'A-1',
        fila: 'A',
        numero: 1,
        estado: AsientoEstado.OCUPADO,
      });
    });

    it('incluye asientos con distintos estados en el mapa', async () => {
      repo.findByFuncionId.mockResolvedValue([
        makeAsiento({ estado: AsientoEstado.DISPONIBLE }),
        makeAsiento({ id: 'a2', codigoAsiento: 'A-2', estado: AsientoEstado.BLOQUEADO }),
        makeAsiento({ id: 'a3', codigoAsiento: 'A-3', estado: AsientoEstado.OCUPADO }),
      ]);

      const result = await service.obtenerMapaAsientos('funcion-1');
      const estados = result.asientos.map((a: any) => a.estado);

      expect(estados).toContain(AsientoEstado.DISPONIBLE);
      expect(estados).toContain(AsientoEstado.BLOQUEADO);
      expect(estados).toContain(AsientoEstado.OCUPADO);
    });

    it('llama al repositorio con el funcionId correcto', async () => {
      repo.findByFuncionId.mockResolvedValue([]);

      await service.obtenerMapaAsientos('funcion-99');

      expect(repo.findByFuncionId).toHaveBeenCalledWith('funcion-99');
    });
  });

  describe('obtenerResumenDisponibilidad()', () => {
    it('retorna el resumen con el funcionId y los conteos', async () => {
      repo.countDisponibilidad.mockResolvedValue({
        disponibles: 80,
        bloqueados: 5,
        ocupados: 15,
      });

      const result = await service.obtenerResumenDisponibilidad('funcion-1');

      expect(result.funcionId).toBe('funcion-1');
      expect(result.disponibles).toBe(80);
      expect(result.bloqueados).toBe(5);
      expect(result.ocupados).toBe(15);
    });

    it('llama al repositorio con el funcionId correcto', async () => {
      repo.countDisponibilidad.mockResolvedValue({ disponibles: 0, bloqueados: 0, ocupados: 0 });

      await service.obtenerResumenDisponibilidad('funcion-99');

      expect(repo.countDisponibilidad).toHaveBeenCalledWith('funcion-99');
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  EXPIRACION SERVICE
// ════════════════════════════════════════════════════════════════════════════

const makeReservaVencida = (overrides: any = {}) => ({
  id: 'reserva-1',
  estado: ReservaEstado.PENDIENTE,
  expiraEn: new Date(Date.now() - 60_000), // ya venció
  modificacion: new Date(),
  ...overrides,
});

function makeExpiracionDeps(reservasVencidas: any[] = [makeReservaVencida()]) {
  const asientosTx: any = {
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue([]),
  };

  const mensajeriaTx: any = {
    create: jest.fn().mockReturnValue({}),
    save: jest.fn().mockResolvedValue({}),
  };

  const qb = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(reservasVencidas),
  };

  const reservaTx: any = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    save: jest.fn().mockResolvedValue({}),
  };

  const manager = {
    getRepository: jest.fn().mockImplementation((entity: any) => {
      const name = entity?.name ?? entity;
      if (name === 'ReservaEntity') return reservaTx;
      if (name === 'EstadoAsientoFuncionEntity') return asientosTx;
      if (name === 'MensajeriaEntity') return mensajeriaTx;
      return {};
    }),
  };

  const dataSource = {
    transaction: jest.fn().mockImplementation((cb: any) => cb(manager)),
  };

  const publisher = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  const service = new ExpiracionService(dataSource as any, publisher as any);

  return { service, dataSource, publisher, manager, reservaTx, asientosTx, mensajeriaTx };
}

describe('ExpiracionService', () => {
  describe('expirarReservasVencidas()', () => {
    it('retorna procesadas: 0 si no hay reservas vencidas', async () => {
      const { service } = makeExpiracionDeps([]);

      const result = await service.expirarReservasVencidas();

      expect(result.procesadas).toBe(0);
    });

    it('retorna el número correcto de reservas procesadas', async () => {
      const reservas = [makeReservaVencida(), makeReservaVencida({ id: 'reserva-2' })];
      const { service } = makeExpiracionDeps(reservas);

      const result = await service.expirarReservasVencidas();

      expect(result.procesadas).toBe(2);
    });

    it('cambia el estado de cada reserva a EXPIRADA', async () => {
      const reserva = makeReservaVencida();
      const { service, reservaTx } = makeExpiracionDeps([reserva]);

      await service.expirarReservasVencidas();

      expect(reserva.estado).toBe(ReservaEstado.EXPIRADA);
      expect(reservaTx.save).toHaveBeenCalled();
    });

    it('libera los asientos de cada reserva expirada', async () => {
      const asiento = {
        id: 'asiento-1',
        estado: AsientoEstado.BLOQUEADO,
        reservaId: 'reserva-1',
        bloqueadoHasta: new Date(),
        modificacion: new Date(),
      };
      const { service, asientosTx } = makeExpiracionDeps([makeReservaVencida()]);
      asientosTx.find.mockResolvedValue([asiento]);

      await service.expirarReservasVencidas();

      expect(asiento.estado).toBe(AsientoEstado.DISPONIBLE);
      expect(asiento.reservaId).toBeUndefined();
      expect(asiento.bloqueadoHasta).toBeUndefined();
    });

    it('registra evento reserva.expirada en mensajería por cada reserva', async () => {
      const reservas = [makeReservaVencida(), makeReservaVencida({ id: 'reserva-2' })];
      const { service, mensajeriaTx } = makeExpiracionDeps(reservas);

      await service.expirarReservasVencidas();

      expect(mensajeriaTx.save).toHaveBeenCalledTimes(2);
    });

    it('publica evento en seat_release_queue por cada reserva expirada', async () => {
      const reservas = [makeReservaVencida(), makeReservaVencida({ id: 'reserva-2' })];
      const { service, publisher } = makeExpiracionDeps(reservas);

      await service.expirarReservasVencidas();

      expect(publisher.publish).toHaveBeenCalledTimes(2);
      expect(publisher.publish).toHaveBeenCalledWith('seat_release_queue', expect.any(Object));
    });

    it('no llama al publisher si no hay reservas vencidas', async () => {
      const { service, publisher } = makeExpiracionDeps([]);

      await service.expirarReservasVencidas();

      expect(publisher.publish).not.toHaveBeenCalled();
    });
  });
});
