# Justificación de Arquitectura Orientada a Servicios (SOA) - FilmStars

FilmStars utiliza una Arquitectura Orientada a Servicios porque el sistema está formado por dominios de negocio con responsabilidades distintas: autenticación y usuarios, cartelera, reservas/asientos, pagos/boletos, comunicación asíncrona y despliegue. Esta separación permite que cada servicio pueda evolucionar, probarse, mantenerse y desplegarse de forma independiente.

La arquitectura se mantiene consistente aunque el sistema crezca. Las funcionalidades agregadas en las últimas fases no se colocan como módulos aislados sin relación, sino dentro del servicio que corresponde por dominio: la carga CSV y la paginación pertenecen al Movies Service; la descarga, historial y validación de boletos pertenecen principalmente al Payments Service; el estado físico del asiento pertenece al Reservations Service; y el acceso externo sigue pasando por el API Gateway. A nivel operativo, Docker Compose, GitHub Actions, Docker Hub/Zot y K3s soportan la arquitectura sin cambiar la separación lógica de servicios.

---

## Servicios, responsabilidades y evolución integrada

| Servicio / Componente | Responsabilidad principal | Base de datos / soporte | Funcionalidades integradas |
|---|---|---|---|
| API Gateway | Punto de entrada único, validación de JWT, validación de rol y enrutamiento. | No aplica. | Enruta login, cartelera, reservas, pagos, carga CSV, consultas paginadas, historial, descarga y validación de boletos. |
| Users Service | Registro, login, gestión de usuarios, roles y emisión de JWT. | `filmstars_users` | Provee identidad y rol para usuario común y administrador. |
| Movies Service | Ciudades, cines, salas, películas, géneros, funciones y cartelera. | `filmstars_movies` | Incluye carga masiva CSV, validación de películas y paginación server-side. |
| Reservations Service | Reservas, bloqueo temporal, disponibilidad y estado de asientos por función. | `filmstars_reservations` | Controla concurrencia y estados de asientos, incluyendo preparación para `EN_USO` al validar ingreso. |
| Payments Service | Pagos simulados, detalles de pago, boletos, QR, estados de boleto y trazabilidad. | `filmstars_payments` | Soporta emisión, historial, descarga y validación de boletos. |
| RabbitMQ | Comunicación asíncrona entre procesos críticos. | Broker AMQP. | Desacopla reserva, pago, emisión de boleto y eventos de resultado. |
| Docker Compose | Orquestación local/staging. | `docker-compose.yml` / `docker-compose.prod.yml`. | Replica el entorno completo y consume imágenes precompiladas. |
| GitHub Actions | CI/CD. | `.github/workflows/ci-cd.yml`. | Ejecuta pruebas, cobertura, build, push y despliegue multi-entorno. |
| Docker Hub / Zot | Registry de imágenes. | Artefactos Docker. | Docker Hub para `develop`; Zot/Harbor para entorno `release`. |
| K3s | Orquestación cloud native. | Clúster sobre AWS. | Despliega servicios con Deployments, Services, ConfigMaps, Secrets, Ingress y RollingUpdate. |


## Infraestructura como parte de la arquitectura SOA en Práctica 6

| Componente | Rol dentro de SOA |
|---|---|
| Terraform | Aprovisiona la infraestructura donde viven los servicios. |
| Ansible | Configura los servidores y prepara K3s para ejecutar los servicios. |
| K3s | Orquesta los servicios como unidades independientes. |
| Prometheus | Observa cada servicio y componente operativo mediante métricas. |
| Grafana | Permite visualizar la salud de los servicios y detectar fallos. |

---

## ¿Por qué SOA es adecuada para FilmStars?

Se eligió SOA porque FilmStars combina procesos con necesidades diferentes. La autenticación no cambia por las mismas razones que la cartelera; la cartelera no tiene la misma criticidad de concurrencia que las reservas; los pagos y boletos requieren trazabilidad; y la infraestructura necesita desplegar servicios de forma independiente.

SOA permite:

- Modificar cartelera sin alterar autenticación.
- Agregar carga CSV sin tocar pagos o reservas.
- Agregar paginación en Movies Service sin cambiar Users Service.
- Agregar historial y descarga de boletos sin acoplarlo a Movies Service.
- Validar boletos desde el panel administrador sin convertir el sistema en un monolito.
- Mantener reservas y pagos desacoplados mediante RabbitMQ.
- Desplegar cada servicio como imagen independiente en Docker Compose o K3s.

---

## API Gateway del sistema

El frontend no consume directamente cada servicio interno. El API Gateway centraliza entrada, seguridad y enrutamiento.

```ts
// api-gateway/src/main.ts
app.use('/api/auth', createUsersProxy());
app.use('/api/clientes', jwtMiddleware, createUsersProxy());
app.use('/api/users', jwtMiddleware, createUsersProxy({ '^/api/users': '/api/clientes' }));

app.use('/api/movies', createMoviesProxy());
app.use('/api/admin/movies', createMoviesProxy());
app.use('/api/admin/cinemas', createMoviesProxy());
app.use('/api/admin/salas', createMoviesProxy());
app.use('/api/admin/funciones', createMoviesProxy());

app.use('/api/reservas', jwtMiddleware, createReservasProxy());
app.use('/api/payments', jwtMiddleware, createPaymentsProxy());
```

**Explicación:** el API Gateway funciona como puerta de entrada. Las rutas públicas, protegidas y administrativas pasan por el mismo punto de control. Para rutas administrativas o de control de accesos, se debe validar JWT y rol `Admin`.

---

## Users Service: identidad y roles

El Users Service se mantiene como dueño de la autenticación y emisión del JWT. Esto permite que otros servicios no tengan que manejar credenciales directamente.

```ts
// users-service/src/auth/auth.service.ts
sign(user: UserRecord): string {
  const payload = {
    sub: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);
}
```

**Explicación:** el token transporta identidad y rol. Esto permite que el API Gateway y los endpoints administrativos identifiquen si el usuario es cliente o administrador.

---

## Movies Service: cartelera, CSV y paginación

La carga CSV y la paginación se integran al Movies Service porque afectan directamente la administración y consulta de cartelera.

### Carga CSV

```ts
// movies-service/src/movies/admin/bulk-ingest/bulk.controller.ts
@Controller('api/admin/movies/bulk')
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadCsv(@UploadedFile() file: Express.Multer.File) {
    return this.bulkService.uploadCsv(file);
  }
}
```

**Justificación SOA:** el administrador entra por frontend/API Gateway, pero la lógica del CSV queda en el servicio dueño del dominio de películas.

### Paginación server-side

```ts
// movies-service/src/movies/movies.repository.ts
const sql = `
  SELECT
    p.id, p.titulo, p.sinopsis, p.duracion_min, p.clasificacion,
    p.poster_url, p.fecha_estreno, p.tipo, p.activa,
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

**Justificación SOA:** la paginación se ejecuta en el backend porque el Movies Service es dueño del catálogo. El frontend no necesita recibir todo el catálogo para paginarlo.

---

## Reservations Service: reservas y estado de asientos

El Reservations Service controla el estado de los asientos por función. Esto es crítico porque dos usuarios pueden intentar comprar el mismo asiento.

```ts
// reservas-service/src/reservas/services/reservas.service.ts
const asientos = await asientoRepoTx
  .createQueryBuilder('asiento')
  .setLock('pessimistic_write')
  .where('asiento.funcion_id_ref = :funcionId', { funcionId })
  .andWhere('asiento.id IN (:...ids)', { ids: asientosUnicos })
  .getMany();
```

**Justificación SOA:** el control de disponibilidad y concurrencia pertenece a Reservas/Asientos. En el control de accesos, cuando un boleto sea validado, el asiento puede pasar a `EN_USO`, pero esa responsabilidad sigue perteneciendo a este dominio.

---

## Payments Service: pagos, boletos e historial

El boleto digital se mantiene dentro del dominio de pagos porque nace como consecuencia de una compra exitosa y debe asociarse con reserva, asiento y pago.

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

