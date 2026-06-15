# Principios SOLID aplicados en FilmStars - Documento fusionado hasta Fase 4

# S — Single Responsibility Principle

## Principio

Cada clase, módulo o componente debe tener una sola responsabilidad y una única razón para cambiar.

En FilmStars se aplicó separando responsabilidades entre controladores, servicios, repositorios, guards, estrategias y módulos específicos. Los controladores reciben peticiones HTTP, los servicios contienen lógica de negocio y los repositorios gestionan el acceso a datos.

---

## Aplicación 
| Servicio | Dónde se aplicó | Cómo se aplicó | Por qué se aplicó |
|---|---|---|---|
| API Gateway | `api-gateway/src/main.ts` | El gateway recibe peticiones, valida JWT en rutas protegidas y redirige tráfico a servicios internos. | Permite centralizar entrada y seguridad sin mezclar reglas de negocio. |
| Users Service | `users-service/src/auth/auth.controller.ts` | El controlador recibe peticiones HTTP de registro/login y delega la lógica a `AuthService`. | Evita que el controlador tenga lógica de autenticación, cifrado o consulta a base de datos. |
| Users Service | `users-service/src/auth/auth.service.ts` | El servicio se enfoca en autenticación, validación de credenciales y emisión de JWT. | Mantiene separada la autenticación de la gestión general de usuarios. |
| Users Service | `users-service/src/users/user.service.ts` | Contiene reglas de negocio de usuarios: crear, listar, actualizar, cambiar contraseña y desactivar. | Centraliza la lógica de usuario sin mezclar SQL directo. |
| Users Service | `users-service/src/users/user.repository.ts` | Ejecuta consultas SQL contra PostgreSQL. | Separa persistencia de lógica de negocio. |
| Movies Service | `movies-service/src/cities/*` | Las clases de ciudades manejan únicamente ciudades. | Facilita mantenimiento de ciudades sin afectar películas, cines o funciones. |
| Movies Service | `movies-service/src/theaters/*` | Las clases de cines manejan únicamente cines. | Evita mezclar consulta de cines con películas o funciones. |
| Movies Service | `movies-service/src/movies/*` | Las clases de películas manejan películas y categorías. | Mantiene aislada la lógica de cartelera. |
| Movies Service | `movies-service/src/functions/*` | Las clases de funciones manejan horarios y funciones. | Permite modificar horarios sin afectar la consulta de películas. |

---

## Evidencia de código

```ts
// movies-service/src/cities/cities.controller.ts
@Controller('api/movies/cities')
export class CitiesController {
  constructor(@Inject(CITIES_SERVICE) private readonly cities: ICitiesService) {}
}
```

**Explicación:** el controlador se encarga únicamente de recibir solicitudes HTTP relacionadas con ciudades. No contiene lógica de negocio ni consultas SQL directas; esas responsabilidades se delegan al servicio y al repositorio correspondiente.

```ts
// movies-service/src/movies/movies.controller.ts
@Controller('api/movies')
export class MoviesController {
  constructor(@Inject(MOVIES_SERVICE) private readonly movies: IMoviesService) {}

  @Get()
  list(@Query('category') category?: string) {
    const validCategories: MovieCategory[] = ['ESTRENO', 'PRE_VENTA', 'RE_ESTRENO'];
    const cat = validCategories.includes(category as MovieCategory)
      ? (category as MovieCategory)
      : undefined;

    return this.movies.list({ category: cat });
  }
}
```

**Explicación:** el controlador de películas recibe los parámetros de consulta y delega la lógica al servicio. No valida reglas complejas de negocio ni construye consultas SQL.

---

## Ampliación en Fase 4

En Fase 4 se agregan dos responsabilidades nuevas dentro del dominio de cartelera: la carga masiva por CSV y la paginación del catálogo. Para mantener SRP, estas responsabilidades no deben mezclarse en una sola clase.

| Archivo / Clase | Responsabilidad |
|---|---|
| `movies-service/src/movies/bulk-import/csv-parser.service.ts` | Leer y transformar filas del archivo CSV. |
| `movies-service/src/movies/bulk-import/csv-movie-validator.service.ts` | Validar estructura, campos obligatorios y tipos de datos del CSV. |
| `movies-service/src/movies/bulk-import/movie-bulk-import.service.ts` | Orquestar el flujo de importación masiva. |
| `movies-service/src/movies/pagination/pagination.service.ts` | Normalizar `page`, `limit`, calcular `offset` y generar metadatos. |
| `movies-service/src/movies/movies.repository.ts` | Ejecutar consultas paginadas contra PostgreSQL. |

---

## CSV

```ts
// movies-service/src/movies/bulk-import/csv-parser.service.ts
@Injectable()
export class CsvParserService {
  parse(buffer: Buffer): CsvMovieRow[] {
    const content = buffer.toString('utf-8');
    return parseCsvContent(content);
  }
}
```

