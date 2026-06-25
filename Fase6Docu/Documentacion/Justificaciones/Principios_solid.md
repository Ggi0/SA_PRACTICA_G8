# Principios SOLID aplicados en FilmStars - Documento actualizado hasta Práctica 6

Este documento consolida la aplicación de los principios SOLID en FilmStars desde las fases anteriores hasta la Práctica 5.  
No se separa por fase como anexos independientes; en su lugar, las funcionalidades agregadas en Fase 4 y Práctica 5 se integran dentro de cada principio.

Las funcionalidades consideradas son:

- Arquitectura base con separación `controller-service-repository`.
- Gestión de usuarios, cartelera, reservas y pagos.
- Módulo administrativo.
- Carga masiva de películas mediante CSV.
- Paginación del lado del servidor.
- Descarga e historial de boletos.
- Escaneo y control de accesos.
- Infraestructura y Monitoreo.
- Métricas.
- Búsqueda manual de contingencia.
- Despliegue con Docker Compose, CI/CD y K3s.

---

# S — Single Responsibility Principle

## Principio

Cada clase, módulo o componente debe tener una sola responsabilidad y una única razón para cambiar.

En FilmStars se aplicó separando responsabilidades entre controladores, servicios, repositorios, entidades, guards, estrategias y manifiestos de despliegue.  
Los controladores reciben peticiones HTTP, los servicios contienen lógica de negocio, los repositorios gestionan persistencia y las entidades representan estructuras de base de datos.

---

## Aplicación integrada en FilmStars

| Componente | Dónde se aplicó | Cómo se aplicó | Por qué se aplicó |
|---|---|---|---|
| API Gateway | `api-gateway/src/main.ts` | Recibe peticiones, valida JWT en rutas protegidas y redirige tráfico a servicios internos. | Centraliza la entrada al sistema sin mezclar reglas de negocio. |
| Users Service | `users-service/src/auth/auth.controller.ts` y `auth.service.ts` | El controlador recibe login/registro y el servicio valida credenciales y emite JWT. | Separa transporte HTTP de autenticación. |
| Movies Service | `movies-service/src/movies/*`, `cities/*`, `theaters/*`, `functions/*` | Cada módulo maneja un subdominio de cartelera. | Permite modificar ciudades, cines, películas o funciones sin afectar los demás. |
| Carga CSV | `movies-service/src/movies/admin/bulk-ingest/*` | Se separa controlador de carga, servicio de orquestación, parser CSV y repositorio. | Evita que una sola clase lea archivo, valide datos e inserte en base de datos. |
| Paginación | `movies.controller.ts`, `movies.service.ts`, `movies.repository.ts` | El controlador recibe parámetros, el servicio arma la respuesta y el repositorio ejecuta consulta paginada. | Mantiene la consulta paginada separada del renderizado del frontend. |
| Reservations Service | `reservas-service/src/reservas/services/reservas.service.ts` | Maneja creación, cancelación y confirmación de reservas. | La lógica de asientos y reservas no se mezcla con pagos o películas. |
| Payments Service | `payments-service/src/payments/services/payments.service.ts` | Procesa pagos, actualiza estado y publica eventos. | La lógica de pago queda aislada del dominio de reservas. |
| Boleto digital | `payments-service/src/database/entities/boleto.entity.ts` | La entidad representa datos de boleto: código, QR y estado. | Permite que boleto tenga su propio modelo sin mezclarlo con pago o reserva. |
| K3s | `k3s/apps.yaml`, `configmaps.yaml`, `ingress.yaml`, `databases.yaml`, `rabbitmq.yaml` | Cada manifiesto tiene una responsabilidad específica. | Evita manifiestos monolíticos y facilita mantenimiento de infraestructura. |

---

## Evidencia de código: separación de controlador y servicio

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

**Explicación:** el controlador de películas recibe la petición HTTP y delega la lógica al servicio. No construye consultas SQL ni aplica reglas complejas de negocio.

---