**Justificación SOA:** el boleto usa referencias lógicas hacia reserva/asiento, pero no rompe la separación de bases de datos. Esto permite implementar historial, descarga y escaneo sin acoplar físicamente las bases de datos.

---

## RabbitMQ como comunicación crítica

RabbitMQ se mantiene para procesos de reserva, pago y emisión de boleto porque son operaciones que pueden tardar, fallar o requerir reproceso.

```ts
// reservas-service/src/reservas/services/reservas.service.ts
await this.publisher.publish('payment_process_queue', {
  reservaId: reserva.id,
  total: reserva.precioTotal,
});

await this.publisher.publish('ticket_issued_queue', {
  reservaId: reserva.id,
});
```

```ts
// payments-service/src/consumers/payment.consumer.ts
await this.channel.consume(
  RABBITMQ_QUEUES.PAYMENT_PROCESS,
  async (msg) => {
    const payload = JSON.parse(msg.content.toString()) as PaymentProcessMessage;

    await this.paymentsService.procesarPagoDesdeEvento({
      reservaId: payload.reservaId,
      usuarioId: payload.usuarioId,
      monto: payload.monto,
      moneda: payload.moneda ?? 'GTQ',
      metodoPago: payload.metodoPago,
    });

    this.channel?.ack(msg);
  },
  { noAck: false },
);
```

**Justificación SOA:** RabbitMQ reduce acoplamiento temporal. Reservas no necesita esperar directamente al servicio de pagos; publica un evento y el consumidor procesa el pago.

---

## Comunicación síncrona, asíncrona e infraestructura

| Tipo | Uso | Justificación |
|---|---|---|
| HTTP/REST | Login, cartelera, CSV, paginación, historial, descarga y escaneo. | Requiere respuesta inmediata al usuario o administrador. |
| RabbitMQ | Reserva, pago, resultado de pago y emisión de boleto. | Procesos críticos desacoplados y tolerantes a fallos. |
| Docker Compose | Entorno local/staging. | Permite levantar servicios coordinados. |
| K3s | Entorno release/cloud. | Orquesta servicios como unidades independientes. |
| Ingress | Entrada externa en K3s. | Expone frontend y API Gateway sin exponer servicios internos. |

---

## K3s del despliegue SOA

En el entorno release, cada servicio se despliega como Deployment independiente. Esto respeta la separación física de servicios.

```yaml
# Fase3/FilmStars/k3s/apps.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: movies-service
  namespace: filmstars
spec:
  replicas: 1
  strategy:
    type: RollingUpdate
  template:
    spec:
      containers:
        - name: movies-service
          image: ${ZOT_HOST}/filmstars/movies-service:${TAG}
          envFrom:
            - configMapRef: { name: filmstars-common }
            - configMapRef: { name: movies-config }
            - secretRef: { name: filmstars-secrets }
```

```yaml
# Fase3/FilmStars/k3s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: filmstars-ingress
  namespace: filmstars
spec:
  ingressClassName: traefik
  rules:
    - host: filmstars.${K3S_IP}.nip.io
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

**Justificación SOA:** el Ingress expone únicamente frontend y API Gateway. Los demás servicios se mantienen internos dentro del clúster.

---

## ConfigMaps y Secrets

```yaml
# Fase3/FilmStars/k3s/configmaps.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: filmstars-common
  namespace: filmstars
data:
  NODE_ENV: "production"
  DB_USER: "postgres"
  DB_PORT: "5432"
  JWT_EXPIRES_IN: "7d"
  RABBITMQ_HOST: "rabbitmq"
  RABBITMQ_PORT: "5672"
  USERS_SERVICE_URL: "http://users-service:3001"
  MOVIES_SERVICE_URL: "http://movies-service:3002"
  RESERVAS_SERVICE_URL: "http://reservations-service:3003"
  PAYMENTS_SERVICE_URL: "http://payments-service:3004"
```

```yaml
# Fase3/FilmStars/k3s/databases.yaml
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: filmstars-secrets
      key: DB_PASS
