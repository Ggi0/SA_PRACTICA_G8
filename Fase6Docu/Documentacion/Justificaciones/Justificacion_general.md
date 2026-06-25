# Justificación general del proyecto FilmStars

FilmStars es una plataforma web para la venta de boletos de cine en línea. El objetivo principal del proyecto es permitir que los usuarios consulten cartelera, seleccionen ciudad y cine, visualicen funciones disponibles, seleccionen asientos, realicen una reserva, procesen un pago simulado y obtengan un boleto final.

El proyecto realiza el diseño arquitectónico de la fase anterior hacia una implementación funcional, agregando autenticación con JWT, frontend integrado, backend orientado a servicios, comunicación asíncrona mediante RabbitMQ y despliegue local mediante Docker Compose.

La Práctica 5 amplía FilmStars hacia dos frentes principales: el frente funcional de boletos digitales y control de accesos, y el frente operativo de despliegue cloud native. En esta fase el sistema debe permitir descargar boletos, consultar historial de compras, validar boletos desde el panel administrador, marcar boletos como usados, cambiar el estado de asientos a `EN_USO` cuando el ingreso sea autorizado y contar con flujos de contingencia mediante búsqueda manual. Además, la infraestructura pasa de un despliegue basado únicamente en VM/Docker Compose hacia un flujo multi-entorno donde `develop` despliega en VM y `release` despliega en K3s sobre AWS.

A continuación se justifican las tecnologías utilizadas, por qué se trabajó de esa manera y dónde se evidencia su uso dentro del código del proyecto.

## Implementación de Solución

Se construyó una solución dividida en componentes independientes:

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | React + Vite + TypeScript | Interfaz web para usuarios, consulta de cartelera, login, registro y flujo visual de compra. |
| API Gateway | NestJS + TypeScript | Punto de entrada único, enrutamiento hacia servicios internos y validación de JWT en rutas protegidas. |
| Users Service | NestJS + TypeScript + PostgreSQL | Registro, inicio de sesión, emisión de JWT y gestión de usuarios. |
| Movies Service | NestJS + TypeScript + PostgreSQL | Consulta de ciudades, cines, cartelera, películas y funciones. |
| Reservations Service | PostgreSQL + estructura base | Persistencia diseñada para reservas, asientos por función y estados de disponibilidad. |
| Payments Service | PostgreSQL + estructura base | Persistencia diseñada para pagos, detalles de pago, boletos y reembolsos. |
| RabbitMQ | RabbitMQ Management | Broker de mensajería para desacoplar procesos críticos como reservas y pagos. |
| Docker Compose | Docker | Orquestación local de servicios, bases de datos y RabbitMQ. |

## Aplicación de Arquitectura

Se utilizó una arquitectura orientada a servicios porque el sistema contiene dominios de negocio con responsabilidades distintas. Separar usuarios, cartelera, reservas y pagos permite que cada parte pueda evolucionar, probarse y mantenerse de manera independiente.

Además, la venta de boletos requiere manejar concurrencia, especialmente cuando varios usuarios intentan seleccionar el mismo asiento al mismo tiempo. Por esa razón, el diseño contempla un servicio de reservas desacoplado y comunicación asíncrona mediante RabbitMQ para evitar bloquear el flujo principal de la aplicación.

## Decisiones Técnicas

Las decisiones técnicas buscan cumplir los siguientes objetivos:

| Decisión | Propósito |
|---|---|
| API Gateway | Centralizar el acceso desde el frontend y proteger rutas mediante JWT. |
| Servicios separados | Reducir acoplamiento y mejorar mantenibilidad. |
| PostgreSQL por servicio | Mantener independencia de datos por dominio. |
| RabbitMQ | Procesar operaciones críticas de forma asíncrona y desacoplada. |
| Docker Compose | Levantar todo el entorno local con un solo comando. |
| TypeScript | Mejorar mantenibilidad y reducir errores de tipado. |
| NestJS | Organizar el backend con módulos, controladores, servicios e inyección de dependencias. |
| React + Vite | Construir una interfaz rápida, modular y fácil de integrar con APIs. |

