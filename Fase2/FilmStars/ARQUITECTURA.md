# FilmStars — Arquitectura del Sistema

Sistema de reserva de entradas de cine construido con arquitectura SOA (Service-Oriented Architecture). Práctica 2 — Software Avanzado, USAC.

---

## Visión general

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│              React + Vite + TypeScript                      │
│                   http://localhost:5173                     │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP (Axios)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                            │
│                NestJS — puerto 8080                         │
│          Proxy + Validación JWT + CORS                      │
└────────────┬──────────────────────────┬─────────────────────┘
             │                          │
             ▼                          ▼
┌────────────────────┐      ┌─────────────────────┐
│   users-service    │      │   movies-service     │
│  NestJS — p. 3001  │      │  NestJS — p. 3002    │
│  Auth + Usuarios   │      │  Películas + Cines   │
│  PostgreSQL :5433  │      │  PostgreSQL :5434    │
└────────────────────┘      └─────────────────────┘
                                        
             ┌──────────────────────────────────────┐
             │             RabbitMQ                 │
             │    imagen Docker — puertos 5672/15672 │
             │     5 colas para flujo asíncrono      │
             └──────────────────────────────────────┘

  (pendientes de implementación)
┌────────────────────┐      ┌─────────────────────┐
│reservations-service│      │   payments-service   │
│  NestJS — p. 3003  │      │  NestJS — p. 3004    │
│  Reservas + Asient.│      │  Pagos + Boletos     │
│  PostgreSQL :5435  │      │  PostgreSQL :5436    │
└────────────────────┘      └─────────────────────┘
```

---

## Servicios implementados

### API Gateway (`api-gateway/`) — Puerto 8080

Punto de entrada único para el frontend. No tiene lógica de negocio: solo enruta, valida JWT y habilita CORS.

**Rutas públicas** (sin autenticación):

| Método | Ruta | Destino |
|--------|------|---------|
| POST | `/api/auth/register` | users-service |
| POST | `/api/auth/login` | users-service |
| GET | `/api/movies/*` | movies-service |

**Rutas protegidas** (requieren `Authorization: Bearer <token>`):

| Método | Ruta | Destino |
|--------|------|---------|
| GET/PUT/DELETE | `/api/clientes/*` | users-service |
| GET/PUT/DELETE | `/api/users/*` | users-service (reescrito a `/api/clientes`) |

Cuando el JWT es válido, el gateway reenvía la identidad del usuario al servicio destino mediante headers:
- `X-User-Id`
- `X-User-Email`
- `X-User-Nombre`
- `X-User-Rol`

---

### users-service (`users-service/`) — Puerto 3001

Gestiona autenticación y usuarios. Base de datos: `filmstars_users` (PostgreSQL puerto 5433).

**Endpoints de autenticación:**

```
POST /api/auth/register
Body: { nombre, email, password }
Response: { access_token, token_type, expires_in, user }

POST /api/auth/login
Body: { email, password }
Response: { access_token, token_type, expires_in, user }
```

**JWT generado:**
```json
{
  "sub": "<userId>",
  "email": "usuario@email.com",
  "nombre": "Nombre Usuario",
  "rol": "customer | admin"
}
```

**Seguridad:**
- Contraseñas hasheadas con `bcryptjs`
- Tokens firmados con `jsonwebtoken` (expiración: 24h)
- Usuario admin por defecto: `admin@filmstars.com` / `admin12345`

**Tablas en DB:**
- `usuario` — datos del usuario + hash de contraseña + rol
- `sesion` — registro de sesiones activas

---

### movies-service (`movies-service/`) — Puerto 3002

Gestiona la cartelera: ciudades, cines, películas y funciones. Base de datos: `filmstars_movies` (PostgreSQL puerto 5434).

**Endpoints:**

```
GET  /api/movies/cities
     → Lista todas las ciudades activas

GET  /api/movies/cities/:cityId/theaters
     → Lista los cines de una ciudad

GET  /api/movies
GET  /api/movies?category=ESTRENO
GET  /api/movies?category=PRE_VENTA
GET  /api/movies?category=RE_ESTRENO
     → Lista películas activas (opcionalmente filtradas por categoría)

GET  /api/movies/:id
     → Detalle de una película (incluye géneros)

GET  /api/movies/:movieId/functions
GET  /api/movies/:movieId/functions?cityId=<id>
     → Funciones de una película (opcionalmente filtradas por ciudad)

GET  /api/movies/functions/:id
     → Detalle de una función específica
```

**Tablas en DB:**
- `ciudad` — ciudades donde hay cines
- `cine` — cines por ciudad
- `sala` — salas dentro de cada cine
- `asiento` — asientos por sala
- `pelicula` — películas con tipo (ESTRENO / PREVENTA / REESTRENO)
- `genero` + `pelicula_genero` — géneros (relación N:M)
- `funcion` — horarios: vincula película + sala + precio base + fecha/hora

**Datos de prueba (seed):**
- 2 ciudades: Ciudad de Guatemala, Quetzaltenango
- 3 cines: FilmStars Oakland Mall, FilmStars Miraflores, FilmStars Xela
- 3 películas: "Guardianes del Cine" (ESTRENO), "La Última Función" (PREVENTA), "Risas de Medianoche" (REESTRENO)

---

## Principios SOLID aplicados en movies-service

### S — Single Responsibility
Cada dominio tiene su propio módulo independiente con controller, service y repository separados:
- `CitiesModule` → solo ciudades
- `TheatersModule` → solo cines
- `MoviesModule` → solo películas
- `FunctionsModule` → solo funciones/horarios

### O — Open/Closed (Patrón Strategy para precios)
Los tipos de película tienen estrategias de precio intercambiables. Para agregar un nuevo tipo, solo se implementa `IMoviePriceStrategy` sin modificar código existente:

```
IMoviePriceStrategy
├── EstrenoPriceStrategy    → precio × 1.00  (sin cambio)
├── PreventaPriceStrategy   → precio × 1.10  (+10% por acceso anticipado)
└── ReestrenoPriceStrategy  → precio × 0.85  (-15% de descuento)
```

### L — Liskov Substitution
Todas las estrategias de precio implementan `IMoviePriceStrategy` y son intercambiables sin alterar el comportamiento del sistema.

### I — Interface Segregation
Cada repositorio expone solo los métodos que su dominio necesita:
- `ICitiesRepository`: `findAll()`, `findById()`
- `ITheatersRepository`: `findByCityId()`, `findById()`
- `IMoviesRepository`: `findAll(filters)`, `findById()`
- `IFunctionsRepository`: `findAll(filters)`, `findById()`

### D — Dependency Inversion
Los controllers inyectan interfaces (tokens `Symbol`), no clases concretas. Los módulos registran las implementaciones en el contenedor de NestJS:

```typescript
// El controller depende del token, no de la clase
constructor(@Inject(MOVIES_SERVICE) private readonly movies: IMoviesService) {}

// El módulo vincula token → clase concreta
{ provide: MOVIES_SERVICE, useClass: MoviesService }
```

---

## Frontend (`client/`) — Puerto 5173

React 18 + Vite + TypeScript. Se comunica exclusivamente con el API Gateway en `http://localhost:8080`.

**Páginas:**

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | HomePage | Cartelera con filtros por categoría y selector de ciudad |
| `/login` | LoginPage | Inicio de sesión |
| `/register` | RegisterPage | Registro de nuevo usuario |
| `/movies/:movieId` | MovieDetailPage | Detalle de película + selector de función |
| `/seats/:showtimeId` | SeatsPage | Mapa de asientos |
| `/checkout` | CheckoutPage | Formulario de pago |
| `/confirmation` | ConfirmationPage | Boleto emitido |

**Servicios API:**

| Archivo | Conectado a |
|---------|-------------|
| `authService.ts` | users-service (vía gateway) — real |
| `moviesService.ts` | movies-service (vía gateway) — real |
| `reservationService.ts` | reservations-service — mock temporal |
| `paymentsService.ts` | payments-service — mock temporal |

**Estado global:**
- `AuthContext` — sesión del usuario, token JWT, persiste en `localStorage`
- `checkoutStore` (Zustand) — flujo de compra: ciudad → película → función → asientos → pago → boleto

**Server state:**
- React Query con caché: ciudades (1h), cines (30min), películas (5min), asientos (refresca cada 15s)

---

## RabbitMQ — Mensajería asíncrona

Ver detalles completos en [`rabbitmq/README.md`](rabbitmq/README.md).

Corre como imagen Docker `rabbitmq:3-management`. Las 5 colas definidas para el flujo de reservas:

| Cola | Propósito |
|------|-----------|
| `seat_hold_queue` | Bloqueo temporal de asientos (TTL: 10 min) |
| `seat_release_queue` | Liberación de asientos bloqueados |
| `payment_process_queue` | Solicitud de procesamiento de pago |
| `payment_result_queue` | Resultado del pago (aprobado/rechazado) |
| `ticket_issued_queue` | Notificación de boleto emitido |

---

## Bases de datos

Cada servicio tiene su propia base de datos PostgreSQL (patron Database per Service):

| DB | Puerto | Servicio dueño |
|----|--------|----------------|
| `filmstars_users` | 5433 | users-service |
| `filmstars_movies` | 5434 | movies-service |
| `filmstars_reservations` | 5435 | reservations-service |
| `filmstars_payments` | 5436 | payments-service |

Los scripts de inicialización están en `database/sql/<servicio>/init.sql` y los datos semilla en `seed.sql`.

---

## Cómo levantar el sistema

### Requisitos
- Docker Desktop instalado y corriendo
- Node.js 20+ (solo si se quiere correr el frontend en local)

### Backend completo (todos los servicios)

```bash
cd Fase2/FilmStars
docker-compose up --build
```

Esto levanta: 4 bases de datos PostgreSQL + RabbitMQ + users-service + movies-service + api-gateway.

### Frontend

```bash
cd Fase2/client
npm install
npm run dev
```

Abrir http://localhost:5173

### Verificar que todo esté corriendo

```
GET http://localhost:8080/health     → api-gateway
GET http://localhost:3001/health     → users-service
GET http://localhost:3002/health     → movies-service
http://localhost:15672               → RabbitMQ Management UI
```

---

## División de trabajo

| Integrante | Responsabilidad |
|---|---|
| Angel | users-service + api-gateway |
| Pablo | movies-service + configuración RabbitMQ Docker |
| Gio | reservations-service + payments-service |
| Maria | Esquemas SQL de todas las bases de datos |
| Naomi + Maria | Frontend (estructura + integración) |
