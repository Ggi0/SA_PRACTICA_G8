import { FunctionsService } from './functions.service';
import { AppError } from '../common/app-error';
import { IFunctionsRepository } from './functions.repository';
import { FunctionRecord } from './function.types';

// ─── Helper ──────────────────────────────────────────────────────────────────
const makeFunctionRecord = (overrides: any = {}): FunctionRecord => ({
  id: 'fn-1',
  peliculaId: 'movie-1',
  salaId: 'room-1',
  cinemaId: 'cinema-1',
  cityId: 'city-1',
  fechaHora: new Date('2025-12-20T19:00:00Z'),
  tipoSala: '2D',
  precioBase: 45,
  activa: true,
  salaNombre: 'Sala 1',
  cineNombre: 'CineMax Centro',
  ...overrides,
});

// ─── Mock del repositorio ────────────────────────────────────────────────────
const makeRepo = (): jest.Mocked<IFunctionsRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
});

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('FunctionsService', () => {
  let service: FunctionsService;
  let repo: jest.Mocked<IFunctionsRepository>;

  beforeEach(() => {
    repo = makeRepo();
    service = new FunctionsService(repo);
  });

  describe('listByMovie()', () => {
    it('retorna funciones de la película indicada', async () => {
      repo.findAll.mockResolvedValue([makeFunctionRecord(), makeFunctionRecord({ id: 'fn-2' })]);

      const result = await service.listByMovie('movie-1');

      expect(result).toHaveLength(2);
      expect(repo.findAll).toHaveBeenCalledWith({ movieId: 'movie-1', cityId: undefined });
    });

    it('filtra por ciudad cuando se proporciona cityId', async () => {
      repo.findAll.mockResolvedValue([makeFunctionRecord()]);

      await service.listByMovie('movie-1', 'city-1');

      expect(repo.findAll).toHaveBeenCalledWith({ movieId: 'movie-1', cityId: 'city-1' });
    });

    it('retorna arreglo vacío si no hay funciones', async () => {
      repo.findAll.mockResolvedValue([]);

      const result = await service.listByMovie('movie-sin-funciones');

      expect(result).toHaveLength(0);
    });

    it('mapea los campos al formato público correctamente', async () => {
      repo.findAll.mockResolvedValue([makeFunctionRecord()]);

      const [fn] = await service.listByMovie('movie-1');

      expect(fn).toMatchObject({
        id: 'fn-1',
        movieId: 'movie-1',
        roomId: 'room-1',
        cinemaId: 'cinema-1',
        cityId: 'city-1',
        projectionType: '2D',
        price: 45,
        roomName: 'Sala 1',
        cinemaName: 'CineMax Centro',
      });
    });

    it('mapea el nombre de la sala y del cine correctamente', async () => {
      repo.findAll.mockResolvedValue([
        makeFunctionRecord({ salaNombre: 'Sala IMAX 1', cineNombre: 'FilmStars Oakland Mall' }),
      ]);

      const [fn] = await service.listByMovie('movie-1');

      expect(fn.roomName).toBe('Sala IMAX 1');
      expect(fn.cinemaName).toBe('FilmStars Oakland Mall');
    });

    it('convierte la fecha a ISO string cuando es un objeto Date', async () => {
      const fecha = new Date('2025-12-20T19:00:00Z');
      repo.findAll.mockResolvedValue([makeFunctionRecord({ fechaHora: fecha })]);

      const [fn] = await service.listByMovie('movie-1');

      expect(fn.startTime).toBe(fecha.toISOString());
    });

    it('convierte la fecha a ISO string cuando es un string', async () => {
      repo.findAll.mockResolvedValue([
        makeFunctionRecord({ fechaHora: '2025-12-20T19:00:00Z' }),
      ]);

      const [fn] = await service.listByMovie('movie-1');

      expect(typeof fn.startTime).toBe('string');
      expect(fn.startTime).toContain('2025-12-20');
    });
  });

  describe('getById()', () => {
    it('retorna la función cuando existe', async () => {
      repo.findById.mockResolvedValue(makeFunctionRecord());

      const result = await service.getById('fn-1');

      expect(result.id).toBe('fn-1');
      expect(result.price).toBe(45);
    });

    it('lanza error 404 si la función no existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('no-existe')).rejects.toMatchObject({
        statusCode: 404,
        code: 'FUNCTION_NOT_FOUND',
      });
    });

    it('lanza AppError cuando la función no existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('x')).rejects.toBeInstanceOf(AppError);
    });

    it('incluye el precio base en el resultado', async () => {
      repo.findById.mockResolvedValue(makeFunctionRecord({ precioBase: 80 }));

      const result = await service.getById('fn-1');

      expect(result.price).toBe(80);
    });

    it('incluye el nombre de la sala y del cine en el resultado', async () => {
      repo.findById.mockResolvedValue(
        makeFunctionRecord({ salaNombre: 'Sala 4DX', cineNombre: 'FilmStars Pradera' }),
      );

      const result = await service.getById('fn-1');

      expect(result.roomName).toBe('Sala 4DX');
      expect(result.cinemaName).toBe('FilmStars Pradera');
    });
  });
});