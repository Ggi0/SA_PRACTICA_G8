# Justificación de Toma de Decisiones - FilmStars

## Introducción

FilmStars es una plataforma web para la venta de boletos de cine en línea. El sistema permite que los usuarios consulten cartelera, seleccionen ciudad y cine, elijan funciones, seleccionen asientos, realicen una reserva, procesen un pago simulado, obtengan un boleto digital y posteriormente puedan validarlo mediante un flujo de control de accesos.

A lo largo de las prácticas, el proyecto fue evolucionando desde una propuesta arquitectónica inicial hasta una solución orientada a servicios, desplegable, automatizada y observable. Las decisiones tomadas no se realizaron de forma aislada, sino que respondieron a los requerimientos que se fueron agregando en cada fase: separación por dominios, concurrencia en asientos, comunicación asíncrona, administración de cartelera, carga CSV, paginación, boletos digitales, control de accesos, CI/CD, K3s, Terraform, Ansible, Prometheus y Grafana.

El objetivo de esta justificación es explicar por qué se decidió trabajar de esta forma, cómo se implementó la solución y cómo cada decisión aportó a la mantenibilidad, escalabilidad, seguridad y operación del sistema.

---

## Decisión de trabajar con Arquitectura Orientada a Servicios

Desde las primeras fases se decidió trabajar con una arquitectura orientada a servicios porque FilmStars tiene dominios claramente separados. El sistema no se limita a mostrar películas, sino que también administra usuarios, cartelera, funciones, reservas, pagos, boletos y control de accesos.

Por esa razón, se dividió el sistema en servicios especializados:

| Servicio             | Responsabilidad                                                               |
| -------------------- | ----------------------------------------------------------------------------- |
| Users Service        | Registro, login, usuarios, roles y JWT.                                       |
| Movies Service       | Ciudades, cines, salas, películas, funciones, cartelera, CSV y paginación.    |
| Reservations Service | Reservas, bloqueo de asientos y estado de asientos por función.               |
| Payments Service     | Pagos, boletos, historial, descarga y validación de boletos.                  |
| API Gateway          | Punto de entrada único para frontend y enrutamiento hacia servicios internos. |
| RabbitMQ             | Comunicación asíncrona para procesos críticos.                                |

Esta decisión permitió que cada servicio evolucionara de forma independiente. Por ejemplo, cuando se agregó la carga masiva por CSV, esta funcionalidad se integró al `Movies Service` porque pertenece al dominio de cartelera. Cuando se agregó la descarga e historial de boletos, se integró al `Payments Service` porque el boleto nace como resultado de una compra exitosa. Cuando se agregó el control de asientos, se mantuvo dentro del `Reservations Service` porque ese servicio es dueño del estado de disponibilidad.

La decisión de usar SOA también permitió evitar un monolito. Si todo el sistema hubiera estado en un único backend, cualquier cambio en cartelera, pagos o reservas habría afectado a todo el sistema. Con servicios separados, cada dominio tiene una responsabilidad más clara.

### Evidencia de decisión

```ts
// api-gateway/src/main.ts
app.use('/api/auth', createUsersProxy());
app.use('/api/movies', createMoviesProxy());
app.use('/api/reservas', jwtMiddleware, createReservasProxy());
app.use('/api/payments', jwtMiddleware, createPaymentsProxy());
```

Este fragmento representa la decisión de usar un **API Gateway** como entrada centralizada. El frontend no necesita conocer directamente todos los servicios internos; solo consume el Gateway y este enruta cada solicitud al servicio correspondiente.

---

## Decisión de usar API Gateway

Se decidió usar un API Gateway porque el sistema tiene varios servicios backend. Si el frontend consumiera directamente cada servicio, habría mayor acoplamiento y sería más difícil aplicar seguridad de forma uniforme.

El API Gateway se utilizó para:

* Centralizar el acceso desde el frontend.
* Enrutar solicitudes hacia Users, Movies, Reservations y Payments.
* Validar JWT en rutas protegidas.
* Proteger rutas administrativas.
* Evitar que el cliente conozca directamente la topología interna.