## Evidencia de código: carga CSV separada por responsabilidades

```ts
// movies-service/src/movies/admin/bulk-ingest/bulk.controller.ts
@Controller('api/admin/movies/bulk')
export class BulkController {
  constructor(
    private readonly bulkService: BulkService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  uploadCsv(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bulkService.uploadCsv(file);
  }
}
```

```ts
// movies-service/src/movies/admin/bulk-ingest/bulk.service.ts
@Injectable()
export class BulkService {
  constructor(
    private readonly bulkRepository: BulkRepository,
    private readonly csvParser: CsvParser,
  ) {}

  async uploadCsv(file: Express.Multer.File): Promise<BulkUploadResponse> {
    this.validateUploadedFile(file);

    const genresCatalog = await this.bulkRepository.getGenresCatalog();
    const parseResult = this.csvParser.parse(file.buffer, genresCatalog);

    this.validateStructuralCsvErrors(parseResult);

    const insertResult = await this.bulkRepository.bulkInsertMovies(
      parseResult.validRows,
    );

    return {
      summary: {
        totalFilas: parseResult.totalRows,
        procesadasCorrectamente: insertResult.insertedCount,
        rechazadas: parseResult.invalidRows.length + insertResult.failedRows.length,
      },
      message: `Se cargaron ${insertResult.insertedCount} películas correctamente.`,
      errors: [...parseResult.invalidRows, ...insertResult.failedRows],
    };
  }
}
```

**Explicación:** el controlador solo recibe el archivo; el servicio coordina el flujo; el parser valida y transforma; el repositorio inserta en base de datos. Esto evidencia SRP en la carga masiva de Fase 4.

---

## Evidencia de código: boleto digital como responsabilidad separada

```ts
// payments-service/src/database/entities/boleto.entity.ts
@Entity('boleto')
export class BoletoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reserva_id_ref', type: 'uuid' })
  reservaIdRef: string;

  @Column({ name: 'reserva_asiento_id_ref', type: 'uuid' })
  reservaAsientoIdRef: string;

  @Column({ name: 'codigo_boleto' })
  codigoBoleto: string;

  @Column({ name: 'codigo_qr', nullable: true })
  codigoQr?: string;

  @Column({ type: 'varchar', length: 50, default: 'EMITIDO' })
  estado: string;
}
```

**Explicación:** el boleto digital tiene su propia entidad. Esta clase no procesa pagos, no valida escaneo ni genera archivos descargables; solo modela la información persistente del boleto.


## Infraestructura y Monitoreo

Cada componente debe tener una responsabilidad clara.

| Componente | Responsabilidad |
|---|---|
| Terraform | Aprovisionar recursos de AWS. |
| Ansible | Configurar servidores y preparar K3s. |
| Prometheus | Recolectar métricas. |
| Grafana | Visualizar métricas mediante dashboards. |
| Metrics Middleware | Exponer métricas HTTP de los servicios. |
| Exporters | Exponer métricas de componentes como RabbitMQ. |

```ts
// api-gateway/src/metrics/metrics.controller.ts
@Controller('metrics')
export class MetricsController {
  @Get()
  getMetrics() {
    return register.metrics();
  }
}
```

**Explicación:** el controlador de métricas solo expone métricas. No maneja autenticación, pagos, cartelera ni reservas. Esto respeta SRP.

---

# O — Open/Closed Principle

## Principio

El software debe estar abierto para extensión, pero cerrado para modificación.

En FilmStars se aplicó principalmente mediante estrategias, interfaces y contratos. Esto permite agregar nuevas reglas de negocio sin modificar la lógica principal ya existente.

---

## Aplicación integrada en FilmStars

| Funcionalidad | Cómo se aplica OCP |
|---|---|
| Cálculo de precios | Se utiliza Strategy para películas de estreno, preventa y reestreno. |
| Carga masiva | El flujo puede extenderse para aceptar otros formatos además de CSV, como JSON o XLSX. |
| Paginación | La estrategia de paginación puede cambiar sin modificar el controlador. |
| Boletos | Se puede agregar PDF, QR, código de barras o firma digital sin modificar el flujo principal de pago. |
| Control de accesos | Se puede agregar validación por QR, código manual o búsqueda de contingencia mediante nuevas estrategias. |

