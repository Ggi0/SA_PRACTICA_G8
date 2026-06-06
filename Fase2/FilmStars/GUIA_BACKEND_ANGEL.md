# 🎬 FilmStars – Guía Backend Completa (Angel)

## Tu responsabilidad
1. Estructura del backend (para que todos puedan trabajar)
2. Servicio de Usuarios completo
3. JWT funcional
4. API Gateway
5. Docker local (todo con contenedores)

---

## Stack elegido y justificación

| Qué | Qué usamos | Por qué |
|---|---|---|
| Lenguaje | TypeScript | Tipado fuerte = SOLID más limpio, interfaces reales |
| Framework backend | NestJS | DI nativa = DIP automático; Guards = JWT limpio; Módulos = SRP claro |
| ORM | TypeORM | Compatible con PostgreSQL, NO es Prisma ni Supabase (prohibidos) |
| Base de datos | PostgreSQL | Una instancia por servicio (requisito SOA) |
| Broker | RabbitMQ | Requisito explícito del enunciado |
| Contenedores | Docker + Compose | Requisito obligatorio |

> **Sobre NestJS**: Su sistema de inyección de dependencias te da el principio D (DIP) casi gratis. Cuando el enunciado dice "uso estricto de interfaces para desacoplar controladores de servicios", NestJS fue hecho exactamente para eso.

---

## Puertos asignados

| Servicio | Puerto externo | Puerto interno |
|---|---|---|
| API Gateway | **8080** | 8080 |
| Users Service | 3001 | 3001 |
| Movies Service | 3002 | 3002 |
| Reservations Service | 3003 | 3003 |
| Payments Service | 3004 | 3004 |
| PostgreSQL (users) | 5433 | 5432 |
| PostgreSQL (movies) | 5434 | 5432 |
| PostgreSQL (reservations) | 5435 | 5432 |
| PostgreSQL (payments) | 5436 | 5432 |
| RabbitMQ AMQP | 5672 | 5672 |
| RabbitMQ UI | 15672 | 15672 |

---

## FASE 1 – Estructura del repositorio

### Paso 1.1 – Crear carpetas base

```bash
mkdir SA_PRACTICA_G8
cd SA_PRACTICA_G8
git init

# Crear todos los servicios
mkdir api-gateway
mkdir users-service
mkdir movies-service
mkdir reservations-service
mkdir payments-service
mkdir frontend
```

### Paso 1.2 – .gitignore en la raíz

```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
*.log
.DS_Store
EOF
```

### Paso 1.3 – Estructura interna de CADA servicio NestJS

Ejecuta esto para **cada servicio** (repite cambiando el nombre):

```bash
# Ejemplo para users-service
cd users-service
mkdir -p src/users/controllers
mkdir -p src/users/services
mkdir -p src/users/repositories
mkdir -p src/users/entities
mkdir -p src/users/dto
mkdir -p src/users/interfaces
mkdir -p src/auth/controllers
mkdir -p src/auth/services
mkdir -p src/auth/strategies
mkdir -p src/auth/guards
mkdir -p src/auth/dto
mkdir -p src/auth/interfaces
mkdir -p src/common/filters
mkdir -p src/common/interceptors
cd ..

# Skeleton para movies-service
cd movies-service
mkdir -p src/movies/controllers
mkdir -p src/movies/services
mkdir -p src/movies/repositories
mkdir -p src/movies/entities
mkdir -p src/movies/dto
mkdir -p src/movies/interfaces
mkdir -p src/cities/controllers
mkdir -p src/cities/services
mkdir -p src/cities/repositories
mkdir -p src/cities/entities
mkdir -p src/theaters/controllers
mkdir -p src/theaters/services
mkdir -p src/theaters/repositories
mkdir -p src/theaters/entities
mkdir -p src/functions/controllers
mkdir -p src/functions/services
mkdir -p src/functions/repositories
mkdir -p src/functions/entities
cd ..

# Skeleton para reservations-service
cd reservations-service
mkdir -p src/reservations/controllers
mkdir -p src/reservations/services
mkdir -p src/reservations/repositories
mkdir -p src/reservations/entities
mkdir -p src/reservations/dto
mkdir -p src/reservations/interfaces
mkdir -p src/seats/controllers
mkdir -p src/seats/services
mkdir -p src/seats/repositories
mkdir -p src/seats/entities
mkdir -p src/consumers
mkdir -p src/schedulers
cd ..

# Skeleton para payments-service
cd payments-service
mkdir -p src/payments/controllers
mkdir -p src/payments/services
mkdir -p src/payments/repositories
mkdir -p src/payments/entities
mkdir -p src/payments/dto
mkdir -p src/payments/interfaces
mkdir -p src/consumers
cd ..

# API Gateway
cd api-gateway
mkdir -p src/auth
mkdir -p src/middleware
mkdir -p src/config
cd ..
```