Esta decisión fue importante cuando se agregaron roles administrativos, carga CSV, control de accesos y monitoreo operativo. El Gateway permite controlar qué rutas son públicas, cuáles requieren autenticación y cuáles requieren rol `Admin`.

---

## Decisión de usar TypeScript

Se decidió utilizar TypeScript porque el proyecto creció hacia múltiples servicios, interfaces, DTOs, entidades y respuestas entre capas. TypeScript permite trabajar con tipado estático, lo cual ayuda a reducir errores y mantener contratos claros entre frontend y backend.

TypeScript fue útil para definir contratos como:

```ts
export interface IMoviesService {
  list(filters: MovieFilters): Promise<PublicMovie[]>;
  listPage(filters: MoviePageFilters): Promise<PaginatedMoviesResult>;
  getById(id: string): Promise<PublicMovie>;
  calculatePrice(tipo: MovieType, basePrice: number): number;
}
```

Esta decisión ayudó a mantener orden en servicios como `Movies Service`, donde se manejan filtros, paginación, categorías, precios y respuestas públicas de cartelera.

También permitió aplicar principios SOLID, principalmente mediante interfaces e inyección de dependencias.

---

## Decisión de usar NestJS en Backend

Se decidió utilizar NestJS porque permite organizar el backend en módulos, controladores, servicios, repositorios, guards e inyección de dependencias. Esto encaja directamente con la arquitectura SOA y con los principios SOLID.

NestJS permite que cada servicio tenga una estructura consistente:

```txt
controller → service → repository → database
```

Por ejemplo, en la carga CSV se aplicó esta separación:

```ts
@Controller('api/admin/movies/bulk')
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  @Post('upload')
  uploadCsv(@UploadedFile() file: Express.Multer.File) {
    return this.bulkService.uploadCsv(file);
  }
}
```

El controlador no procesa directamente el archivo. Solo recibe la petición y delega al servicio. Esta decisión evita mezclar responsabilidades y facilita pruebas, mantenimiento y futuras extensiones.

---

## Decisión de usar React + Vite en Frontend

Se decidió utilizar React porque el sistema requiere una interfaz modular con múltiples vistas: login, registro, cartelera, selección de asientos, flujo de compra, panel administrativo, carga CSV, historial de boletos y control de accesos.

React permite trabajar por componentes y separar responsabilidades visuales. Vite se utilizó porque permite un entorno de desarrollo rápido y builds más ligeros.

También se implementó control de rutas administrativas desde el frontend:

```tsx
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;

  return <>{children}</>;
}
```

Esta decisión permite ocultar vistas administrativas a usuarios comunes. Aun así, se mantiene la validación en backend porque el frontend no debe ser la única barrera de seguridad.

---

## Decisión de usar PostgreSQL

Se decidió utilizar PostgreSQL porque FilmStars maneja información relacional: usuarios, películas, géneros, cines, salas, funciones, reservas, asientos, pagos y boletos.

PostgreSQL también permite transacciones, bloqueos y consistencia, lo cual es fundamental para evitar conflictos de concurrencia en la selección de asientos.

Uno de los puntos más importantes del sistema es impedir que dos usuarios compren el mismo asiento. Para eso se usó bloqueo pesimista:

```ts
const asientos = await asientoRepoTx
  .createQueryBuilder('asiento')
  .setLock('pessimistic_write')
  .where('asiento.funcion_id_ref = :funcionId', { funcionId })
  .andWhere('asiento.id IN (:...ids)', { ids: asientosUnicos })
  .getMany();
```

Esta decisión garantiza que, cuando un usuario intenta reservar un asiento, la fila queda bloqueada durante la transacción y otro usuario no puede confirmar el mismo asiento al mismo tiempo.

También se decidió mantener bases de datos separadas por servicio para respetar SOA:

| Base de datos            | Servicio             |
| ------------------------ | -------------------- |
| `filmstars_users`        | Users Service        |
| `filmstars_movies`       | Movies Service       |
| `filmstars_reservations` | Reservations Service |
| `filmstars_payments`     | Payments Service     |

Esto evita que un servicio dependa directamente de la base de datos de otro.

---

## Decisión de usar RabbitMQ

