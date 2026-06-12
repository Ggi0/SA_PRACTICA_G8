import { CitiesService } from './cities.service';
import { AppError } from '../common/app-error';
import { ICitiesRepository } from './cities.repository';

// ─── Helper ──────────────────────────────────────────────────────────────────
const makeCityRecord = (overrides = {}) => ({
  id: 'city-1',
  nombre: 'Guatemala',
  activa: true,
  creado: new Date('2024-01-01'),
  modificacion: new Date('2024-01-01'),
  ...overrides,
});

const makeRepo = (): jest.Mocked<ICitiesRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('CitiesService', () => {
  let service: CitiesService;
  let repo: jest.Mocked<ICitiesRepository>;

  beforeEach(() => {
    repo = makeRepo();
    service = new CitiesService(repo);
  });

  describe('list()', () => {
    it('retorna lista de ciudades en formato público', async () => {
      repo.findAll.mockResolvedValue([
        makeCityRecord(),
        makeCityRecord({ id: 'city-2', nombre: 'Quetzaltenango' }),
      ]);

      const result = await service.list();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'city-1', name: 'Guatemala' });
      expect(result[1]).toEqual({ id: 'city-2', name: 'Quetzaltenango' });
    });

    it('retorna arreglo vacío si no hay ciudades', async () => {
      repo.findAll.mockResolvedValue([]);

      const result = await service.list();

      expect(result).toHaveLength(0);
    });

    it('mapea "nombre" a "name" correctamente', async () => {
      repo.findAll.mockResolvedValue([makeCityRecord({ nombre: 'Antigua Guatemala' })]);

      const [city] = await service.list();

      expect(city.name).toBe('Antigua Guatemala');
      expect((city as any).nombre).toBeUndefined();
    });

    it('llama al repositorio una sola vez', async () => {
      repo.findAll.mockResolvedValue([]);

      await service.list();

      expect(repo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById()', () => {
    it('retorna la ciudad cuando existe', async () => {
      repo.findById.mockResolvedValue(makeCityRecord());

      const result = await service.getById('city-1');

      expect(result).toEqual({ id: 'city-1', name: 'Guatemala' });
    });

    it('lanza error 404 si la ciudad no existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('no-existe')).rejects.toMatchObject({
        statusCode: 404,
        code: 'CITY_NOT_FOUND',
      });
    });

    it('lanza AppError cuando no encuentra la ciudad', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('x')).rejects.toBeInstanceOf(AppError);
    });

    it('llama al repositorio con el id correcto', async () => {
      repo.findById.mockResolvedValue(makeCityRecord());

      await service.getById('city-1');

      expect(repo.findById).toHaveBeenCalledWith('city-1');
    });
  });
});