---

## Evidencia de código: Strategy para precios

```ts
// movies-service/src/movies/price-strategy/movie-price.strategy.ts
export interface IMoviePriceStrategy {
  calculate(basePrice: number): number;
  readonly movieType: string;
}
```

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
// movies-service/src/movies/movies.service.ts
const PRICE_STRATEGIES = new Map<string, IMoviePriceStrategy>([
  ['ESTRENO', new EstrenoPriceStrategy()],
  ['PREVENTA', new PreventaPriceStrategy()],
  ['REESTRENO', new ReestrenoPriceStrategy()],
]);
```

**Explicación:** si se agregara una función `VIP`, `3D` o `IMAX`, se podría crear una nueva estrategia sin modificar las estrategias existentes.

---

## Aplicación a CSV y boletos

Para la carga masiva, actualmente se trabaja CSV, pero el diseño puede extenderse con nuevas estrategias de importación:

```ts
export interface ImportFormatStrategy {
  supports(mimeType: string, filename: string): boolean;
  parse(buffer: Buffer): CsvMovieRow[];
}
```

```ts
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

Para Práctica 5, el mismo enfoque puede extender el boleto digital:

```ts
export interface TicketRenderStrategy {
  supports(format: string): boolean;
  render(ticketId: string): Promise<Buffer>;
}
```

```ts
export class QrTicketRenderStrategy implements TicketRenderStrategy {
  supports(format: string): boolean {
    return format === 'QR';
  }

  async render(ticketId: string): Promise<Buffer> {
    // Genera representación visual del boleto con QR
    return Buffer.from(ticketId);
  }
}
```

**Explicación:** el sistema queda abierto para nuevos formatos de boleto o validación de acceso, pero cerrado para modificar el flujo principal de pago o reserva.

## Métricas

El sistema debe permitir agregar nuevas métricas sin modificar toda la lógica existente. Por ejemplo, se pueden agregar métricas para boletos validados, errores de API o colas de RabbitMQ sin modificar los servicios principales.

```ts
// metrics/ticket.metrics.ts
export const ticketValidationsTotal = new Counter({
  name: 'filmstars_ticket_validations_total',
  help: 'Total de boletos validados',
  labelNames: ['result'],
});
```

**Explicación:** si mañana se agrega una métrica de pagos rechazados o latencia de reservas, se crea una nueva métrica sin modificar los contadores existentes.

---


# L — Liskov Substitution Principle

## Principio

Una clase derivada o implementación debe poder reemplazar a su clase base o interfaz sin alterar el comportamiento esperado del sistema.

En FilmStars se evidencia cuando distintas implementaciones respetan un mismo contrato.

---

## Aplicación integrada en FilmStars

| Contrato | Implementaciones | Por qué cumple LSP |
|---|---|---|
| `IMoviePriceStrategy` | `EstrenoPriceStrategy`, `PreventaPriceStrategy`, `ReestrenoPriceStrategy` | Todas reciben precio base y devuelven un precio calculado. |
| `MessagePublisher` | `RabbitMqPublisher` | Cualquier publicador que implemente `publish()` puede reemplazarlo. |
| `ImportFormatStrategy` | `CsvImportStrategy`, futura `JsonImportStrategy` | Todas deben exponer `supports()` y `parse()`. |
| `TicketRenderStrategy` | futura estrategia QR, PDF o imagen | Todas deben devolver una representación descargable del boleto. |

---

## Evidencia de código: estrategias de precio sustituibles

```ts
// movies-service/src/movies/price-strategy/estreno.strategy.ts
export class EstrenoPriceStrategy implements IMoviePriceStrategy {
  readonly movieType = 'ESTRENO';

  calculate(basePrice: number): number {
    return basePrice;
  }
}
```