Se decidió utilizar RabbitMQ porque el flujo de compra tiene procesos que no deben acoplarse de forma síncrona. Reservar, pagar y emitir boletos son operaciones críticas que pueden tardar, fallar o requerir reprocesamiento.

RabbitMQ permite desacoplar estos procesos mediante colas:

```ts
async publish(queue: string, message: any) {
  await this.channel.assertQueue(queue, { durable: true });

  this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
}
```

Esta decisión ayuda a que el sistema no dependa de llamadas directas entre reservas y pagos. Si un servicio falla temporalmente, el mensaje puede mantenerse en cola y procesarse posteriormente.

RabbitMQ también aporta trazabilidad en procesos como:

* Reserva solicitada.
* Pago procesado.
* Resultado de pago.
* Emisión de boleto.
* Liberación de asientos.

---

## Decisión de usar JWT y roles

Se decidió usar JWT porque el sistema necesita autenticar usuarios y proteger rutas. Además, se agregaron roles, especialmente para diferenciar entre usuario común y administrador.

El JWT transporta información esencial:

```ts
const payload = {
  sub: user.id,
  email: user.email,
  nombre: user.nombre,
  rol: user.rol,
};
```

Esta decisión permitió proteger:

* Gestión de usuarios.
* Selección de asientos.
* Flujo de compra.
* Panel administrativo.
* Carga CSV.
* Escaneo y control de accesos.
* Consulta de dashboards o información operativa.

Se decidió validar tanto en frontend como en backend. El frontend oculta vistas, pero el backend sigue validando porque un usuario podría intentar consumir endpoints directamente.

---

## Decisión de agregar módulo administrativo

A partir de las fases intermedias se decidió agregar un módulo administrativo porque el sistema necesitaba gestionar cartelera, cines, salas, funciones, mapa de asientos y carga masiva de películas.

Esta decisión separa las acciones del usuario común de las acciones del administrador. El usuario compra boletos; el administrador configura el sistema.

El módulo administrativo permitió integrar:

* Gestión de cines.
* Gestión de salas.
* Configuración de asientos.
* Gestión de funciones.
* Carga masiva CSV.
* Escaneo y control de accesos.
* Monitoreo operativo.

---

##  Decisión de integrar carga masiva CSV en Gestión de Cartelera

Se decidió que la carga CSV no fuera un caso aislado, sino una extensión de la gestión de cartelera. La razón es que cargar un CSV es una forma masiva de agregar películas, no un módulo independiente del negocio.

Por eso se integró dentro del `Movies Service`.

```ts
async uploadCsv(file: Express.Multer.File): Promise<BulkUploadResponse> {
  this.validateUploadedFile(file);

  const genresCatalog = await this.bulkRepository.getGenresCatalog();
  const parseResult = this.csvParser.parse(file.buffer, genresCatalog);

  const insertResult = await this.bulkRepository.bulkInsertMovies(
    parseResult.validRows,
  );

  return {
    summary: {
      totalFilas: parseResult.totalRows,
      procesadasCorrectamente: insertResult.insertedCount,
      rechazadas: parseResult.invalidRows.length + insertResult.failedRows.length,
    },
    errors: [...parseResult.invalidRows, ...insertResult.failedRows],
  };
}
```

Esta decisión permitió procesar grandes volúmenes de películas sin que el administrador tuviera que ingresarlas una por una.

---

## Decisión de agregar paginación del lado del servidor

Se decidió implementar paginación en backend porque cargar todo el catálogo en el frontend no era eficiente. Si el catálogo crece, enviar todas las películas al navegador afecta rendimiento y experiencia del usuario.

Por eso el backend recibe `page`, `limit`, `category`, `city` o filtros similares, y devuelve únicamente una página.

```ts
LIMIT $${paginatedValues.length - 1}
OFFSET $${paginatedValues.length}
```

Esta decisión mejora:

* Rendimiento.
* Escalabilidad.
* Tiempo de respuesta.
* Uso de red.
* Experiencia del usuario.

También mantiene la lógica de consulta en el servicio dueño del catálogo: `Movies Service`.

---

## Decisión de agregar boletos digitales, historial y control de accesos