---

## FASE 2 – Docker Compose (infraestructura completa)

### Paso 2.1 – docker-compose.yml en la raíz

```bash
cat > docker-compose.yml << 'DOCKEREOF'
version: '3.8'

services:

  # ─── BASES DE DATOS ──────────────────────────────────────────────
  db-users:
    image: postgres:15-alpine
    container_name: db-users
    environment:
      POSTGRES_DB: filmstars_users
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5433:5432"
    volumes:
      - db_users_data:/var/lib/postgresql/data
    networks:
      - filmstars-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  db-movies:
    image: postgres:15-alpine
    container_name: db-movies
    environment:
      POSTGRES_DB: filmstars_movies
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5434:5432"
    volumes:
      - db_movies_data:/var/lib/postgresql/data
    networks:
      - filmstars-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  db-reservations:
    image: postgres:15-alpine
    container_name: db-reservations
    environment:
      POSTGRES_DB: filmstars_reservations
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5435:5432"
    volumes:
      - db_reservations_data:/var/lib/postgresql/data
    networks:
      - filmstars-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  db-payments:
    image: postgres:15-alpine
    container_name: db-payments
    environment:
      POSTGRES_DB: filmstars_payments
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5436:5432"
    volumes:
      - db_payments_data:/var/lib/postgresql/data
    networks:
      - filmstars-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ─── RABBITMQ ────────────────────────────────────────────────────
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - filmstars-network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── SERVICIOS ───────────────────────────────────────────────────
  users-service:
    build:
      context: ./users-service
      dockerfile: Dockerfile
    container_name: users-service
    environment:
      NODE_ENV: development
      PORT: 3001
      DB_HOST: db-users
      DB_PORT: 5432
      DB_NAME: filmstars_users
      DB_USER: postgres
      DB_PASS: postgres123
      JWT_SECRET: filmstars_jwt_secret_key_2026
      JWT_EXPIRES_IN: 24h
    ports:
      - "3001:3001"
    depends_on:
      db-users:
        condition: service_healthy
    networks:
      - filmstars-network
    restart: unless-stopped

  movies-service:
    build:
      context: ./movies-service
      dockerfile: Dockerfile
    container_name: movies-service
    environment:
      NODE_ENV: development
      PORT: 3002
      DB_HOST: db-movies
      DB_PORT: 5432
      DB_NAME: filmstars_movies
      DB_USER: postgres
      DB_PASS: postgres123
    ports:
      - "3002:3002"
    depends_on:
      db-movies:
        condition: service_healthy
    networks:
      - filmstars-network
    restart: unless-stopped

  reservations-service:
    build:
      context: ./reservations-service
      dockerfile: Dockerfile
    container_name: reservations-service
    environment:
      NODE_ENV: development
      PORT: 3003
      DB_HOST: db-reservations
      DB_PORT: 5432
      DB_NAME: filmstars_reservations
      DB_USER: postgres
      DB_PASS: postgres123
      RABBITMQ_URL: amqp://admin:admin123@rabbitmq:5672
    ports:
      - "3003:3003"
    depends_on:
      db-reservations:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - filmstars-network
    restart: unless-stopped

  payments-service:
    build:
      context: ./payments-service
      dockerfile: Dockerfile
    container_name: payments-service
    environment:
      NODE_ENV: development
      PORT: 3004
      DB_HOST: db-payments
      DB_PORT: 5432
      DB_NAME: filmstars_payments
      DB_USER: postgres
      DB_PASS: postgres123
      RABBITMQ_URL: amqp://admin:admin123@rabbitmq:5672
    ports:
      - "3004:3004"
    depends_on:
      db-payments:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - filmstars-network
    restart: unless-stopped

  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
    container_name: api-gateway
    environment:
      NODE_ENV: development
      PORT: 8080
      JWT_SECRET: filmstars_jwt_secret_key_2026
      USERS_SERVICE_URL: http://users-service:3001
      MOVIES_SERVICE_URL: http://movies-service:3002
      RESERVATIONS_SERVICE_URL: http://reservations-service:3003
      PAYMENTS_SERVICE_URL: http://payments-service:3004
    ports:
      - "8080:8080"
    depends_on:
      - users-service
      - movies-service
      - reservations-service
      - payments-service
    networks:
      - filmstars-network
    restart: unless-stopped

volumes:
  db_users_data:
  db_movies_data:
  db_reservations_data:
  db_payments_data:
  rabbitmq_data:

networks:
  filmstars-network:
    driver: bridge
DOCKEREOF
```