## Flujo del Sistema

1. El usuario accede al frontend.
2. El frontend se comunica con el API Gateway.
3. El usuario puede registrarse o iniciar sesión.
4. El users-service valida credenciales y genera un JWT.
5. El frontend almacena el token y lo envía en la cabecera `Authorization: Bearer <token>`.
6. El usuario consulta ciudades, cines, películas y funciones desde el movies-service.
7. El usuario selecciona una función y asientos.
8. La reserva debe procesarse por el servicio de reservas, validando disponibilidad y bloqueando temporalmente los asientos.
9. El pago debe procesarse por el servicio de pagos.
10. Al confirmarse el pago, el sistema emite el boleto final.

## Estado de Funcionalidades

| Área | Estado |
|---|---|
| Autenticación y JWT | Implementado en users-service y API Gateway. |
| Gestión de usuarios | Implementado parcialmente. |
| Consulta de cartelera | Implementado en movies-service. |
| Base de datos SOA | Implementada con 4 bases PostgreSQL. |
| RabbitMQ | Configurado en Docker Compose. |
| Reservas y pagos backend | Diseñados a nivel de base de datos; frontend cuenta con mocks temporales. |
| Docker Compose | Implementado para levantar bases, RabbitMQ, API Gateway y servicios implementados. |

---

## TypeScript

TypeScript se utilizó porque permite construir tanto backend como frontend con tipado estático, interfaces, DTOs y contratos claros entre capas. En FilmStars existen múltiples servicios y flujos que transportan datos sensibles, como usuarios autenticados, reservas, pagos, boletos, estados de asientos y cargas administrativas. El tipado ayuda a reducir errores al momento de pasar información entre controladores, servicios, repositorios y clientes HTTP.

También facilita la aplicación de SOLID porque permite definir interfaces como `IMoviesService`, `IMoviesRepository`, `PaymentGatewayInterface` o `MessagePublisher`, haciendo que los módulos dependan de contratos y no de clases concretas.

### ¿Dónde se utilizó?

Se utiliza en todos los servicios backend (`api-gateway`, `users-service`, `movies-service`, `reservas-service`, `payments-service`) y en el frontend React.

### Evidencia de código

```ts
// movies-service/src/movies/movies.service.ts
export interface IMoviesService {
  list(filters: MovieFilters): Promise<PublicMovie[]>;
  listPage(filters: MoviePageFilters): Promise<PaginatedMoviesResult>;
  getById(id: string): Promise<PublicMovie>;
  calculatePrice(tipo: MovieType, basePrice: number): number;
}

@Injectable()
export class MoviesService implements IMoviesService {
  constructor(@Inject(MOVIES_REPOSITORY) private readonly repo: IMoviesRepository) {}
}
```

**Explicación:** este fragmento evidencia el uso de TypeScript para definir contratos tipados. El servicio de películas no expone métodos ambiguos, sino operaciones concretas con tipos definidos para filtros, resultados paginados y películas públicas.

```ts
// payments-service/src/database/entities/boleto.entity.ts
@Entity('boleto')
export class BoletoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'codigo_boleto' })
  codigoBoleto: string;

  @Column({ name: 'codigo_qr', nullable: true })
  codigoQr?: string;

  @Column({ type: 'varchar', length: 50, default: 'EMITIDO' })
  estado: string;
}
```

**Explicación:** en Práctica 5, el boleto digital y su código QR son base para la descarga, historial y validación de acceso. TypeScript permite modelar esta entidad de forma clara y mantener el estado del boleto como parte del dominio de pagos/boletos.

---

## Framework Backend: NestJS

NestJS se utilizó porque organiza el backend en módulos, controladores, servicios, repositorios, guards e inyección de dependencias. Esto encaja con SOA y SOLID, ya que cada servicio puede dividirse internamente por responsabilidades y cada módulo puede exponerse de forma independiente.