```ts
// movies-service/src/movies/bulk-import/movie-bulk-import.service.ts
@Injectable()
export class MovieBulkImportService {
  constructor(
    private readonly parser: CsvParserService,
    private readonly validator: CsvMovieValidatorService,
    private readonly repository: MoviesAdmRepository,
  ) {}

  async import(file: Express.Multer.File): Promise<BulkImportResult> {
    const rows = this.parser.parse(file.buffer);
    const validated = this.validator.validateRows(rows);

    return this.repository.bulkCreate(validated.validRows);
  }
}
```

## Paginación

```ts
// movies-service/src/movies/pagination/pagination.service.ts
@Injectable()
export class PaginationService {
  normalize(page?: number, limit?: number) {
    const safeLimit = Math.min(Number(limit) || 10, 10);
    const safePage = Math.max(Number(page) || 1, 1);

    return {
      page: safePage,
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit,
    };
  }
}
```

# O — Open/Closed Principle

## Principio

El software debe estar abierto para extensión, pero cerrado para modificación.

En FilmStars se aplicó principalmente con el patrón Strategy para el cálculo de precios según el tipo de función o película. Esto permite agregar nuevas reglas sin modificar la lógica principal.

---

## Aplicación 
| Servicio | Dónde se aplicó | Cómo se aplicó | Por qué se aplicó |
|---|---|---|---|
| Movies Service | `movies-service/src/movies/price-strategy/movie-price.strategy.ts` | Se creó la interfaz `IMoviePriceStrategy`. | Permite agregar nuevas reglas de precio sin modificar la lógica principal. |
| Movies Service | `movies-service/src/movies/price-strategy/estreno.strategy.ts` | Estrategia para películas de estreno. | Encapsula el cálculo específico de este tipo. |
| Movies Service | `movies-service/src/movies/price-strategy/preventa.strategy.ts` | Estrategia para películas en preventa. | Permite aplicar recargo sin modificar `MoviesService`. |
| Movies Service | `movies-service/src/movies/price-strategy/reestreno.strategy.ts` | Estrategia para películas de reestreno. | Permite aplicar descuento sin modificar `MoviesService`. |

---

## Evidencia de código

```ts
// movies-service/src/movies/price-strategy/movie-price.strategy.ts
export interface IMoviePriceStrategy {
  calculate(basePrice: number): number;
  readonly movieType: string;
}
```

```ts
// movies-service/src/movies/movies.service.ts
const PRICE_STRATEGIES = new Map<string, IMoviePriceStrategy>([
  ['ESTRENO', new EstrenoPriceStrategy()],
  ['PREVENTA', new PreventaPriceStrategy()],
  ['REESTRENO', new ReestrenoPriceStrategy()],
]);
```

**Explicación:** si en el futuro se agrega un tipo de función `VIP`, `IMAX` o `3D`, se puede crear una nueva estrategia sin modificar las clases existentes de estreno, preventa o reestreno.

---

## Ampliación en Fase 4

En la carga masiva, el principio Open/Closed se puede aplicar usando estrategias de formato. Actualmente se solicita CSV, pero si en una fase futura se acepta JSON o XLSX, se puede agregar una nueva estrategia sin modificar el servicio principal de importación.

---

```ts
// movies-service/src/movies/bulk-import/import-format.strategy.ts
export interface ImportFormatStrategy {
  supports(mimeType: string, filename: string): boolean;
  parse(buffer: Buffer): CsvMovieRow[];
}
```

```ts
// movies-service/src/movies/bulk-import/csv-import.strategy.ts
@Injectable()
export class CsvImportStrategy implements ImportFormatStrategy {
  supports(mimeType: string, filename: string): boolean {
    return filename.endsWith('.csv') || mimeType === 'text/csv';
  }

  parse(buffer: Buffer): CsvMovieRow[] {
    return parseCsvContent(buffer.toString('utf-8'));
  }
}
```

**Por qué aplica OCP:**  
El sistema queda abierto para agregar nuevos formatos de carga, pero cerrado para modificar el flujo principal. Si luego se acepta JSON, se crea `JsonImportStrategy` sin tocar `CsvImportStrategy`.

---

# L — Liskov Substitution Principle

## Principio

Una clase derivada o implementación debe poder reemplazar a su clase base o interfaz sin alterar el comportamiento esperado del sistema.

---

## Aplicación 

| Servicio | Dónde se aplicó | Cómo se aplicó | Por qué se aplicó |
|---|---|---|---|
| Movies Service | `EstrenoPriceStrategy`, `PreventaPriceStrategy`, `ReestrenoPriceStrategy` | Todas implementan `IMoviePriceStrategy` y exponen el método `calculate(basePrice)`. | `MoviesService` puede usar cualquier estrategia sin conocer su implementación concreta. |
| Users Service / API Gateway | `JwtAuthGuard` y `RolesGuard` | Implementan contratos de guardia de NestJS. | NestJS puede tratarlos como guards intercambiables en rutas protegidas. |