---

## FASE 3 – Users Service (completo con SOLID + JWT)

### Paso 3.1 – package.json

```bash
# Dentro de users-service/
cat > package.json << 'EOF'
{
  "name": "users-service",
  "version": "1.0.0",
  "description": "FilmStars - Servicio de Usuarios",
  "main": "dist/main.js",
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/typeorm": "^10.0.2",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/config": "^3.2.0",
    "typeorm": "^0.3.20",
    "pg": "^8.11.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.2.1",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.2",
    "@nestjs/schematics": "^10.1.0",
    "@types/bcrypt": "^5.0.2",
    "@types/passport-jwt": "^4.0.1",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.5",
    "typescript": "^5.3.3"
  }
}
EOF
```

### Paso 3.2 – tsconfig.json

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false
  }
}
EOF
```

### Paso 3.3 – nest-cli.json

```bash
cat > nest-cli.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
EOF
```

### Paso 3.4 – Entidad User

`src/users/entities/user.entity.ts`

```typescript
import {
  Entity, Column, PrimaryGeneratedColumn,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

/**
 * SOLID: SRP – Esta clase solo representa el modelo de datos del usuario.
 * No contiene lógica de negocio ni acceso a datos.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  rol: UserRole;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Paso 3.5 – DTOs de Usuario

`src/users/dto/create-user.dto.ts`

```typescript
import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  rol?: UserRole;
}
```

`src/users/dto/update-user.dto.ts`

```typescript
import { IsOptional, IsEmail, MinLength, IsEnum, IsBoolean } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  nombre?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  rol?: UserRole;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
```

### Paso 3.6 – Interfaces (SOLID: ISP + DIP)

`src/users/interfaces/user.repository.interface.ts`

```typescript
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

/**
 * SOLID: ISP – Separamos lecturas de escrituras en interfaces distintas.
 * Quien solo lee solo depende de IUserReader.
 * Quien solo escribe solo depende de IUserWriter.
 *
 * SOLID: DIP – Los servicios de alto nivel dependen de estas abstracciones,
 * no de la implementación concreta (UsersRepository).
 */
export interface IUserReader {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

export interface IUserWriter {
  create(dto: CreateUserDto): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  softDelete(id: string): Promise<void>;
}

/** Repositorio completo: lectura + escritura */
export interface IUserRepository extends IUserReader, IUserWriter {}
```

`src/users/interfaces/user.service.interface.ts`

```typescript
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

/**
 * SOLID: ISP – El controlador solo depende de los métodos que usa.
 * SOLID: DIP – El controlador depende de esta abstracción, no de UsersService.
 */
export interface IUserService {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  create(dto: CreateUserDto): Promise<User>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
  remove(id: string): Promise<void>;
}
```

### Paso 3.7 – Repositorio de Usuarios

`src/users/repositories/users.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../interfaces/user.repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';

/**
 * SOLID: SRP – Única responsabilidad: acceso a datos de usuarios.
 *              No sabe nada de lógica de negocio ni de HTTP.
 *
 * SOLID: LSP – Implementa IUserRepository; puede sustituirla sin romper nada.
 *              Si mañana cambias a MongoDB, creas MongoUserRepository y
 *              cambias el provider sin tocar UsersService.
 *
 * SOLID: DIP – Es la implementación concreta de la abstracción IUserRepository.
 */
@Injectable()
export class UsersRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly orm: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.orm.find({ where: { activo: true } });
  }

  async findById(id: string): Promise<User | null> {
    return this.orm.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.orm.findOne({ where: { email } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.orm.create(dto);
    return this.orm.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.orm.update(id, data);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.orm.update(id, { activo: false });
  }
}
```

### Paso 3.8 – Servicio de Usuarios

`src/users/services/users.service.ts`

```typescript
import {
  Injectable, NotFoundException, ConflictException, Inject
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { IUserService } from '../interfaces/user.service.interface';
import { IUserRepository } from '../interfaces/user.repository.interface';

/**
 * SOLID: SRP – Única responsabilidad: lógica de negocio de usuarios.
 *              No accede directamente a la BD, no sabe de HTTP.
 *
 * SOLID: OCP – Para añadir reglas (ej. validar username único) solo
 *              extiendes sin modificar este método.
 *
 * SOLID: DIP – Depende de IUserRepository (abstracción), inyectada por
 *              el contenedor de NestJS. Nunca hace `new UsersRepository()`.
 */
@Injectable()
export class UsersService implements IUserService {
  constructor(
    @Inject('IUserRepository')
    private readonly repo: IUserRepository,
  ) {}

  async findAll(): Promise<User[]> {
    return this.repo.findAll();
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findByEmail(email);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.repo.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    return this.repo.create({ ...dto, password: hashed });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findById(id); // lanza 404 si no existe
    const data: Partial<User> = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }
    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    return this.repo.softDelete(id);
  }
}
```

### Paso 3.9 – Controlador de Usuarios

`src/users/controllers/users.controller.ts`

```typescript
import {
  Controller, Get, Put, Delete,
  Param, Body, UseGuards, HttpCode, HttpStatus, Inject
} from '@nestjs/common';
import { IUserService } from '../interfaces/user.service.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * SOLID: SRP – Solo maneja solicitudes HTTP de usuarios.
 *              Valida input y delega al servicio. Cero lógica de negocio aquí.
 *
 * SOLID: DIP – Depende de IUserService (token string), no de UsersService.
 */
@Controller('users')
export class UsersController {
  constructor(
    @Inject('IUserService')
    private readonly usersService: IUserService,
  ) {}

  /** Rutas protegidas con JWT */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  /**
   * Ruta interna para comunicación entre servicios.
   * No lleva guard porque el API Gateway ya validó el JWT
   * y pasa el userId en el header X-User-Id.
   */
  @Get('internal/by-id/:id')
  findInternal(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
```

### Paso 3.10 – Módulo Users

`src/users/users.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';
import { User } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule, // necesario para JwtAuthGuard
  ],
  controllers: [UsersController],
  providers: [
    // DIP: registramos la implementación concreta bajo el token de la interfaz
    { provide: 'IUserRepository', useClass: UsersRepository },
    { provide: 'IUserService',    useClass: UsersService },
  ],
  exports: ['IUserService', 'IUserRepository'],
})
export class UsersModule {}
```

---

## FASE 4 – Auth Module (JWT completo)

### Paso 4.1 – Interfaces de Auth

`src/auth/interfaces/auth.service.interface.ts`

```typescript
import { User } from '../../users/entities/user.entity';

export interface RegisterPayload {
  nombre: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  };
}