Además, NestJS permite proteger rutas mediante guards, inyectar repositorios o servicios mediante tokens, definir controladores HTTP y mantener una estructura consistente entre todos los microservicios.

### ¿Dónde se utilizó?

Se utiliza en:

- `api-gateway`
- `users-service`
- `movies-service`
- `reservas-service`
- `payments-service`

### Evidencia de código

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

**Explicación:** NestJS se usa para declarar endpoints administrativos. El controlador recibe el archivo CSV y delega la lógica al servicio. Esto mantiene separada la entrada HTTP de la lógica de negocio.

```ts
// users-service/src/auth/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const payload = jwt.verify(header.split(' ')[1], env.jwtSecret) as jwt.JwtPayload;
    request.user = {
      id: String(payload.sub),
      email: String(payload.email),
      nombre: String(payload.nombre),
      rol: payload.rol === 'admin' ? 'admin' : 'customer',
    };

    return true;
  }
}
```

**Explicación:** este guard demuestra cómo NestJS protege rutas usando JWT. En Práctica 5 esto es importante porque el control de accesos y la validación manual de boletos deben estar disponibles únicamente para administradores.

---

## Framework Frontend: React + Vite

React se utilizó porque permite construir interfaces por componentes reutilizables. FilmStars tiene pantallas de usuario, pantallas administrativas, selección de asientos, carga CSV, checkout, confirmación, historial de compras y validación de boletos. Separar estas vistas en componentes facilita mantenimiento y crecimiento.

Vite se utilizó porque reduce el tiempo de arranque y build del frontend, además de integrarse bien con TypeScript. Esto favorece el flujo de desarrollo y CI/CD.

### ¿Dónde se utilizó?

Se utiliza en `Fase3/client`, donde se encuentran rutas, páginas, componentes y servicios HTTP.

### Evidencia de código

```tsx
// client/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Explicación:** React se usa para montar la aplicación principal. Desde `App` se organizan las rutas del sistema y las vistas del usuario y administrador.

```tsx
// client/src/routes/AppRoutes.tsx
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return <>{children}</>
}

<Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
  <Route path="movies" element={<AdminMoviesPage />} />
  <Route path="functions" element={<AdminFunctionsPage />} />
  <Route path="salas" element={<AdminSalasPage />} />
  <Route path="cines" element={<AdminCinemasPage />} />
  <Route path="movies/bulk" element={<AdminBulkMoviesPage />} />