```ts
// movies-service/src/movies/price-strategy/preventa.strategy.ts
export class PreventaPriceStrategy implements IMoviePriceStrategy {
  readonly movieType = 'PREVENTA';

  calculate(basePrice: number): number {
    return parseFloat((basePrice * 1.10).toFixed(2));
  }
}
```

**Explicación:** ambas estrategias pueden sustituirse porque respetan la misma interfaz. El servicio principal solo necesita invocar `calculate()`.

---

## Evidencia de código: publicador sustituible

```ts
// payments-service/src/messaging/publisher.interface.ts
export const MESSAGE_PUBLISHER = Symbol('MESSAGE_PUBLISHER');

export interface MessagePublisher {
  publish(queue: string, payload: Record<string, unknown>): Promise<void>;
}
```

```ts
// payments-service/src/messaging/rabbitmq.publisher.ts
@Injectable()
export class RabbitMqPublisher
  implements MessagePublisher, OnModuleInit, OnModuleDestroy
{
  async publish(
    queue: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const buffer = Buffer.from(JSON.stringify(payload));

    this.channel.sendToQueue(queue, buffer, {
      persistent: true,
      contentType: 'application/json',
    });
  }
}
```

**Explicación:** `PaymentsService` puede trabajar con cualquier publicador que respete `MessagePublisher`. Si el broker cambia, no se rompe el servicio de pagos.


## Exporters y fuentes de métricas

Todas las fuentes de métricas deben cumplir un contrato común: exponer datos en un formato que Prometheus pueda recolectar.

```ts
export interface MetricsExporter {
  expose(): Promise<string>;
}
```

```ts
export class PrometheusMetricsExporter implements MetricsExporter {
  async expose(): Promise<string> {
    return register.metrics();
  }
}
```

**Explicación:** cualquier exporter que respete el contrato puede sustituirse sin romper el flujo de observabilidad.

---

# I — Interface Segregation Principle

## Principio

Los clientes no deben depender de interfaces o métodos que no utilizan.

FilmStars evita interfaces demasiado grandes. Cada dominio tiene contratos específicos para usuarios, películas, ciudades, funciones, pagos, mensajería, carga masiva, paginación y boletos.

---

## Aplicación integrada en FilmStars

| Área | Contrato específico | Justificación |
|---|---|---|
| Películas | `IMoviesRepository` | Solo contiene métodos de películas. |
| Paginación | `MoviePageFilters`, `PaginatedMoviesResult` | Define únicamente lo necesario para consultar páginas. |
| Carga CSV | `BulkUploadResponse`, `ParseCsvResult` | Separa carga masiva de consulta normal de cartelera. |
| Mensajería | `MessagePublisher` | Solo exige publicar mensajes. |
| Historial de boletos | `ITicketHistoryService` | Debe consultar boletos del usuario sin depender de métodos de escaneo. |
| Control de accesos | `ITicketAccessValidationService` | Debe validar boletos sin depender de métodos de pago. |

---

## Evidencia de código: repositorio específico de películas

```ts
// movies-service/src/movies/movies.repository.ts
export interface IMoviesRepository {
  findAll(filters: MovieFilters): Promise<MovieRecord[]>;
  findPage(filters: MoviePageFilters): Promise<MoviePageQueryResult>;
  findById(id: string): Promise<MovieRecord | null>;
}
```

**Explicación:** la interfaz del repositorio de películas contiene únicamente métodos relacionados con películas. No contiene métodos de usuarios, pagos o reservas.

---

## Evidencia de código: contratos específicos para paginación

