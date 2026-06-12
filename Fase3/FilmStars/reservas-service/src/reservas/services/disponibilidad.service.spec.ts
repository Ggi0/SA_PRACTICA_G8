import { Test, TestingModule } from '@nestjs/testing';
import { DisponibilidadService } from './disponibilidad.service';
import { EstadoAsientoFuncionRepository } from '../repositories/estado-asiento-funcion.repository';
import { AsientoEstado } from '../../common/enums/asiento-estado.enum';

describe('DisponibilidadService', () => {
  let service: DisponibilidadService;
  let estadoAsientoRepository: jest.Mocked<EstadoAsientoFuncionRepository>;

  const mockAsientos = [
    { id: 'seat-1', codigoAsiento: 'A1', fila: 'A', numero: 1, estado: AsientoEstado.DISPONIBLE },
    { id: 'seat-2', codigoAsiento: 'A2', fila: 'A', numero: 2, estado: AsientoEstado.OCUPADO },
    { id: 'seat-3', codigoAsiento: 'B1', fila: 'B', numero: 1, estado: AsientoEstado.BLOQUEADO },
  ];

  beforeEach(async () => {
    estadoAsientoRepository = {
      findByFuncionId: jest.fn().mockResolvedValue(mockAsientos),
      countDisponibilidad: jest.fn().mockResolvedValue({ disponibles: 1, ocupados: 1, bloqueados: 1 }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisponibilidadService,
        { provide: EstadoAsientoFuncionRepository, useValue: estadoAsientoRepository },
      ],
    }).compile();

    service = module.get<DisponibilidadService>(DisponibilidadService);
  });

  describe('obtenerMapaAsientos', () => {
    it('returns funcionId in the response', async () => {
      const result = await service.obtenerMapaAsientos('func-1');
      expect(result.funcionId).toBe('func-1');
    });

    it('maps all seats with correct fields', async () => {
      const result = await service.obtenerMapaAsientos('func-1');
      expect(result.asientos).toHaveLength(3);
      expect(result.asientos[0]).toEqual({
        id: 'seat-1',
        codigo: 'A1',
        fila: 'A',
        numero: 1,
        estado: AsientoEstado.DISPONIBLE,
      });
    });

    it('calls repository with the provided funcionId', async () => {
      await service.obtenerMapaAsientos('func-abc');
      expect(estadoAsientoRepository.findByFuncionId).toHaveBeenCalledWith('func-abc');
    });

    it('returns empty asientos array when function has no seats', async () => {
      estadoAsientoRepository.findByFuncionId.mockResolvedValue([]);
      const result = await service.obtenerMapaAsientos('func-empty');
      expect(result.asientos).toEqual([]);
    });
  });

  describe('obtenerResumenDisponibilidad', () => {
    it('returns funcionId in the response', async () => {
      const result = await service.obtenerResumenDisponibilidad('func-1');
      expect(result.funcionId).toBe('func-1');
    });

    it('spreads repository summary into the response', async () => {
      const result = await service.obtenerResumenDisponibilidad('func-1');
      expect(result.disponibles).toBe(1);
      expect(result.ocupados).toBe(1);
      expect(result.bloqueados).toBe(1);
    });

    it('calls repository with the provided funcionId', async () => {
      await service.obtenerResumenDisponibilidad('func-xyz');
      expect(estadoAsientoRepository.countDisponibilidad).toHaveBeenCalledWith('func-xyz');
    });
  });
});