/**
 * SOLID: ISP – Solo los métodos que el AuthController necesita.
 * SOLID: DIP – AuthController depende de esta abstracción.
 */
export interface IAuthService {
  register(payload: RegisterPayload): Promise<AuthResponse>;
  login(payload: LoginPayload): Promise<AuthResponse>;
  validateUser(email: string, password: string): Promise<User | null>;
}
```

### Paso 4.2 – DTOs de Auth

`src/auth/dto/register.dto.ts`

```typescript
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener mínimo 6 caracteres' })
  password: string;
}
```

`src/auth/dto/login.dto.ts`

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}
```

### Paso 4.3 – JWT Strategy

`src/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;   // userId
  email: string;
  nombre: string;
  rol: string;
}

/**
 * SOLID: SRP – Solo valida tokens JWT y extrae el payload.
 *              No hace login, no crea tokens, solo valida.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'filmstars_jwt_secret_key_2026',
    });
  }

  /**
   * Este método se llama automáticamente después de que Passport
   * verifica la firma del token. Lo que retornes aquí se inyecta
   * en req.user en los controladores protegidos.
   */
  async validate(payload: JwtPayload) {
    return {
      id:     payload.sub,
      email:  payload.email,
      nombre: payload.nombre,
      rol:    payload.rol,
    };
  }
}
```

### Paso 4.4 – JWT Guard

`src/auth/guards/jwt-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * SOLID: SRP – Solo protege rutas exigiendo un JWT válido.
 * Úsalo con @UseGuards(JwtAuthGuard) en cualquier controlador.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### Paso 4.5 – Auth Service (lógica de registro y login)

`src/auth/services/auth.service.ts`

```typescript
import {
  Injectable, UnauthorizedException, ConflictException, Inject
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  IAuthService, RegisterPayload, LoginPayload, AuthResponse
} from '../interfaces/auth.service.interface';
import { IUserRepository } from '../../users/interfaces/user.repository.interface';
import { User } from '../../users/entities/user.entity';