</Route>
```

**Explicación:** el frontend implementa control visual de rutas administrativas. Aunque el backend también valida permisos, React permite ocultar y restringir vistas a usuarios sin rol administrativo.

```ts
// client/src/services/api/httpClient.ts
const httpClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
```

**Explicación:** el frontend envía el JWT automáticamente en cada petición protegida. Esto permite que el API Gateway y los servicios validen identidad y rol.

---

## Sistema de Bases de Datos: PostgreSQL

PostgreSQL se utilizó porque FilmStars maneja datos relacionales: usuarios, películas, géneros, cines, salas, funciones, reservas, asientos, pagos y boletos. También permite transacciones, bloqueos pesimistas, restricciones de integridad, consultas con `LIMIT/OFFSET` y control de concurrencia.

En el proyecto se aplica separación de bases por dominio: usuarios, cartelera, reservas y pagos. Esto respeta el enfoque SOA y evita que un servicio dependa físicamente de la base de otro.

### ¿Dónde se utilizó?

- `filmstars_users`
- `filmstars_movies`
- `filmstars_reservations`
- `filmstars_payments`

### Evidencia de código

```ts
// movies-service/src/movies/movies.repository.ts
const sql = `
  SELECT
    p.id,
    p.titulo,
    p.sinopsis,
    p.duracion_min,
    p.clasificacion,
    p.poster_url,
    p.fecha_estreno,
    p.tipo,
    p.activa,
    p.creado,
    p.modificacion,
    COALESCE(
      ARRAY_AGG(g.nombre ORDER BY g.nombre) FILTER (WHERE g.nombre IS NOT NULL),
      '{}'
    ) AS generos
  FROM pelicula p
  LEFT JOIN pelicula_genero pg ON pg.pelicula_id = p.id
  LEFT JOIN genero g ON g.id = pg.genero_id
  WHERE ${whereClause}
  GROUP BY p.id
  ORDER BY p.fecha_estreno DESC, p.creado DESC
  LIMIT $${paginatedValues.length - 1}
  OFFSET $${paginatedValues.length}
`;
```

**Explicación:** PostgreSQL se utiliza para consultar el catálogo paginado desde el backend, evitando traer todo el catálogo al frontend.

```ts
// reservas-service/src/reservas/services/reservas.service.ts
return this.dataSource.transaction(async (manager) => {
  const asientoRepoTx = manager.getRepository(EstadoAsientoFuncionEntity);

  const asientos = await asientoRepoTx
    .createQueryBuilder('asiento')
    .setLock('pessimistic_write')
    .where('asiento.funcion_id_ref = :funcionId', { funcionId })
    .andWhere('asiento.id IN (:...ids)', { ids: asientosUnicos })
    .getMany();

  if (asientosNoDisponibles.length > 0) {
    throw new AsientoNoDisponibleException(
      'Uno o más asientos ya están bloqueados u ocupados',
    );
  }
});
```

**Explicación:** PostgreSQL y TypeORM permiten usar transacciones y bloqueo pesimista para evitar que dos usuarios reserven el mismo asiento simultáneamente.

---

## RabbitMQ

RabbitMQ se utilizó porque las reservas, pagos y emisión de boletos son procesos críticos que no deben perderse ante fallos parciales. La cola permite desacoplar servicios y procesar eventos de forma asíncrona, evitando que el hilo principal quede bloqueado.

En Práctica 5 esto sigue siendo importante porque la emisión del boleto y la validación posterior dependen de que el flujo de pago y reserva sea consistente.

### ¿Dónde se utilizó?

Se utiliza principalmente en `reservas-service` y `payments-service`, para publicar y consumir eventos de reserva y pago.

### Evidencia de código

```ts
// reservas-service/src/messaging/rabbitmq.publisher.ts
async publish(queue: string, message: any) {
  await this.channel.assertQueue(queue, { durable: true });

  this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });

  console.log(` Mensaje enviado a ${queue}`);
}
```

**Explicación:** los mensajes se publican como persistentes y las colas son durables. Esto ayuda a reducir pérdida de eventos críticos.

```ts
// payments-service/src/consumers/payment.consumer.ts
await this.channel.consume(
  RABBITMQ_QUEUES.PAYMENT_PROCESS,
  async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(
        msg.content.toString(),
      ) as PaymentProcessMessage;

      await this.paymentsService.procesarPagoDesdeEvento({
        reservaId: payload.reservaId,
        usuarioId: payload.usuarioId,
        monto: payload.monto,
        moneda: payload.moneda ?? 'GTQ',
        metodoPago: payload.metodoPago,
      });

      this.channel?.ack(msg);
    } catch (error) {
      this.channel?.nack(msg, false, false);
    }
  },
  { noAck: false },
);
```

**Explicación:** el consumer confirma mensajes con `ack` cuando se procesan correctamente y usa `nack` cuando ocurre un error. Esto permite controlar el flujo de eventos de pago.

---

## Conclusión

La combinación de TypeScript, NestJS, React, Vite, PostgreSQL y RabbitMQ permite que FilmStars mantenga una arquitectura modular, segura y preparada para crecer. Las decisiones técnicas no se tomaron de forma aislada: cada herramienta responde a una necesidad concreta del sistema. TypeScript mejora la mantenibilidad, NestJS ordena el backend, React facilita la interfaz, PostgreSQL garantiza integridad transaccional y RabbitMQ desacopla procesos críticos.

En Práctica 5 estas decisiones siguen siendo válidas porque el sistema ahora debe gestionar boletos digitales, historial, escaneo, control de acceso y despliegue cloud native sin romper la arquitectura existente.