---

## Evidencia de código

```ts
// movies-service/src/movies/price-strategy/preventa.strategy.ts
export class PreventaPriceStrategy implements IMoviePriceStrategy {
  readonly movieType = 'PREVENTA';

  calculate(basePrice: number): number {
    return parseFloat((basePrice * 1.10).toFixed(2));
  }
}
```

```ts
// movies-service/src/movies/price-strategy/estreno.strategy.ts
export class EstrenoPriceStrategy implements IMoviePriceStrategy {
  readonly movieType = 'ESTRENO';

  calculate(basePrice: number): number {
    return basePrice;
  }
}
```

**Explicación:** ambas clases pueden sustituir a `IMoviePriceStrategy`, porque respetan el mismo contrato: reciben un `basePrice` y devuelven un número calculado.

---

## Ampliación en Fase 4

En Fase 4, una estrategia de importación debe poder sustituirse por otra sin romper el flujo de importación. El servicio principal no debe depender de que el formato sea exclusivamente CSV.

---


```ts
export class JsonImportStrategy implements ImportFormatStrategy {
  supports(mimeType: string, filename: string): boolean {
    return filename.endsWith('.json') || mimeType === 'application/json';
  }

  parse(buffer: Buffer): CsvMovieRow[] {
    return JSON.parse(buffer.toString('utf-8'));
  }
}
```

**Por qué aplica LSP:**  
`CsvImportStrategy` y `JsonImportStrategy` pueden sustituirse porque ambas respetan la interfaz `ImportFormatStrategy`. El flujo de importación solo necesita llamar `supports()` y `parse()`, sin conocer los detalles internos.

---

# I — Interface Segregation Principle

## Principio

Los clientes no deben depender de interfaces o métodos que no utilizan.

FilmStars evita interfaces demasiado grandes. Cada dominio tiene contratos específicos para su responsabilidad: usuarios, ciudades, cines, películas, funciones, importación y paginación.

---

## Aplicación 

| Servicio | Dónde se aplicó | Cómo se aplicó | Por qué se aplicó |
|---|---|---|---|
| Users Service | `IUserService` | Define operaciones propias de usuarios. | El controlador de usuarios depende solo de métodos relacionados con usuarios. |
| Users Service | `IUserRepository` | Define consultas específicas para usuarios. | El servicio no depende de una interfaz genérica de base de datos. |
| Movies Service | `ICitiesRepository` | Define `findAll()` y `findById()`. | Cities no necesita métodos de películas, cines o funciones. |
| Movies Service | `ITheatersRepository` | Define `findByCityId()` y `findById()`. | Theaters solo expone operaciones de cines. |
| Movies Service | `IMoviesRepository` | Define `findAll(filters)` y `findById()`. | Movies no depende de métodos de ciudades o funciones. |
| Movies Service | `IFunctionsRepository` | Define `findAll(filters)` y `findById()`. | Functions se mantiene especializado en horarios/funciones. |

---

## Evidencia de código

```ts
export interface ICitiesRepository {
  findAll(): Promise<CityRecord[]>;
  findById(id: string): Promise<CityRecord | null>;
}
```

```ts
// movies-service/src/movies/movies.repository.ts
export interface IMoviesRepository {
  findAll(filters: MovieFilters): Promise<MovieRecord[]>;
  findById(id: string): Promise<MovieRecord | null>;
}
```

**Explicación:** no se utiliza una interfaz gigante para todo el servicio de películas. Cada repositorio define únicamente los métodos que realmente necesita.

---

## Ampliación en Fase 4

La carga CSV y la paginación deben tener contratos separados. El módulo de carga masiva no necesita métodos de consulta paginada, y el módulo de paginación no necesita métodos de importación.

---

```ts
export interface IBulkMovieImportService {
  import(file: Express.Multer.File): Promise<BulkImportResult>;
}
```

```ts
export interface IPaginatedMoviesRepository {
  findPaginated(filters: MoviePaginationFilters): Promise<MovieRecord[]>;
  count(filters: MoviePaginationFilters): Promise<number>;
}
```

```ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
```

**Por qué aplica ISP:**  
Cada interfaz responde a una necesidad concreta. La carga CSV depende de `IBulkMovieImportService`, mientras que la paginación depende de `IPaginatedMoviesRepository`. Ninguna clase se ve obligada a implementar métodos que no utiliza.

---

# D — Dependency Inversion Principle

## Principio

Los módulos de alto nivel no deben depender de módulos de bajo nivel; ambos deben depender de abstracciones.

En FilmStars se aplicó mediante interfaces, tokens de inyección de dependencias y módulos de NestJS.

