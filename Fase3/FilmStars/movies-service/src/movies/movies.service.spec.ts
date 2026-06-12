import { MoviesService } from './movies.service';
import { MoviesAdmService } from './admin/moviesAdm.service';
import { AppError } from '../common/app-error';
import { IMoviesRepository } from './movies.repository';
import { MovieRecord, MovieType } from './movie.types';
import { EstrenoPriceStrategy } from './price-strategy/estreno.strategy';
import { PreventaPriceStrategy } from './price-strategy/preventa.strategy';
import { ReestrenoPriceStrategy } from './price-strategy/reestreno.strategy';

// ─── Helper ──────────────────────────────────────────────────────────────────
const makeMovie = (overrides: Partial<MovieRecord> = {}): MovieRecord => ({
  id: 'movie-1',
  titulo: 'Película Test',
  sinopsis: 'Una sinopsis de prueba',
  posterUrl: 'https://img.test/poster.jpg',
  duracionMin: 120,
  generos: ['Acción'],
  clasificacion: 'PG-13',
  tipo: 'ESTRENO' as MovieType,
  fechaEstreno: '2025-01-01',
  activa: true,
  creado: new Date('2024-01-01'),
  modificacion: new Date('2024-01-01'),
  ...overrides,
});

// ════════════════════════════════════════════════════════════════════════════
//  MOVIES SERVICE
// ════════════════════════════════════════════════════════════════════════════

const makeMoviesRepo = (): jest.Mocked<IMoviesRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
});

describe('MoviesService', () => {
  let service: MoviesService;
  let repo: jest.Mocked<IMoviesRepository>;

  beforeEach(() => {
    repo = makeMoviesRepo();
    service = new MoviesService(repo);
  });

  describe('list()', () => {
    it('retorna lista de películas en formato público', async () => {
      repo.findAll.mockResolvedValue([makeMovie(), makeMovie({ id: 'movie-2', titulo: 'Otra' })]);

      const result = await service.list({});

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('movie-1');
    });

    it('retorna lista vacía si no hay películas', async () => {
      repo.findAll.mockResolvedValue([]);

      const result = await service.list({});

      expect(result).toHaveLength(0);
    });

    it('mapea correctamente los campos al formato público', async () => {
      repo.findAll.mockResolvedValue([makeMovie()]);

      const [movie] = await service.list({});

      expect(movie).toMatchObject({
        id: 'movie-1',
        title: 'Película Test',
        synopsis: 'Una sinopsis de prueba',
        duration: 120,
        rating: 'PG-13',
        category: 'ESTRENO',
      });
    });

    it('ESTRENO mapea a categoría "ESTRENO"', async () => {
      repo.findAll.mockResolvedValue([makeMovie({ tipo: 'ESTRENO' })]);
      const [movie] = await service.list({});
      expect(movie.category).toBe('ESTRENO');
    });

    it('PREVENTA mapea a categoría "PRE_VENTA"', async () => {
      repo.findAll.mockResolvedValue([makeMovie({ tipo: 'PREVENTA' })]);
      const [movie] = await service.list({});
      expect(movie.category).toBe('PRE_VENTA');
    });

    it('REESTRENO mapea a categoría "RE_ESTRENO"', async () => {
      repo.findAll.mockResolvedValue([makeMovie({ tipo: 'REESTRENO' })]);
      const [movie] = await service.list({});
      expect(movie.category).toBe('RE_ESTRENO');
    });
  });

  describe('getById()', () => {
    it('retorna la película cuando existe', async () => {
      repo.findById.mockResolvedValue(makeMovie());

      const result = await service.getById('movie-1');

      expect(result.id).toBe('movie-1');
      expect(result.title).toBe('Película Test');
    });

    it('lanza error 404 si la película no existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('no-existe')).rejects.toMatchObject({
        statusCode: 404,
        code: 'MOVIE_NOT_FOUND',
      });
    });

    it('lanza AppError cuando no encuentra la película', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('x')).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('calculatePrice() - Estrategia de precios (OCP)', () => {
    it('ESTRENO retorna el precio base sin modificación', () => {
      const result = service.calculatePrice('ESTRENO', 100);
      expect(result).toBe(100);
    });

    it('PREVENTA aplica recargo del 10%', () => {
      const result = service.calculatePrice('PREVENTA', 100);
      expect(result).toBe(110);
    });

    it('REESTRENO aplica descuento del 15%', () => {
      const result = service.calculatePrice('REESTRENO', 100);
      expect(result).toBe(85);
    });

    it('PREVENTA es más caro que ESTRENO', () => {
      const preventa = service.calculatePrice('PREVENTA', 100);
      const estreno = service.calculatePrice('ESTRENO', 100);
      expect(preventa).toBeGreaterThan(estreno);
    });

    it('retorna el precio base si el tipo no tiene estrategia', () => {
      const result = service.calculatePrice('DESCONOCIDO' as MovieType, 100);
      expect(result).toBe(100);
    });

    it('maneja precio base 0 correctamente', () => {
      expect(service.calculatePrice('ESTRENO', 0)).toBe(0);
    });
  });
});

