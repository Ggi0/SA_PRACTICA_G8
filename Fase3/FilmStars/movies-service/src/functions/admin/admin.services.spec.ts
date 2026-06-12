import { FunctAdmService } from './funciones/functAdm.service';
import { SalaAdmService } from './salas/salaAdm.service';
import { NotFoundException } from '@nestjs/common';

// ════════════════════════════════════════════════════════════════════════════
//  FUNCT ADM SERVICE
// ════════════════════════════════════════════════════════════════════════════

const makeFunctRepo = () => ({
  getMoviesCatalog: jest.fn(),
  getRoomsCatalog: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByMovie: jest.fn(),
  findByRoom: jest.fn(),
  findByDate: jest.fn(),
  findSeatsBySalaId: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const makeFunction = (overrides: any = {}) => ({
  id: 'fn-1',
  movieId: 'movie-1',
  roomId: 'room-1',
  tipo: 'ESTRENO',
  fechaHora: '2025-12-20T19:00:00Z',
  ...overrides,
});

describe('FunctAdmService', () => {
  let service: FunctAdmService;
  let repo: ReturnType<typeof makeFunctRepo>;
  let mockSyncService: { inicializarAsientosFuncion: jest.Mock };

  beforeEach(() => {
    repo = makeFunctRepo();
    mockSyncService = { inicializarAsientosFuncion: jest.fn().mockResolvedValue({}) };
    service = new FunctAdmService(repo, mockSyncService as any);
  });

  describe('findAll()', () => {
    it('retorna todas las funciones', async () => {
      repo.findAll.mockResolvedValue([makeFunction(), makeFunction({ id: 'fn-2' })]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(repo.findAll).toHaveBeenCalledTimes(1);
    });

    it('retorna arreglo vacío si no hay funciones', async () => {
      repo.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findById()', () => {
    it('retorna la función cuando existe', async () => {
      repo.findById.mockResolvedValue(makeFunction());

      const result = await service.findById('fn-1');

      expect(result.id).toBe('fn-1');
      expect(repo.findById).toHaveBeenCalledWith('fn-1');
    });

    it('retorna null si no existe (sin validación en el servicio)', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.findById('no-existe');

      expect(result).toBeNull();
    });
  });

  describe('findByMovie()', () => {
    it('filtra funciones por película', async () => {
      repo.findByMovie.mockResolvedValue([makeFunction()]);

      const result = await service.findByMovie('movie-1');

      expect(result).toHaveLength(1);
      expect(repo.findByMovie).toHaveBeenCalledWith('movie-1');
    });

    it('retorna vacío si la película no tiene funciones', async () => {
      repo.findByMovie.mockResolvedValue([]);

      const result = await service.findByMovie('movie-sin-funciones');

      expect(result).toHaveLength(0);
    });
  });

  describe('findByRoom()', () => {
    it('filtra funciones por sala', async () => {
      repo.findByRoom.mockResolvedValue([makeFunction()]);

      const result = await service.findByRoom('room-1');

      expect(result).toHaveLength(1);
      expect(repo.findByRoom).toHaveBeenCalledWith('room-1');
    });
  });

  describe('findByDate()', () => {
    it('filtra funciones por fecha', async () => {
      repo.findByDate.mockResolvedValue([makeFunction()]);

      const result = await service.findByDate('2025-12-20');

      expect(result).toHaveLength(1);
      expect(repo.findByDate).toHaveBeenCalledWith('2025-12-20');
    });
  });

  describe('create()', () => {
    it('crea una función y la retorna', async () => {
      const data = { movieId: 'movie-1', roomId: 'room-1', tipo: 'ESTRENO' };
      repo.create.mockResolvedValue(makeFunction(data));
      repo.findSeatsBySalaId.mockResolvedValue([]);
      mockSyncService.inicializarAsientosFuncion.mockResolvedValue({});

      const result = await service.create(data);

      expect(repo.create).toHaveBeenCalledWith(data);
    });
  });

  describe('update()', () => {
    it('actualiza una función correctamente', async () => {
      const data = { tipo: 'PREVENTA' };
      repo.update.mockResolvedValue(makeFunction(data));

      await service.update('fn-1', data);

      expect(repo.update).toHaveBeenCalledWith('fn-1', data);
    });
  });

  describe('delete()', () => {
    it('elimina una función correctamente', async () => {
      repo.delete.mockResolvedValue(undefined);

      await service.delete('fn-1');

      expect(repo.delete).toHaveBeenCalledWith('fn-1');
    });
  });

  describe('getMoviesCatalog()', () => {
    it('retorna el catálogo de películas', async () => {
      repo.getMoviesCatalog.mockResolvedValue([{ id: 'movie-1', titulo: 'Película Test' }]);

      const result = await service.getMoviesCatalog();

      expect(result).toHaveLength(1);
      expect(repo.getMoviesCatalog).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRoomsCatalog()', () => {
    it('retorna el catálogo de salas', async () => {
      repo.getRoomsCatalog.mockResolvedValue([{ id: 'room-1', nombre: 'Sala 1' }]);

      const result = await service.getRoomsCatalog();

      expect(result).toHaveLength(1);
      expect(repo.getRoomsCatalog).toHaveBeenCalledTimes(1);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  SALA ADM SERVICE
// ════════════════════════════════════════════════════════════════════════════

const makeSalaRepo = () => ({
  getCines: jest.fn(),
  findAll: jest.fn(),
  findByCinema: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const makeSala = (overrides: any = {}) => ({
  id: 'sala-1',
  nombre: 'Sala VIP',
  capacidad: 100,
  cineId: 'cinema-1',
  ...overrides,
});

describe('SalaAdmService', () => {
  let service: SalaAdmService;
  let repo: ReturnType<typeof makeSalaRepo>;

  beforeEach(() => {
    repo = makeSalaRepo();
    service = new SalaAdmService(repo as any);
  });

  describe('getAll()', () => {
    it('retorna todas las salas', async () => {
      repo.findAll.mockResolvedValue([makeSala(), makeSala({ id: 'sala-2' })]);

      const result = await service.getAll();

      expect(result).toHaveLength(2);
      expect(repo.findAll).toHaveBeenCalledTimes(1);
    });

    it('retorna arreglo vacío si no hay salas', async () => {
      repo.findAll.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('getByCinema()', () => {
    it('filtra salas por cine', async () => {
      repo.findByCinema.mockResolvedValue([makeSala()]);

      const result = await service.getByCinema('cinema-1');

      expect(result).toHaveLength(1);
      expect(repo.findByCinema).toHaveBeenCalledWith('cinema-1');
    });

    it('retorna vacío si el cine no tiene salas', async () => {
      repo.findByCinema.mockResolvedValue([]);

      const result = await service.getByCinema('cinema-sin-salas');

      expect(result).toHaveLength(0);
    });
  });

  describe('getById()', () => {
    it('retorna la sala cuando existe', async () => {
      repo.findById.mockResolvedValue(makeSala());

      const result = await service.getById('sala-1');

      expect(result.id).toBe('sala-1');
    });

    it('lanza NotFoundException si la sala no existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('no-existe')).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException con mensaje correcto', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('no-existe')).rejects.toThrow('Sala no encontrada');
    });
  });

  describe('create()', () => {
    it('crea una sala y retorna mensaje de éxito', async () => {
      repo.create.mockResolvedValue(undefined);
      const data = { nombre: 'Sala Nueva', capacidad: 80, cineId: 'cinema-1' };

      const result = await service.create(data);

      expect(result).toEqual({ message: 'Sala creada correctamente' });
      expect(repo.create).toHaveBeenCalledWith(data);
    });
  });

  describe('update()', () => {
    it('actualiza sala existente y retorna mensaje de éxito', async () => {
      repo.findById.mockResolvedValue(makeSala());
      repo.update.mockResolvedValue(undefined);

      const result = await service.update('sala-1', { nombre: 'Sala Actualizada' });

      expect(result).toEqual({ message: 'Sala actualizada correctamente' });
      expect(repo.update).toHaveBeenCalledWith('sala-1', { nombre: 'Sala Actualizada' });
    });

    it('lanza NotFoundException al actualizar sala inexistente', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.update('no-existe', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete()', () => {
    it('elimina sala existente y retorna mensaje de éxito', async () => {
      repo.findById.mockResolvedValue(makeSala());
      repo.delete.mockResolvedValue(undefined);

      const result = await service.delete('sala-1');

      expect(result).toEqual({ message: 'Sala eliminada correctamente' });
      expect(repo.delete).toHaveBeenCalledWith('sala-1');
    });

    it('lanza NotFoundException al eliminar sala inexistente', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.delete('no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCines()', () => {
    it('retorna la lista de cines disponibles', async () => {
      repo.getCines.mockResolvedValue([{ id: 'cinema-1', nombre: 'Cinépolis' }]);

      const result = await service.getCines();

      expect(result).toHaveLength(1);
      expect(repo.getCines).toHaveBeenCalledTimes(1);
    });
  });
});
