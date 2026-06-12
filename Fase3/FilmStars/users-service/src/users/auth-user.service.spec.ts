import { AuthService } from '../auth/auth.service';
import { UserService, toPublicUser } from './user.service';
import { AppError } from '../common/app-error';
import { IUserRepository } from './user.repository';
import { UserRecord } from './user.types';

// ─── Mocks ───────────────────────────────────────────────────────────────────
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
}));

jest.mock('../config/env', () => ({
  env: {
    jwtSecret: 'test-secret',
    jwtExpiresIn: '1h',
  },
}));

import bcrypt from 'bcryptjs';

// ─── Helper ──────────────────────────────────────────────────────────────────
const makeUser = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: 'user-1',
  nombre: 'Naomi',
  email: 'naomi@test.com',
  passwordHash: 'hashed_password',
  rol: 'customer',
  activo: true,
  telefono: null,
  dpi: null,
  fechaNacimiento: null,
  direccion: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});
const makeRepo = (): jest.Mocked<IUserRepository> => ({
  initialize: jest.fn(),

  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updatePassword: jest.fn(),
  updateStatus: jest.fn(),
  softDelete: jest.fn(),
  countAdmins: jest.fn(),
});
// ════════════════════════════════════════════════════════════════════════════
//  USER SERVICE
// ════════════════════════════════════════════════════════════════════════════
describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    repo = makeRepo();
    service = new UserService(repo);
  });

  describe('create()', () => {
    it('crea un usuario correctamente con datos válidos', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(makeUser());

      const result = await service.create({
        nombre: 'Naomi',
        email: 'naomi@test.com',
        password: 'password123',
      });

      expect(result.email).toBe('naomi@test.com');
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it('lanza error 409 si el email ya existe', async () => {
      repo.findByEmail.mockResolvedValue(makeUser());

      await expect(
        service.create({ nombre: 'Naomi', email: 'naomi@test.com', password: 'password123' }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_ALREADY_EXISTS' });
    });

    it('lanza error 400 si el nombre está vacío', async () => {
      await expect(
        service.create({ nombre: '   ', email: 'naomi@test.com', password: 'password123' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_NAME' });
    });

    it('lanza error 400 si el email es inválido', async () => {
      await expect(
        service.create({ nombre: 'Naomi', email: 'no-es-email', password: 'password123' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_EMAIL' });
    });

    it('lanza error 400 si la contraseña tiene menos de 8 caracteres', async () => {
      await expect(
        service.create({ nombre: 'Naomi', email: 'naomi@test.com', password: '123' }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_PASSWORD' });
    });

    it('asigna rol admin cuando se especifica forcedRole', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(makeUser({ rol: 'admin' }));

      const result = await service.create(
        { nombre: 'Admin', email: 'admin@test.com', password: 'password123' },
        'admin',
      );

      expect(result.rol).toBe('admin');
    });
  });

  describe('getById()', () => {
    it('retorna el usuario público cuando existe', async () => {
      repo.findById.mockResolvedValue(makeUser());

      const result = await service.getById('user-1');

      expect(result.id).toBe('user-1');
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('lanza error 404 si el usuario no existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('no-existe')).rejects.toMatchObject({
        statusCode: 404,
        code: 'CLIENT_NOT_FOUND',
      });
    });
  });

  describe('changePassword()', () => {
    it('actualiza contraseña correctamente', async () => {
      repo.findById.mockResolvedValue(makeUser());
      repo.updatePassword.mockResolvedValue(undefined);

      await expect(service.changePassword('user-1', 'nuevaPassword123')).resolves.not.toThrow();
    });

    it('lanza error 400 si la contraseña tiene menos de 8 caracteres', async () => {
      repo.findById.mockResolvedValue(makeUser());

      await expect(service.changePassword('user-1', 'corta')).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_PASSWORD',
      });
    });
  });

  describe('update()', () => {
    it('actualiza correctamente con datos válidos', async () => {
      repo.findById.mockResolvedValue(makeUser());
      repo.findByEmail.mockResolvedValue(null);
      repo.update.mockResolvedValue(makeUser({ nombre: 'Naomi Actualizada' }));

      const result = await service.update('user-1', { nombre: 'Naomi Actualizada' });

      expect(result.nombre).toBe('Naomi Actualizada');
    });

    it('lanza error 409 si el nuevo email pertenece a otro usuario', async () => {
      repo.findById.mockResolvedValue(makeUser());
      repo.findByEmail.mockResolvedValue(makeUser({ id: 'otro-user' }));

      await expect(
        service.update('user-1', { email: 'otro@test.com' }),
      ).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_ALREADY_EXISTS' });
    });
  });

  describe('remove()', () => {
    it('elimina correctamente cuando el usuario existe', async () => {
      repo.findById.mockResolvedValue(makeUser());
      repo.softDelete.mockResolvedValue(undefined);

      await expect(service.remove('user-1')).resolves.not.toThrow();
      expect(repo.softDelete).toHaveBeenCalledWith('user-1');
    });

    it('lanza error 404 si el usuario no existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.remove('no-existe')).rejects.toMatchObject({
        statusCode: 404,
        code: 'CLIENT_NOT_FOUND',
      });
    });
  });

  describe('bootstrapDefaultAdmin()', () => {
    it('no crea admin si ya existe uno', async () => {
      repo.countAdmins.mockResolvedValue(1);

      await service.bootstrapDefaultAdmin('Admin', 'admin@test.com', 'password123');

      expect(repo.create).not.toHaveBeenCalled();
    });

    it('crea el admin cuando no existe ninguno', async () => {
      repo.countAdmins.mockResolvedValue(0);
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(makeUser({ rol: 'admin' }));

      await service.bootstrapDefaultAdmin('Admin', 'admin@test.com', 'password123');

      expect(repo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('toPublicUser()', () => {
    it('no expone el passwordHash en el objeto público', () => {
      const user = makeUser();
      const publicUser = toPublicUser(user);

      expect((publicUser as any).passwordHash).toBeUndefined();
      expect(publicUser.id).toBe(user.id);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  AUTH SERVICE
// ════════════════════════════════════════════════════════════════════════════
describe('AuthService', () => {
  let service: AuthService;
  let mockUserService: any;

  beforeEach(() => {
    mockUserService = {
      create: jest.fn(),
      getRecordById: jest.fn(),
      getRecordByEmail: jest.fn(),
      list: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      changePassword: jest.fn(),
      updateStatus: jest.fn(),
      remove: jest.fn(),
      bootstrapDefaultAdmin: jest.fn(),
    };
    service = new AuthService(mockUserService);
  });

  describe('register()', () => {
    it('registra un usuario y retorna token JWT', async () => {
      const user = makeUser();
      mockUserService.create.mockResolvedValue(toPublicUser(user));
      mockUserService.getRecordById.mockResolvedValue(user);

      const result = await service.register({
        nombre: 'Naomi',
        email: 'naomi@test.com',
        password: 'password123',
      });

      expect(result.access_token).toBe('mock.jwt.token');
      expect(result.token_type).toBe('Bearer');
      expect(result.user.email).toBe('naomi@test.com');
    });

    it('retorna expires_in en la respuesta', async () => {
      const user = makeUser();
      mockUserService.create.mockResolvedValue(toPublicUser(user));
      mockUserService.getRecordById.mockResolvedValue(user);

      const result = await service.register({
        nombre: 'Naomi',
        email: 'naomi@test.com',
        password: 'password123',
      });

      expect(result.expires_in).toBe('1h');
    });
  });

  describe('login()', () => {
    it('retorna token JWT con credenciales correctas', async () => {
      const user = makeUser();
      mockUserService.getRecordByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'naomi@test.com',
        password: 'password123',
      });

      expect(result.access_token).toBe('mock.jwt.token');
      expect(result.user.email).toBe('naomi@test.com');
    });

    it('lanza error 401 si el usuario no existe', async () => {
      mockUserService.getRecordByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@test.com', password: 'password123' }),
      ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
    });

    it('lanza error 403 si el usuario está inactivo', async () => {
      mockUserService.getRecordByEmail.mockResolvedValue(makeUser({ activo: false }));

      await expect(
        service.login({ email: 'naomi@test.com', password: 'password123' }),
      ).rejects.toMatchObject({ statusCode: 403, code: 'INACTIVE_CLIENT' });
    });

    it('lanza error 401 si la contraseña es incorrecta', async () => {
      mockUserService.getRecordByEmail.mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'naomi@test.com', password: 'incorrecta' }),
      ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
    });
  });

  describe('sign()', () => {
    it('genera un token JWT con los claims del usuario', () => {
      const user = makeUser();

      const token = service.sign(user);

      expect(token).toBe('mock.jwt.token');
    });

    it('incluye el rol en el token', () => {
      const jwt = require('jsonwebtoken');
      const user = makeUser({ rol: 'admin' });

      service.sign(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ rol: 'admin' }),
        'test-secret',
        expect.any(Object),
      );
    });
  });
});