// ─── Estrategias de precio directas (OCP / LSP) ───────────────────────────────
describe('PriceStrategies', () => {
  it('EstrenoPriceStrategy retorna el precio base sin cambio', () => {
    const s = new EstrenoPriceStrategy();
    expect(s.calculate(100)).toBe(100);
  });

  it('PreventaPriceStrategy aplica recargo del 10%', () => {
    const s = new PreventaPriceStrategy();
    expect(s.calculate(100)).toBe(110);
  });

  it('ReestrenoPriceStrategy aplica descuento del 15%', () => {
    const s = new ReestrenoPriceStrategy();
    expect(s.calculate(100)).toBe(85);
  });

  it('todas las estrategias retornan 0 cuando el precio base es 0', () => {
    expect(new EstrenoPriceStrategy().calculate(0)).toBe(0);
    expect(new PreventaPriceStrategy().calculate(0)).toBe(0);
    expect(new ReestrenoPriceStrategy().calculate(0)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  MOVIES ADM SERVICE
// ════════════════════════════════════════════════════════════════════════════

const makeAdmRepo = () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getGenres: jest.fn(),
});

describe('MoviesAdmService', () => {
  let service: MoviesAdmService;
  let repo: ReturnType<typeof makeAdmRepo>;

  beforeEach(() => {
    repo = makeAdmRepo();
    service = new MoviesAdmService(repo as any);
  });

  describe('findAll()', () => {
    it('retorna todas las películas', async () => {
      repo.findAll.mockResolvedValue([makeMovie(), makeMovie({ id: 'movie-2' })]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });

    it('retorna arreglo vacío si no hay películas', async () => {
      repo.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findById()', () => {
    it('retorna la película cuando existe', async () => {
      repo.findById.mockResolvedValue(makeMovie());

      const result = await service.findById('movie-1');

      expect(result.id).toBe('movie-1');
    });

    it('lanza error 404 si la película no existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById('no-existe')).rejects.toMatchObject({
        statusCode: 404,
        code: 'MOVIE_NOT_FOUND',
      });
    });
  });

  describe('create()', () => {
    it('crea una película y la retorna', async () => {
      repo.create.mockResolvedValue(makeMovie());

      const result = await service.create({ titulo: 'Nueva', tipo: 'ESTRENO' });

      expect(repo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update()', () => {
    it('actualiza la película cuando existe', async () => {
      repo.findById.mockResolvedValue(makeMovie());
      repo.update.mockResolvedValue(makeMovie({ titulo: 'Actualizada' }));

      const result = await service.update('movie-1', { titulo: 'Actualizada' });

      expect(repo.update).toHaveBeenCalledWith('movie-1', { titulo: 'Actualizada' });
    });

    it('lanza error 404 al actualizar película inexistente', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.update('no-existe', {})).rejects.toMatchObject({
        statusCode: 404,
        code: 'MOVIE_NOT_FOUND',
      });
    });
  });

  describe('delete()', () => {
    it('elimina la película cuando existe', async () => {
      repo.findById.mockResolvedValue(makeMovie());
      repo.delete.mockResolvedValue(undefined);

      await expect(service.delete('movie-1')).resolves.not.toThrow();
      expect(repo.delete).toHaveBeenCalledWith('movie-1');
    });

    it('lanza error 404 al eliminar película inexistente', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.delete('no-existe')).rejects.toMatchObject({
        statusCode: 404,
        code: 'MOVIE_NOT_FOUND',
      });
    });
  });

  describe('getGenres()', () => {
    it('retorna los géneros disponibles', async () => {
      repo.getGenres.mockResolvedValue(['Acción', 'Drama', 'Comedia']);

      const result = await service.getGenres();

      expect(result).toEqual(['Acción', 'Drama', 'Comedia']);
    });
  });
});