```ts
// movies-service/src/movies/movie.types.ts
export interface MoviePageFilters {
  category?: MovieCategory;
  cityId?: string;
  page: number;
  limit: number;
}

export interface PaginatedMoviesResult {
  data: PublicMovie[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

**Explicación:** la respuesta paginada tiene su propio contrato. Esto evita mezclar la consulta completa de cartelera con la consulta por páginas.

---

Para historial y control de accesos se recomienda mantener contratos separados:

```ts
export interface ITicketHistoryService {
  getUserTickets(userId: string): Promise<TicketSummary[]>;
  downloadTicket(ticketId: string, userId: string): Promise<TicketFile>;
}
```

```ts
export interface ITicketAccessValidationService {
  scanTicket(code: string, adminId: string): Promise<AccessValidationResult>;
  forceManualValidation(ticketId: string, adminId: string): Promise<AccessValidationResult>;
}
```

**Explicación:** el módulo de historial no debe depender de métodos de escaneo, y el módulo de escaneo no debe depender de métodos de descarga.


## Segregación aplicado a monitoreo

No todos los servicios necesitan exponer las mismas métricas. Por eso conviene separar interfaces.

```ts
export interface HttpMetricsService {
  recordHttpRequest(method: string, route: string, status: number, duration: number): void;
}

export interface TicketMetricsService {
  recordTicketValidation(result: 'approved' | 'rejected' | 'manual'): void;
}

export interface QueueMetricsService {
  recordQueueStatus(queue: string, pendingMessages: number): void;
}
```

**Explicación:** el módulo de boletos no depende de métricas de colas si no las usa, y el API Gateway no depende de métricas específicas de boletos.

---

# D — Dependency Inversion Principle

## Principio

Los módulos de alto nivel no deben depender de módulos de bajo nivel; ambos deben depender de abstracciones.

En FilmStars se aplica mediante interfaces, tokens de inyección de dependencias y providers de NestJS.

---

## Aplicación integrada en FilmStars

| Servicio | Dónde se aplicó | Cómo se aplicó |
|---|---|---|
| Users Service | `common/tokens.ts`, `users.module.ts` | Se inyectan servicios y repositorios mediante tokens. |
| Movies Service | `movies.module.ts`, `movies.controller.ts` | El controlador depende de `IMoviesService`, no de la clase concreta. |
| Payments Service | `payments.service.ts` | Depende de `PaymentGatewayInterface` y `MessagePublisher`. |
| Carga CSV | `BulkController` depende de `BulkService`, y este recibe parser y repository por inyección. |
| Boletos / Accesos | Deben depender de interfaces como `ITicketHistoryService` e `ITicketAccessValidationService`. |

---

## Evidencia de código: inyección por tokens

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
// movies-service/src/movies/movies.controller.ts
@Controller('api/movies')
export class MoviesController {
  constructor(@Inject(MOVIES_SERVICE) private readonly movies: IMoviesService) {}
}
```

**Explicación:** el controlador no instancia el servicio concreto. Depende de la abstracción `IMoviesService`, y NestJS resuelve la implementación.

---

## Evidencia de código: Payments Service depende de abstracciones

```ts
// payments-service/src/payments/services/payments.service.ts
@Injectable()
export class PaymentsService {
  constructor(
    private readonly pagoRepository: PagoRepository,

    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGatewayInterface,

    @Inject(MESSAGE_PUBLISHER)
    private readonly publisher: MessagePublisher,
  ) {}
}
```

**Explicación:** el servicio de pagos no crea directamente el gateway de pago ni el publicador de mensajes. Depende de contratos inyectados.

---

Para boletos y control de acceso:

```ts
@Controller('api/tickets')
export class TicketHistoryController {
  constructor(
    @Inject(TICKET_HISTORY_SERVICE)
    private readonly ticketHistory: ITicketHistoryService,
  ) {}

  @Get('history')
  getHistory(@UserId() userId: string) {
    return this.ticketHistory.getUserTickets(userId);
  }
}
```

```ts
@Controller('api/admin/tickets')
export class TicketAccessController {
  constructor(
    @Inject(TICKET_ACCESS_VALIDATION_SERVICE)
    private readonly accessValidation: ITicketAccessValidationService,
  ) {}

  @Post('scan')
  scan(@Body('code') code: string, @UserId() adminId: string) {
    return this.accessValidation.scanTicket(code, adminId);
  }
}
```