---

## Aplicación

| Servicio | Dónde se aplicó | Cómo se aplicó | Por qué se aplicó |
|---|---|---|---|
| Users Service | `users-service/src/common/tokens.ts` | Se definieron tokens `USER_SERVICE`, `USER_REPOSITORY`, `PG_POOL`. | Permite inyectar abstracciones y no clases concretas. |
| Users Service | `users-service/src/users/users.module.ts` | El módulo vincula token con implementación real mediante `useClass`. | La dependencia concreta se resuelve en el módulo, no en el controlador. |
| Movies Service | `movies-service/src/common/tokens.ts` | Se definieron tokens para services y repositories. | Desacopla controladores y servicios de implementaciones concretas. |
| Movies Service | `movies-service/src/*/*.module.ts` | Cada módulo registra providers con tokens. | Facilita reemplazar implementaciones en pruebas o futuras versiones. |
| Movies Service | `movies-service/src/database/database.module.ts` | `PG_POOL` se provee como abstracción global. | Los repositorios no crean conexiones manuales; reciben la conexión por inyección. |

---

## Evidencia de código

```ts
constructor(@Inject(MOVIES_SERVICE) private readonly movies: IMoviesService) {}
```

```ts
// movies-service/src/movies/movies.module.ts
@Module({
  controllers: [MoviesController],
  providers: [
    { provide: MOVIES_REPOSITORY, useClass: MoviesRepository },
    { provide: MOVIES_SERVICE, useClass: MoviesService },
  ],
  exports: [MOVIES_SERVICE],
})
export class MoviesModule {}
```

```ts
// users-service/src/users/users.controller.ts
@Controller('api/clientes')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(@Inject(USER_SERVICE) private readonly users: IUserService) {}
}
```

**Explicación:** los controladores no crean servicios ni repositorios directamente. Dependen de abstracciones, y NestJS resuelve la implementación concreta.

---

## Ampliación en Fase 4

En la carga CSV y la paginación se mantiene el mismo patrón. El controlador administrativo de carga masiva no debe crear manualmente el parser, el validador ni el repositorio.

---

```ts
@Module({
  controllers: [MovieBulkImportController],
  providers: [
    { provide: BULK_MOVIE_IMPORT_SERVICE, useClass: MovieBulkImportService },
    { provide: IMPORT_FORMAT_STRATEGY, useClass: CsvImportStrategy },
    CsvMovieValidatorService,
    PaginationService,
  ],
})
export class BulkImportModule {}
```

```ts
@Controller('api/admin/movies/import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MovieBulkImportController {
  constructor(
    @Inject(BULK_MOVIE_IMPORT_SERVICE)
    private readonly importService: IBulkMovieImportService,
  ) {}

  @Post('csv')
  @Roles('Admin')
  uploadCsv(@UploadedFile() file: Express.Multer.File) {
    return this.importService.import(file);
  }
}
```

**Por qué aplica DIP:**  
El controlador depende de `IBulkMovieImportService`, no de `MovieBulkImportService` directamente. La implementación concreta se define en el módulo, facilitando pruebas y cambios futuros.

---

# Aplicación específica de SOLID en paginación

La paginación del lado del servidor también respeta SOLID porque se separa del renderizado del frontend y de la consulta completa de películas.

```ts
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
```

```ts
@Injectable()
export class PaginationService {
  normalize(page?: number, limit?: number) {
    const safeLimit = Math.min(Number(limit) || 10, 10);
    const safePage = Math.max(Number(page) || 1, 1);

    return {
      page: safePage,
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit,
    };
  }
}
```

## Principios aplicados en paginación

| Principio | Aplicación |
|---|---|
| SRP | `PaginationService` solo normaliza parámetros y calcula offset. |
| ISP | `PaginatedResponse<T>` y `PaginationMeta` definen contratos específicos para respuestas paginadas. |
| DIP | `MoviesService` puede recibir `PaginationService` por inyección. |
| OCP | Se puede extender la estrategia de paginación sin cambiar el controlador. |
| LSP | Distintas implementaciones de repositorios paginados podrían sustituirse si respetan el contrato. |

---

# Conclusión

La aplicación de SOLID en FilmStars se evidencia desde las fases anteriores mediante la separación `controller-service-repository`, el uso de interfaces, tokens de inyección de dependencias y el patrón Strategy para el cálculo de precios.

En Fase 4, estos principios se fortalecen al incorporar nuevas funcionalidades sin convertir el `Movies Service` en una clase monolítica. La carga CSV se divide en parser, validador, servicio de importación y repositorio; mientras que la paginación se separa en parámetros, metadatos, contratos y consulta optimizada. Esto mejora la mantenibilidad, reduce acoplamiento, facilita pruebas unitarias y permite extender el sistema en futuras fases.