```

**Justificación SOA:** la configuración queda fuera del código. Los servicios reciben configuración por ConfigMaps y credenciales por Secrets, lo cual permite mantener el mismo código para varios entornos.

---

## Beneficios de la arquitectura 

| Beneficio | Explicación |
|---|---|
| Bajo acoplamiento | Cada servicio cambia por motivos propios. |
| Escalabilidad | Cartelera, reservas y pagos pueden escalarse de forma independiente. |
| Seguridad | API Gateway, JWT, roles y Secrets protegen rutas y credenciales. |
| Rendimiento | La paginación evita enviar todo el catálogo al frontend. |
| Administración eficiente | CSV permite carga masiva sin afectar otros servicios. |
| Trazabilidad | Pagos, boletos y eventos quedan registrados. |
| Tolerancia a fallos | RabbitMQ permite reproceso y desacoplamiento. |
| Despliegue controlado | Docker Hub/Zot y K3s despliegan artefactos probados. |
| Continuidad operativa | RollingUpdate y rollback reducen riesgo en release. |

---

## Terraform y Ansible como soporte del despliegue SOA

La arquitectura SOA necesita ambientes reproducibles. Si los servicios se despliegan manualmente, aumenta el riesgo de inconsistencias entre `develop`, `release` y los ambientes de prueba. Terraform define los recursos AWS y Ansible configura las instancias.

```hcl
# infrastructure/terraform/outputs.tf
output "develop_public_ip" {
  value = aws_instance.filmstars_develop.public_ip
}

output "release_public_ip" {
  value = aws_instance.filmstars_release.public_ip
}
```

```yaml
# infrastructure/ansible/inventory.ini
[develop]
develop-server ansible_host=${develop_public_ip} ansible_user=ubuntu

[release]
release-server ansible_host=${release_public_ip} ansible_user=ubuntu
```

**Justificación SOA:** Terraform crea infraestructura y sus outputs alimentan Ansible. Esto automatiza el entorno donde se ejecutan los servicios sin mezclar infraestructura con lógica de negocio.

---

## Observabilidad orientada a servicios

Cada servicio debe poder observarse de forma independiente. Esto permite saber si el problema está en `api-gateway`, `movies-service`, `reservations-service`, `payments-service`, RabbitMQ, Ingress o infraestructura.

```yaml
# k3s/monitoring/prometheus-config.yaml
scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:8080']

  - job_name: 'movies-service'
    static_configs:
      - targets: ['movies-service:3002']

  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq:15692']
```

**Justificación SOA:** Prometheus respeta la separación por servicio. No monitorea un monolito, sino componentes independientes.

---

## Grafana como vista operativa de la arquitectura

Grafana permite consolidar métricas de todos los servicios sin acoplarlos. El administrador puede ver en un solo dashboard la salud del sistema.

| Panel | Qué observa |
|---|---|
| CPU/RAM por pod | Consumo de recursos por servicio. |
| Estado de pods | Disponibilidad de cada componente. |
| RabbitMQ | Mensajes pendientes y estado de colas. |
| Ingress | Estado de entrada al sistema. |
| Boletos validados por minuto | Operación del módulo de control de accesos. |
| Errores por API | Salud de endpoints y servicios. |

---

## Conclusión

SOA sigue siendo adecuada para FilmStars porque permite agregar nuevas capacidades sin romper la arquitectura existente. La carga CSV y la paginación se integran en Movies Service; el historial, descarga y escaneo de boletos se apoyan en Payments Service; el estado de asientos permanece en Reservations Service; y el API Gateway mantiene seguridad y enrutamiento.

K3s fortalece esta arquitectura porque cada servicio se despliega como unidad independiente, con configuración externa, secretos protegidos, entrada controlada mediante Ingress y despliegues con RollingUpdate. Así, FilmStars conserva una solución modular, mantenible, escalable y preparada para crecimiento.

Terraform y Ansible garantizan que la infraestructura sea reproducible; K3s mantiene los servicios separados como deployments; Prometheus recolecta métricas por componente; y Grafana permite visualizar la salud general. Así, FilmStars no solo está dividido por dominios de negocio, sino también preparado para operar en un entorno cloud observable.


---