**Explicación:** los controladores dependen de interfaces, no de implementaciones concretas. Esto facilita pruebas unitarias, cambios futuros y separación de responsabilidades.


## Inversion aplicado a métricas

Los servicios de negocio deben depender de abstracciones de métricas, no de una librería concreta. Esto permite cambiar la implementación sin afectar el dominio.

```ts
@Injectable()
export class TicketAccessService {
  constructor(
    @Inject(TICKET_METRICS_SERVICE)
    private readonly ticketMetrics: TicketMetricsService,
  ) {}

  validateTicket(code: string) {
    // lógica de validación
    this.ticketMetrics.recordTicketValidation('approved');
  }
}
```

**Explicación:** el servicio de acceso no depende directamente de Prometheus. Depende de una abstracción que puede implementarse con Prometheus u otra herramienta.

---


# Aplicación específica de SOLID por funcionalidad

| Funcionalidad              | S                                                                        | O                                                                                 | L                                                                                             | I                                                                        | D                                                                               |
| -------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Gestión de usuarios        | Controlador, servicio y repositorio separados.                           | Nuevas reglas de usuario pueden agregarse sin romper el login.                    | Guards y servicios respetan contratos de NestJS.                                              | Interfaces específicas de usuario.                                       | Inyección mediante tokens y providers.                                          |
| Cartelera                  | Movies, Cities, Theaters y Functions separados.                          | Strategy de precios para diferentes tipos de película.                            | Estrategias de precio sustituibles.                                                           | Interfaces por subdominio.                                               | `MOVIES_SERVICE` y `MOVIES_REPOSITORY` inyectados.                              |
| CSV                        | Controller, Service, Parser y Repository separados.                      | Nuevos formatos pueden agregarse como estrategias.                                | Estrategias de importación sustituibles.                                                      | Contratos específicos de importación.                                    | Parser y repository inyectados.                                                 |
| Paginación                 | Consulta paginada separada del renderizado del frontend.                 | Puede cambiar la estrategia de paginación sin modificar el controlador.           | Repositorios paginados sustituibles.                                                          | Contratos `MoviePageFilters` y `PaginatedMoviesResult`.                  | Service depende de repository abstracto.                                        |
| Reservas                   | Reserva y estado de asiento separados.                                   | Se pueden agregar nuevas reglas de estado.                                        | Repositorios sustituibles.                                                                    | Repositorios específicos para reserva y asiento.                         | Repositorios inyectados.                                                        |
| Pagos                      | Pago, gateway y mensajería separados.                                    | Gateway de pago puede cambiar sin afectar el flujo principal.                     | Implementaciones de gateway y publisher sustituibles.                                         | Interfaces pequeñas.                                                     | Depende de `PaymentGatewayInterface` y `MessagePublisher`.                      |
| Boletos                    | Entidad y servicios de historial/descarga separados.                     | Nuevos formatos de boleto pueden agregarse.                                       | Renderizadores de boleto sustituibles.                                                        | `ITicketHistoryService` separado de escaneo.                             | Controladores dependen de servicios abstractos.                                 |
| Control de accesos         | Validación, auditoría y búsqueda manual separados.                       | Nuevas estrategias de validación pueden agregarse.                                | Validadores sustituibles.                                                                     | `ITicketAccessValidationService` específico.                             | Inyección de servicios.                                                         |
| K3s                        | Manifiestos separados por propósito.                                     | Se pueden agregar más Deployments y Services.                                     | Deployments siguen contrato Kubernetes.                                                       | ConfigMaps, Secrets e Ingress separados.                                 | Configuración externa al código.                                                |
| Terraform                  | Módulos separados para red, seguridad, cómputo, variables y outputs.     | Se pueden agregar nuevos recursos AWS sin modificar todos los módulos existentes. | Módulos reutilizables con variables y outputs compatibles.                                    | Variables específicas por módulo y entorno.                              | La infraestructura depende de variables, no de valores quemados.                |
| Ansible                    | Playbooks separados para configuración base, Docker, K3s y dependencias. | Se pueden agregar nuevas tareas o roles sin rehacer todo el playbook.             | Roles reutilizables en distintos servidores o entornos.                                       | Inventarios y variables separados por ambiente.                          | Los playbooks dependen de variables e inventario generado, no de IPs fijas.     |
| Prometheus                 | Recolección de métricas separada de la lógica de negocio.                | Se pueden agregar nuevos targets o métricas sin modificar servicios existentes.   | Exporters compatibles pueden sustituirse si exponen formato Prometheus.                       | Métricas HTTP, RabbitMQ, pods e Ingress separadas.                       | Servicios dependen de abstracciones de métricas, no directamente de Prometheus. |
| Grafana                    | Visualización separada de la recolección de métricas.                    | Se pueden agregar nuevos dashboards o paneles sin cambiar Prometheus.             | Dashboards pueden reutilizar el mismo datasource.                                             | Paneles separados por salud del sistema, pods, colas, Ingress y boletos. | Grafana depende de Prometheus como datasource configurable.                     |
| Métricas de aplicación     | Middleware/controladores de métricas separados de endpoints de negocio.  | Nuevas métricas pueden agregarse sin modificar todo el backend.                   | Exportadores de métricas sustituibles.                                                        | Interfaces separadas para métricas HTTP, boletos y colas.                | Servicios de negocio registran métricas mediante abstracciones inyectadas.      |
| Seguridad de configuración | Secrets, `.env` y variables separadas del código fuente.                 | Nuevos secretos pueden agregarse sin modificar la lógica del sistema.             | Kubernetes Secrets y GitHub Secrets cumplen el mismo propósito de inyectar valores sensibles. | Variables separadas por entorno y tipo de credencial.                    | El sistema depende de configuración externa, no de credenciales quemadas.       |