Se decidió agregar boletos digitales porque el flujo de compra no debía terminar únicamente con el pago. Un sistema real de cine necesita que el usuario pueda obtener un comprobante y usarlo para ingresar a la sala.

Por eso se agregó:

* Descarga de boleto.
* Historial de compras.
* Código QR o código único.
* Validación desde panel administrativo.
* Estado del boleto.
* Auditoría de accesos.

La entidad de boleto representa esta decisión:

```ts
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

Esta decisión permitió cerrar el ciclo del negocio: el usuario compra, recibe boleto, llega al cine y el administrador valida el ingreso.

---

## Decisión de usar Docker y Docker Compose

Se decidió usar Docker porque cada servicio tiene dependencias propias y necesita ejecutarse en un entorno consistente. Docker permite empaquetar servicios y bases de datos para que el proyecto pueda levantarse de forma repetible.

Docker Compose se utilizó para levantar el entorno completo:

* Frontend.
* API Gateway.
* Servicios backend.
* Bases PostgreSQL.
* RabbitMQ.
* Servicios de soporte.

Esta decisión facilitó el desarrollo local y la integración entre servicios.

---

## Decisión de usar GitHub Actions para CI/CD

Se decidió utilizar GitHub Actions porque el repositorio está en GitHub y permite automatizar el flujo completo: pruebas, build, publicación de imágenes y despliegue.

El pipeline permite diferenciar ambientes:

| Rama      | Flujo                                                               |
| --------- | ------------------------------------------------------------------- |
| `develop` | Build, push a Docker Hub y despliegue en VM/EC2 con Docker Compose. |
| `release` | Build, push a registry privado y despliegue en K3s sobre AWS.       |

```yaml
on:
  pull_request:
    branches: [develop, release]
  push:
    branches: [develop, release]
```

Esta decisión reduce errores manuales, mejora trazabilidad y permite asegurar que solo se despliegue código validado.

---

## Decisión de usar K3s para entorno release

Se decidió usar K3s porque permite ejecutar Kubernetes de forma más ligera, ideal para un entorno académico o de práctica en AWS. K3s permite desplegar servicios como pods, exponerlos mediante Services e Ingress, y manejar configuración mediante ConfigMaps y Secrets.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: movies-service
  namespace: filmstars
spec:
  replicas: 1
  strategy:
    type: RollingUpdate
```

Esta decisión permite que FilmStars se despliegue como una arquitectura más profesional y cercana a producción, con soporte para RollingUpdate y rollback.

---

## Decisión de usar ConfigMaps y Secrets

Se decidió usar ConfigMaps para configuración no sensible y Secrets para credenciales.

Esto evita quemar valores dentro del código fuente o manifiestos.

```yaml
envFrom:
  - configMapRef:
      name: filmstars-common
  - secretRef:
      name: filmstars-secrets
```

Esta decisión mejora la seguridad y permite cambiar configuración por entorno sin modificar código.

---

## Decisión de usar Terraform

En la Práctica 6 se decidió utilizar Terraform porque el proyecto necesitaba aprovisionar infraestructura de AWS de forma automatizada y reproducible.

Terraform permite definir infraestructura como código:

```hcl
resource "aws_instance" "filmstars_release" {
  ami           = var.ami_id
  instance_type = var.instance_type

  tags = {
    Name        = "filmstars-release-k3s"
    Environment = "release"
  }
}
```

Esta decisión evita depender de clics manuales en la consola de AWS. También permite versionar la infraestructura, replicarla y documentar claramente qué recursos se crean.

---

## Decisión de usar Ansible

Se decidió utilizar Ansible porque Terraform crea infraestructura, pero no configura completamente el servidor. Después de crear una EC2, es necesario instalar dependencias, preparar Docker, configurar K3s, usuarios, carpetas y herramientas.

Ansible permite automatizar esa configuración:

```yaml
- name: Instalar K3s
  shell: |
    curl -sfL https://get.k3s.io | sh -
  args:
    creates: /usr/local/bin/k3s
```

Esta decisión evita conectarse manualmente al servidor para repetir comandos. Además, Ansible es idempotente, por lo que puede ejecutarse más de una vez sin dejar el servidor en estado inconsistente.