/**
 * SOLID: SRP – Solo responsable de la lógica de autenticación.
 *              Registro, login y generación de JWT.
 *              NO maneja HTTP ni accede directamente a la BD.
 *
 * SOLID: DIP – Depende de IUserRepository (abstracción), no de UsersRepository.
 *              Depende de JwtService (abstracción de NestJS), no de jsonwebtoken.
 */
@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const existing = await this.userRepo.findByEmail(payload.email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashed = await bcrypt.hash(payload.password, 10);
    const user = await this.userRepo.create({ ...payload, password: hashed });

    return this.buildAuthResponse(user);
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const user = await this.validateUser(payload.email, payload.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    return this.buildAuthResponse(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  /**
   * Genera el JWT con los claims definidos en el diseño:
   * sub (userId), email, nombre, rol.
   *
   * SOLID: SRP – Método privado con una sola responsabilidad: construir
   *              la respuesta de autenticación.
   */
  private buildAuthResponse(user: User): AuthResponse {
    const payload = {
      sub:    user.id,
      email:  user.email,
      nombre: user.nombre,
      rol:    user.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
      token_type:   'Bearer',
      expires_in:   process.env.JWT_EXPIRES_IN || '24h',
      user: {
        id:     user.id,
        nombre: user.nombre,
        email:  user.email,
        rol:    user.rol,
      },
    };
  }
}
```

### Paso 4.6 – Auth Controller

`src/auth/controllers/auth.controller.ts`

```typescript
import {
  Controller, Post, Body, HttpCode, HttpStatus, Inject
} from '@nestjs/common';
import { IAuthService } from '../interfaces/auth.service.interface';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

/**
 * SOLID: SRP – Solo maneja las rutas HTTP de autenticación.
 * SOLID: DIP – Depende de IAuthService (token string), no de AuthService directamente.
 *
 * Rutas PÚBLICAS (no requieren JWT):
 *   POST /api/auth/register
 *   POST /api/auth/login
 */
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('IAuthService')
    private readonly authService: IAuthService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

### Paso 4.7 – Auth Module

`src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './controllers/auth.controller';
import { AuthService }    from './services/auth.service';
import { JwtStrategy }   from './strategies/jwt.strategy';
import { JwtAuthGuard }  from './guards/jwt-auth.guard';

import { UsersRepository } from '../users/repositories/users.repository';
import { User }            from '../users/entities/user.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret:       process.env.JWT_SECRET    || 'filmstars_jwt_secret_key_2026',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    { provide: 'IAuthService',    useClass: AuthService },
    { provide: 'IUserRepository', useClass: UsersRepository },
  ],
  exports: [JwtModule, JwtAuthGuard, JwtStrategy],
})
export class AuthModule {}
```

### Paso 4.8 – App Module raíz

`src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule }  from './auth/auth.module';
import { User }        from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type:        'postgres',
      host:        process.env.DB_HOST     || 'localhost',
      port:        parseInt(process.env.DB_PORT) || 5432,
      username:    process.env.DB_USER     || 'postgres',
      password:    process.env.DB_PASS     || 'postgres123',
      database:    process.env.DB_NAME     || 'filmstars_users',
      entities:    [User],
      synchronize: true, // ⚠️ Solo desarrollo. En prod usar migraciones.
    }),

    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
```

### Paso 4.9 – main.ts del Users Service

`src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validación global: activa class-validator en todos los DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist:            true,  // elimina campos no definidos en el DTO
    forbidNonWhitelisted: true,  // error si llegan campos extra
    transform:            true,  // convierte strings a tipos correctos
  }));

  app.enableCors();
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Users Service corriendo en http://localhost:${port}`);
}
bootstrap();
```

### Paso 4.10 – Dockerfile del Users Service

`users-service/Dockerfile`

```dockerfile
# ── Stage 1: Build ──────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY nest-cli.json  ./
COPY src            ./src
RUN npm run build