---

## SOLID aplicado a Terraform y Ansible

Aunque Terraform y Ansible no son código orientado a objetos, sí se organizan con principios equivalentes:

| Principio | Aplicación en Terraform / Ansible |
|---|---|
| SRP | Separar módulos de red, seguridad, cómputo, outputs y variables. |
| OCP | Agregar nuevos módulos sin modificar todos los existentes. |
| LSP | Mantener módulos con variables/outputs compatibles. |
| ISP | Separar variables por entorno y no crear archivos gigantes. |
| DIP | Usar variables, outputs y secrets en lugar de valores quemados. |

```hcl
# terraform/modules/network/variables.tf
variable "vpc_cidr" {
  type = string
}
```

```hcl
# terraform/modules/network/outputs.tf
output "vpc_id" {
  value = aws_vpc.main.id
}
```

**Explicación:** el módulo de red expone únicamente lo necesario. Otros módulos dependen del output `vpc_id`, no de detalles internos.

---

# Conclusión

La aplicación de SOLID en FilmStars se evidencia mediante la separación `controller-service-repository`, el uso de interfaces, tokens de inyección de dependencias, estrategias de precio, contratos específicos y componentes de infraestructura separados.

Las funcionalidades de Fase 4, como carga CSV y paginación server-side, se integran al `Movies Service` sin convertirlo en una clase monolítica. Las funcionalidades de Práctica 5, como descarga de boletos, historial, escaneo, validación manual y control de accesos, se integran respetando la misma lógica: cada responsabilidad debe mantenerse en un componente especializado.

De esta manera, FilmStars puede crecer hacia una plataforma más completa sin perder mantenibilidad, bajo acoplamiento, facilidad de pruebas y claridad arquitectónica.

La Práctica 6 mantiene SOLID al separar infraestructura, configuración y observabilidad en componentes especializados. Terraform aprovisiona, Ansible configura, Prometheus recolecta y Grafana visualiza. En el código, las métricas deben exponerse mediante controladores y servicios específicos, evitando mezclar observabilidad con reglas de negocio.

---