---

## Decisión de usar Prometheus

Se decidió usar Prometheus porque el sistema necesita observabilidad. Ya no basta con desplegar servicios; también es necesario saber si están funcionando correctamente.

Prometheus recolecta métricas mediante scraping:

```yaml
scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:8080']

  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq:15692']
```

Esta decisión permite monitorear:

* Estado de servicios.
* Latencia.
* Errores.
* CPU y memoria.
* Estado de pods.
* Estado de RabbitMQ.
* Mensajes pendientes.
* Validaciones de boletos.

---

## Decisión de usar Grafana

Se decidió usar Grafana porque Prometheus recolecta métricas, pero Grafana permite visualizarlas de forma clara mediante dashboards.

Grafana permite que el administrador observe:

* Salud general del sistema.
* Estado de pods.
* Uso de CPU/RAM.
* Estado del Ingress.
* Colas RabbitMQ.
* Boletos validados por minuto.
* Errores o saturación.

Esta decisión permite demostrar que el sistema tiene telemetría viva y que se puede operar de forma más profesional.

---

## Decisión de mantener SOLID

Se decidió aplicar SOLID para evitar que el crecimiento del sistema generara clases o módulos demasiado grandes.

Cada nueva funcionalidad se integró respetando responsabilidades:

| Funcionalidad      | Decisión                                                |
| ------------------ | ------------------------------------------------------- |
| CSV                | Separar controller, service, parser y repository.       |
| Paginación         | Separar filtros, servicio y repositorio.                |
| Boletos            | Separar entidad, historial, descarga y validación.      |
| Control de accesos | Separar validación, auditoría y búsqueda manual.        |
| Métricas           | Separar exposición de métricas de la lógica de negocio. |
| Terraform          | Separar red, seguridad, cómputo, variables y outputs.   |
| Ansible            | Separar playbooks, inventario y variables.              |
| Grafana            | Separar dashboards por área de operación.               |

Esto permitió que FilmStars creciera sin perder mantenibilidad.

---

## Decisión de mantener ACID en operaciones críticas

Se decidió documentar y mantener ACID porque el sistema maneja operaciones donde la consistencia es crítica: asientos, pagos, boletos y validaciones.

Por ejemplo, un boleto no debe poder usarse dos veces. Por eso la validación debe bloquear el registro, verificar estado, marcar como usado y registrar auditoría.

```ts
await dataSource.transaction(async (manager) => {
  const boleto = await manager
    .getRepository(BoletoEntity)
    .createQueryBuilder('boleto')
    .setLock('pessimistic_write')
    .where('boleto.codigo_boleto = :codigo', { codigo })
    .getOne();

  if (!boleto || boleto.estado !== 'EMITIDO') {
    throw new Error('Boleto inválido o ya utilizado');
  }

  boleto.estado = 'USADO';
  await manager.getRepository(BoletoEntity).save(boleto);
});
```

Esta decisión protege al sistema contra doble venta de asientos, doble uso de boletos e inconsistencias en pagos.

---



---

## Conclusión

La toma de decisiones en FilmStars se basó en mantener una arquitectura modular, escalable, segura y operable. Se eligió SOA para separar dominios; API Gateway para centralizar entrada; TypeScript y NestJS para ordenar el backend; React y Vite para construir una interfaz modular; PostgreSQL para consistencia de datos; RabbitMQ para desacoplar procesos críticos; Docker para contenerizar servicios; GitHub Actions para automatizar CI/CD; K3s para orquestar el entorno release; Terraform para aprovisionar infraestructura; Ansible para configurar servidores; Prometheus para recolectar métricas; y Grafana para visualizar la salud del sistema.

Cada decisión respondió a una necesidad concreta del proyecto. Al inicio se necesitaba separar responsabilidades; luego administrar cartelera; después controlar concurrencia, pagos y boletos; más adelante automatizar despliegues; y finalmente observar el sistema en ejecución.

Gracias a estas decisiones, FilmStars evolucionó de una propuesta de arquitectura a una plataforma completa con compra de boletos, administración, control de accesos, infraestructura automatizada y monitoreo operativo.