# ── Stage 2: Production ─────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main.js"]
```

---

## FASE 5 – API Gateway

El Gateway es el único punto de entrada. Valida el JWT y reenvía las peticiones a los servicios internos. Las rutas `/api/auth/*` son públicas.

### Paso 5.1 – package.json del Gateway

`api-gateway/package.json`

```json
{
  "name": "api-gateway",
  "version": "1.0.0",
  "description": "FilmStars - API Gateway",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "start:dev": "ts-node src/main.ts"
  },
  "dependencies": {
    "express": "^4.18.3",
    "http-proxy-middleware": "^2.0.6",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.11.5",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2"
  }
}
```

> **Nota**: el Gateway usa Express directo (sin NestJS) para mantenerlo ligero y evitar overhead innecesario. Aquí el "Framework" de NestJS no aporta valor porque no hay lógica de negocio, solo routing y validación JWT.

### Paso 5.2 – tsconfig.json del Gateway

`api-gateway/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### Paso 5.3 – main.ts del Gateway

`api-gateway/src/main.ts`

```typescript
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import * as jwt from 'jsonwebtoken';

// ─── Configuración ────────────────────────────────────────────────────────────
const PORT             = parseInt(process.env.PORT || '8080');
const JWT_SECRET       = process.env.JWT_SECRET || 'filmstars_jwt_secret_key_2026';
const USERS_URL        = process.env.USERS_SERVICE_URL        || 'http://localhost:3001';
const MOVIES_URL       = process.env.MOVIES_SERVICE_URL       || 'http://localhost:3002';
const RESERVATIONS_URL = process.env.RESERVATIONS_SERVICE_URL || 'http://localhost:3003';
const PAYMENTS_URL     = process.env.PAYMENTS_SERVICE_URL     || 'http://localhost:3004';

const app = express();
app.use(cors());
app.use(express.json());

// ─── Middleware JWT ────────────────────────────────────────────────────────────
/**
 * Valida el JWT del header Authorization: Bearer <token>
 * Agrega req.user con los claims si el token es válido.
 * Devuelve 401 si falta o es inválido.
 */
interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
  };
}

function jwtMiddleware(req: RequestWithUser, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      statusCode: 401,
      message: 'Token no proporcionado. Incluye Authorization: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id:     payload.sub,
      email:  payload.email,
      nombre: payload.nombre,
      rol:    payload.rol,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      statusCode: 401,
      message: 'Token inválido o expirado',
    });
  }
}

// ─── Función helper: crea proxy con headers de usuario ───────────────────────
/**
 * Después de validar el JWT, inyecta los claims del usuario como
 * headers HTTP en la petición hacia el servicio destino.
 * Los servicios internos pueden leer X-User-Id, X-User-Email, etc.
 * sin volver a validar el JWT (el Gateway ya lo hizo).
 */
function createAuthProxy(target: string): ReturnType<typeof createProxyMiddleware> {
  const opts: Options = {
    target,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req: any) => {
        if (req.user) {
          proxyReq.setHeader('X-User-Id',     req.user.id);
          proxyReq.setHeader('X-User-Email',  req.user.email);
          proxyReq.setHeader('X-User-Nombre', req.user.nombre);
          proxyReq.setHeader('X-User-Rol',    req.user.rol);
        }
      },
    },
  };
  return createProxyMiddleware(opts);
}

// ─── Rutas PÚBLICAS (sin JWT) ─────────────────────────────────────────────────
// Login y registro no requieren token
app.use(
  '/api/auth',
  createProxyMiddleware({ target: USERS_URL, changeOrigin: true }),
);

// ─── Rutas PROTEGIDAS (requieren JWT válido) ──────────────────────────────────
app.use('/api/users',        jwtMiddleware, createAuthProxy(USERS_URL));
app.use('/api/movies',       jwtMiddleware, createAuthProxy(MOVIES_URL));
app.use('/api/reservations', jwtMiddleware, createAuthProxy(RESERVATIONS_URL));
app.use('/api/payments',     jwtMiddleware, createAuthProxy(PAYMENTS_URL));

// ─── Health check del Gateway ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    routes: {
      public:    ['/api/auth/login', '/api/auth/register'],
      protected: ['/api/users', '/api/movies', '/api/reservations', '/api/payments'],
    },
  });
});

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ statusCode: 404, message: 'Ruta no encontrada' });
});

// ─── Iniciar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 API Gateway corriendo en http://localhost:${PORT}`);
  console.log(`   → Usuarios:    ${USERS_URL}`);
  console.log(`   → Películas:   ${MOVIES_URL}`);
  console.log(`   → Reservas:    ${RESERVATIONS_URL}`);
  console.log(`   → Pagos:       ${PAYMENTS_URL}`);
});
```

### Paso 5.4 – Dockerfile del Gateway

`api-gateway/Dockerfile`

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/main.js"]
```

---

## FASE 6 – Skeletons de los otros 3 servicios

Los skeletons son servicios NestJS funcionales que arrancan, conectan a su BD y exponen un `/health`. Tus compañeros ya tienen la estructura lista para implementar su lógica.

