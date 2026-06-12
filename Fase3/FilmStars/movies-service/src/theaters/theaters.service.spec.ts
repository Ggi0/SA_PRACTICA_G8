import { TheatersService } from './theaters.service';
import { CineAdmService } from './admin/cineAdm.service';
import { AppError } from '../common/app-error';
import { ITheatersRepository } from './theaters.repository';
import { TheaterRecord } from './theater.types';

// ─── Helper ──────────────────────────────────────────────────────────────────
const makeTheaterRecord = (overrides: Partial<TheaterRecord> = {}): TheaterRecord => ({
  id: 'theater-1',
  nombre: 'Cinépolis Oakland Mall',
  direccion: 'Oakland Mall, Zona 10',
  ciudadId: 'city-1',
  activo: true,
  creado: new Date('2024-01-01'),
  modificacion: new Date('2024-01-01'),
  ...overrides,
});

const makeCinema = (overrides: any = {}) => ({
  id: 'cinema-1',
  nombre: 'Cinépolis Oakland',
  cityId: 'city-1',
  ...overrides,
});

// ════════════════════════════════════════════════════════════════════════════
//  THEATERS SERVICE
// ════════════════════════════════════════════════════════════════════════════

const makeTheatersRepo = (): jest.Mocked<ITheatersRepository> => ({
  findByCityId: jest.fn(),
  findById: jest.fn(),
});

describe('TheatersService', () => {
  let service: TheatersService;
  let repo: jest.Mocked<ITheatersRepository>;

  beforeEach(() => {
    repo = makeTheatersRepo();
    service = new TheatersService(repo);
  });

  describe('listByCity()', () => {
    it('retorna cines de la ciudad indicada', async () => {
      repo.findByCityId.mockResolvedValue([
        makeTheaterRecord(),
        makeTheaterRecord({ id: 'theater-2', nombre: 'Cinépolis Miraflores' }),
      ]);
      const result = await service.listByCity('city-1');
      expect(result).toHaveLength(2);
      expect(repo.findByCityId).toHaveBeenCalledWith('city-1');
    });

    it('retorna arreglo vacío si no hay cines en la ciudad', async () => {
      repo.findByCityId.mockResolvedValue([]);
      const result = await service.listByCity('city-sin-cines');
      expect(result).toHaveLength(0);
    });

    it('mapea correctamente los campos al formato público', async () => {
      repo.findByCityId.mockResolvedValue([makeTheaterRecord()]);
      const [theater] = await service.listByCity('city-1');
      expect(theater).toEqual({
        id: 'theater-1',
        name: 'Cinépolis Oakland Mall',
        address: 'Oakland Mall, Zona 10',
        cityId: 'city-1',
      });
    });

    it('no expone campos internos como "nombre" o "direccion"', async () => {
      repo.findByCityId.mockResolvedValue([makeTheaterRecord()]);
      const [theater] = await service.listByCity('city-1');
      expect((theater as any).nombre).toBeUndefined();
      expect((theater as any).direccion).toBeUndefined();
    });
  });

  describe('getById()', () => {
    it('retorna el cine cuando existe', async () => {
      repo.findById.mockResolvedValue(makeTheaterRecord());
      const result = await service.getById('theater-1');
      expect(result.id).toBe('theater-1');
      expect(result.name).toBe('Cinépolis Oakland Mall');
    });

    it('lanza error 404 si el cine no existe', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getById('no-existe')).rejects.toMatchObject({
        statusCode: 404,
        code: 'THEATER_NOT_FOUND',
      });
    });

    it('lanza AppError cuando el cine no existe', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getById('x')).rejects.toBeInstanceOf(AppError);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  CINE ADM SERVICE
// ════════════════════════════════════════════════════════════════════════════

const makeCineRepo = () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getCities: jest.fn(),
  getCinemasByCity: jest.fn(),
});

describe('CineAdmService', () => {
  let service: CineAdmService;
  let repo: ReturnType<typeof makeCineRepo>;

  beforeEach(() => {
    repo = makeCineRepo();
    service = new CineAdmService(repo as any);
  });

  describe('findAll()', () => {
    it('retorna todos los cines', async () => {
      repo.findAll.mockResolvedValue([makeCinema(), makeCinema({ id: 'cinema-2' })]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });

    it('retorna arreglo vacío si no hay cines', async () => {
      repo.findAll.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toHaveLength(0);
    });
  });

  describe('findById()', () => {
    it('retorna el cine cuando existe', async () => {
      repo.findById.mockResolvedValue(makeCinema());
      const result = await service.findById('cinema-1');
      expect(result.id).toBe('cinema-1');
    });

    it('lanza error 404 si el cine no existe', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('no-existe')).rejects.toMatchObject({
        statusCode: 404,
        code: 'CINEMA_NOT_FOUND',
      });
    });

    it('lanza AppError cuando no encuentra el cine', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('x')).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('create()', () => {
    it('crea un cine y lo retorna', async () => {
      repo.create.mockResolvedValue(makeCinema());
      await service.create({ nombre: 'Nuevo Cine', cityId: 'city-1' });
      expect(repo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update()', () => {
    it('actualiza el cine cuando existe', async () => {
      repo.findById.mockResolvedValue(makeCinema());
      repo.update.mockResolvedValue(makeCinema({ nombre: 'Actualizado' }));
      await service.update('cinema-1', { nombre: 'Actualizado' });
      expect(repo.update).toHaveBeenCalledWith('cinema-1', { nombre: 'Actualizado' });
    });

    it('lanza error 404 al actualizar cine inexistente', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('no-existe', {})).rejects.toMatchObject({
        statusCode: 404,
        code: 'CINEMA_NOT_FOUND',
      });
    });
  });

  describe('delete()', () => {
    it('elimina el cine cuando existe', async () => {
      repo.findById.mockResolvedValue(makeCinema());
      repo.delete.mockResolvedValue(undefined);
      await expect(service.delete('cinema-1')).resolves.not.toThrow();
      expect(repo.delete).toHaveBeenCalledWith('cinema-1');
    });

    it('lanza error 404 al eliminar cine inexistente', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.delete('no-existe')).rejects.toMatchObject({
        statusCode: 404,
        code: 'CINEMA_NOT_FOUND',
      });
    });
  });

  describe('getCities()', () => {
    it('retorna las ciudades disponibles', async () => {
      repo.getCities.mockResolvedValue([{ id: 'city-1', nombre: 'Guatemala' }]);
      const result = await service.getCities();
      expect(result).toHaveLength(1);
    });
  });

  describe('getCinemasByCity()', () => {
    it('filtra cines por ciudad', async () => {
      repo.getCinemasByCity.mockResolvedValue([makeCinema()]);
      const result = await service.getCinemasByCity('city-1');
      expect(result).toHaveLength(1);
      expect(repo.getCinemasByCity).toHaveBeenCalledWith('city-1');
    });

    it('retorna vacío si la ciudad no tiene cines', async () => {
      repo.getCinemasByCity.mockResolvedValue([]);
      const result = await service.getCinemasByCity('city-sin-cines');
      expect(result).toHaveLength(0);
    });
  });
});