### Movies Service skeleton

`movies-service/package.json` (igual al de users-service, cambia el nombre)

```json
{
  "name": "movies-service",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/typeorm": "^10.0.2",
    "@nestjs/config": "^3.2.0",
    "typeorm": "^0.3.20",
    "pg": "^8.11.3",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.2.1",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.2",
    "@nestjs/schematics": "^10.1.0",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.5",
    "typescript": "^5.3.3"
  }
}
```

`movies-service/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type:        'postgres',
      host:        process.env.DB_HOST  || 'localhost',
      port:        parseInt(process.env.DB_PORT) || 5432,
      username:    process.env.DB_USER  || 'postgres',
      password:    process.env.DB_PASS  || 'postgres123',
      database:    process.env.DB_NAME  || 'filmstars_movies',
      entities:    [],   // <-- tus compañeros agregan entidades aquí
      synchronize: true,
    }),
    // TODO: MoviesModule, CinemaModule, FunctionsModule, CitiesModule
  ],
})
export class AppModule {}
```

`movies-service/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  app.setGlobalPrefix('api');

  // Health check
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'movies-service' });
  });

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🎬 Movies Service corriendo en http://localhost:${port}`);
}
bootstrap();
```

> **Copia este mismo patrón** para `reservations-service` (puerto 3003) y `payments-service` (puerto 3004). Solo cambia el nombre, puerto y DB_NAME.

`reservations-service/src/main.ts` → puerto 3003, mensaje "🎟️ Reservations Service"
`payments-service/src/main.ts` → puerto 3004, mensaje "💳 Payments Service"

Para reservations y payments, el `app.module.ts` también necesita la conexión a RabbitMQ cuando sus compañeros la implementen. De momento déjala comentada:

```typescript
// En reservations-service/src/app.module.ts y payments-service/src/app.module.ts
// TODO: Cuando se implemente mensajería, agregar:
// ClientsModule.register([{
//   name: 'RABBITMQ_SERVICE',
//   transport: Transport.RMQ,
//   options: {
//     urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672'],
//     queue: 'reservas_queue',
//     queueOptions: { durable: true },
//   },
// }])
```

### tsconfig.json (igual para todos los servicios NestJS)

```bash
# Copia el mismo tsconfig.json de users-service a cada servicio:
cp users-service/tsconfig.json movies-service/tsconfig.json
cp users-service/tsconfig.json reservations-service/tsconfig.json
cp users-service/tsconfig.json payments-service/tsconfig.json

# Y el nest-cli.json:
cp users-service/nest-cli.json movies-service/nest-cli.json
cp users-service/nest-cli.json reservations-service/nest-cli.json
cp users-service/nest-cli.json payments-service/nest-cli.json
```

### Dockerfiles de los servicios skeleton

Son idénticos al de users-service, solo cambia el EXPOSE:

`movies-service/Dockerfile` (EXPOSE 3002)
`reservations-service/Dockerfile` (EXPOSE 3003)
`payments-service/Dockerfile` (EXPOSE 3004)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3002
# Cambia 3002 por el puerto correspondiente en cada servicio
CMD ["node", "dist/main.js"]
```

---

## FASE 7 – Levantar todo

### Paso 7.1 – Instalar dependencias localmente (opcional, solo para desarrollo)

```bash
# Si quieres correr algún servicio fuera de Docker durante desarrollo
cd users-service && npm install && cd ..
cd api-gateway   && npm install && cd ..
cd movies-service && npm install && cd ..
cd reservations-service && npm install && cd ..
cd payments-service && npm install && cd ..
```

### Paso 7.2 – Levantar con Docker Compose

```bash
# Desde la raíz del proyecto (donde está docker-compose.yml)
docker compose up --build

# Si quieres correr en background:
docker compose up --build -d

# Ver logs de un servicio específico:
docker compose logs -f users-service
docker compose logs -f api-gateway

# Parar todo:
docker compose down

# Parar y eliminar volúmenes (borra las BDs):
docker compose down -v
```

### Paso 7.3 – Verificar que todo está corriendo

```bash
# Health checks directos a cada servicio
curl http://localhost:3001/health  # users
curl http://localhost:3002/health  # movies
curl http://localhost:3003/health  # reservations
curl http://localhost:3004/health  # payments

# Health del gateway
curl http://localhost:8080/health
```

---

## FASE 8 – Pruebas del flujo completo

### Prueba 1: Registro de usuario

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Angel Dev",
    "email": "angel@filmstars.com",
    "password": "mi_password123"
  }'
```

Respuesta esperada:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": "24h",
  "user": {
    "id": "uuid-aqui",
    "nombre": "Angel Dev",
    "email": "angel@filmstars.com",
    "rol": "customer"
  }
}
```

### Prueba 2: Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "angel@filmstars.com",
    "password": "mi_password123"
  }'
```

### Prueba 3: Acceder a ruta protegida CON token

```bash
# Guarda el token de la respuesta anterior
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:8080/api/users \
  -H "Authorization: Bearer $TOKEN"
```

### Prueba 4: Acceder a ruta protegida SIN token (debe dar 401)

```bash
curl -X GET http://localhost:8080/api/users
# Respuesta: {"statusCode":401,"message":"Token no proporcionado..."}
```

### Prueba 5: Verificar RabbitMQ UI

Abre en el navegador: `http://localhost:15672`
- Usuario: `admin`
- Contraseña: `admin123`

---

## Estructura final del proyecto

```
SA_PRACTICA_G8/
├── docker-compose.yml          ← orquesta todo con un solo comando
├── .gitignore
├── README.md
│
├── api-gateway/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── main.ts             ← JWT middleware + proxy a servicios
│
├── users-service/              ← Tu implementación completa
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── users/
│       │   ├── entities/user.entity.ts
│       │   ├── dto/ (create, update)
│       │   ├── interfaces/ (IUserRepository, IUserService)
│       │   ├── repositories/users.repository.ts
│       │   ├── services/users.service.ts
│       │   ├── controllers/users.controller.ts
│       │   └── users.module.ts
│       └── auth/
│           ├── dto/ (register, login)
│           ├── interfaces/auth.service.interface.ts
│           ├── strategies/jwt.strategy.ts
│           ├── guards/jwt-auth.guard.ts
│           ├── services/auth.service.ts
│           ├── controllers/auth.controller.ts
│           └── auth.module.ts
│
├── movies-service/             ← Skeleton listo para tus compañeros
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── movies/            ← estructura vacía con carpetas
│       ├── cities/
│       ├── theaters/
│       └── functions/
│
├── reservations-service/       ← Skeleton listo
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── reservations/
│       ├── seats/
│       ├── consumers/         ← listo para RabbitMQ consumers
│       └── schedulers/        ← listo para el Expiry Scheduler
│
└── payments-service/           ← Skeleton listo
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── payments/
        └── consumers/         ← listo para RabbitMQ consumers
```

---

## Resumen de SOLID en tu código (para la documentación)

| Principio | Dónde | Cómo |
|---|---|---|
| **SRP** | `UsersController`, `UsersService`, `UsersRepository` | Cada clase tiene exactamente una razón para cambiar: HTTP / negocio / datos |
| **OCP** | `IUserRepository` + `UsersRepository` | Para soportar MongoDB: crea `MongoUserRepository implements IUserRepository`. No tocas UsersService |
| **LSP** | `UsersRepository implements IUserRepository` | Puedes sustituir `UsersRepository` por cualquier implementación que cumpla el contrato |
| **ISP** | `IUserReader`, `IUserWriter`, `IUserRepository` | Auth solo necesita `IUserReader`. No fuerza métodos de escritura a quien no los usa |
| **DIP** | Todos los constructores usan `@Inject('IUserRepository')` | Los módulos de alto nivel (Service, Controller) nunca hacen `new UsersRepository()` |

---

## Endpoints disponibles tras tu implementación

| Método | Ruta (via Gateway) | Protegido | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Registrar nuevo usuario |
| POST | `/api/auth/login` | ❌ | Login → devuelve JWT |
| GET | `/api/users` | ✅ JWT | Listar todos los usuarios |
| GET | `/api/users/:id` | ✅ JWT | Ver usuario por ID |
| PUT | `/api/users/:id` | ✅ JWT | Actualizar usuario |
| DELETE | `/api/users/:id` | ✅ JWT | Soft-delete usuario |

---

## Tip para tus compañeros al incorporar sus servicios

En cada nuevo controlador que creen, para leer quién hizo la petición (sin re-validar JWT), simplemente lean los headers que el Gateway inyectó:

```typescript
// En cualquier controlador de movies/reservations/payments:
import { Headers } from '@nestjs/common';

@Get('my-endpoint')
example(@Headers('x-user-id') userId: string,
        @Headers('x-user-rol') rol: string) {
  // userId y rol ya vienen validados por el Gateway
  console.log(`Petición de usuario ${userId} con rol ${rol}`);
}
```
