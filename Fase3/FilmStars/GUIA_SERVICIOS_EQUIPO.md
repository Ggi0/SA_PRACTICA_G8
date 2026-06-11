# Guia base de servicios FilmStars

Este archivo resume como usar la parte ya implementada de usuarios/API Gateway y que deberia ir en cada servicio pendiente, segun la matriz oficial compartida por el equipo.

## Matriz oficial de servicios del equipo

| Area | Funciones SOA |
| --- | --- |
| Servicio de Usuario | Gestionar usuario / API Gateway |
| Servicio de Peliculas / Cartelera | Seleccionar ciudad, ver cines, ver funciones, ver peliculas, ver estrenos, ver preventas, ver reestrenos |
| Servicio de Reservas / Asientos | Consultar mapa de asientos, ver disponibilidad de asientos, bloquear asiento temporalmente, liberar asiento vencido, confirmar reserva |
| Servicio de Pagos | Procesar pago, registrar transaccion |
| RabbitMQ | Comunicacion asincrona |
| Base de datos | Esquemas y almacenamiento por dominio |
| Front | Frontend React + Vite integrado con APIs |
| Esquema back | Estructura base del backend SOA |

## Estado actual implementado


La parte ya esta funcional:

- `api-gateway`: punto de entrada unico del backend.
- `users-service`: autenticacion, sesion JWT y gestion de clientes.
- `db-users`: base de datos PostgreSQL propia del dominio Usuario.

Stack actual:

- Node.js + TypeScript
- NestJS
- PostgreSQL
- JWT
- Docker Compose
- Acceso directo a base de datos con `pg`, sin ORM

## Como levantar la parte actual

Desde `Fase2/FilmStars`:

```bash
docker compose up --build -d
```

Verificar contenedores:

```bash
docker compose ps
```

Apagar:

```bash
docker compose down
```

Apagar y borrar volumen de BD:

```bash
docker compose down -v
```

## Credenciales iniciales

El servicio crea un admin inicial si no existe:

- Email: `admin@filmstars.com`
- Password: `admin12345`

## Rutas disponibles de usuarios/clientes

Todas las rutas pasan por el API Gateway en el puerto `8080`.

| Metodo | Ruta | Protegida | Descripcion |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | No | Registro de cliente |
| POST | `/api/auth/login` | No | Login y retorno de JWT |
| GET | `/api/clientes/me` | Si | Perfil del usuario autenticado |
| GET | `/api/clientes` | Si, admin | Listar clientes |
| GET | `/api/clientes/:id` | Si | Consultar cliente por ID |
| PUT | `/api/clientes/:id` | Si | Actualizar cliente |
| PATCH | `/api/clientes/:id/status` | Si, admin | Activar/desactivar cliente |
| PATCH | `/api/clientes/:id/password` | Si | Cambiar contrasena |
| DELETE | `/api/clientes/:id` | Si, admin | Eliminacion logica |

Tambien existe alias compatible con la guia original:

- `/api/users` -> `/api/clientes`

## Como consumir rutas protegidas

1. Login:

```bash
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "admin@filmstars.com",
  "password": "admin12345"
}
```

2. Enviar el token recibido en rutas protegidas:

```http
Authorization: Bearer <token>
```

## Headers que inyecta el API Gateway

Despues de validar el JWT, el Gateway reenvia informacion del usuario autenticado a los servicios internos mediante headers:

- `X-User-Id`
- `X-User-Email`
- `X-User-Nombre`
- `X-User-Rol`

Los otros servicios pueden leer estos headers para saber quien hizo la peticion sin volver a validar el JWT.

## Estructura sugerida para nuevos servicios NestJS

Cada servicio deberia seguir una estructura parecida:

```text
servicio/
├── Dockerfile
├── package.json
├── tsconfig.json
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── config/
    ├── database/
    ├── common/
    └── modulo-dominio/
        ├── dto/
        ├── controllers/
        ├── services/
        ├── repositories/
        ├── interfaces/
        └── types o entities/
```

Se recomienda mantener acceso a BD separado en repositorios y reglas de negocio separadas en servicios.

## Servicio de Usuario



Carpetas base:

- `api-gateway`
- `users-service`

Funciones cubiertas:

- Gestionar usuario.
- API Gateway.
- Registro de usuarios/clientes.
- Inicio de sesion.
- Emision de JWT.
- Validacion de rutas protegidas.
- Gestion completa de clientes.

La parte ya esta implementada y probada.

## Servicio de Peliculas / Cartelera



Carpeta base: `movies-service`.

Debe encargarse de:

- Seleccionar ciudad.
- Ver cines.
- Ver funciones.
- Ver peliculas.
- Ver estrenos.
- Ver preventas.
- Ver reestrenos.

Rutas sugeridas via Gateway:

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/movies/cities` | Listar ciudades disponibles |
| GET | `/api/movies/cities/:cityId/theaters` | Cines por ciudad |
| GET | `/api/movies` | Peliculas en cartelera |
| GET | `/api/movies?category=estreno` | Peliculas por categoria |
| GET | `/api/movies/:id` | Detalle de pelicula |
| GET | `/api/movies/:id/functions` | Funciones de una pelicula |

Debe tener su propia BD, por ejemplo `db-movies`.

## Servicio de Reservas / Asientos



Carpeta base: `reservations-service`.

Debe encargarse de:

- Consultar mapa de asientos.
- Ver disponibilidad de asientos.
- Bloquear asiento temporalmente.
- Liberar asiento vencido.
- Confirmar reserva.
- Consumir eventos asincronos donde corresponda.

Rutas sugeridas via Gateway:

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/reservations/functions/:functionId/seats` | Mapa de asientos |
| POST | `/api/reservations/hold` | Bloquear asientos temporalmente |
| POST | `/api/reservations/release` | Liberar reserva temporal |
| POST | `/api/reservations/confirm` | Confirmar reserva |
| GET | `/api/reservations/me` | Reservas del usuario autenticado |

Debe usar RabbitMQ para los procesos criticos de concurrencia y su propia BD, por ejemplo `db-reservations`.

## Servicio de Pagos



Carpeta base: `payments-service`.

Debe encargarse de:

- Procesar pago simulado.
- Registrar transaccion.
- Publicar/consumir eventos relacionados con pago confirmado o rechazado.
- Mantener integridad de transacciones ante fallos.

Rutas sugeridas via Gateway:

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/api/payments/process` | Procesar pago |
| GET | `/api/payments/:id` | Consultar pago |
| GET | `/api/payments/me` | Historial de pagos del usuario |

Debe usar RabbitMQ y su propia BD, por ejemplo `db-payments`.

## Base de datos



Carpeta base: `database`.

Debe encargarse de:

- Definir scripts SQL o documentacion de esquemas por dominio.
- Mantener consistencia entre el diagrama ER y las tablas reales.
- Preparar bases separadas para cada servicio SOA.

Bases sugeridas:

| Servicio | Base sugerida | Puerto externo sugerido |
| --- | --- | --- |
| Usuarios | `filmstars_users` | `5433` |
| Peliculas / Cartelera | `filmstars_movies` | `5434` |
| Reservas / Asientos | `filmstars_reservations` | `5435` |
| Pagos | `filmstars_payments` | `5436` |

La base de usuarios ya esta implementada en `docker-compose.yml` como `db-users`.

## RabbitMQ

Carpeta base sugerida: `rabbitmq`.

Debe agregarse al `docker-compose.yml` cuando se implementen reservas y pagos.

Colas sugeridas:

- `seat_hold_queue`
- `seat_release_queue`
- `payment_process_queue`
- `payment_result_queue`
- `ticket_issued_queue`

## Frontend



Carpeta base: `frontend`.

Stack definido por el grupo:

- React
- Vite
- Axios

Debe consumir el Gateway, no los servicios internos directamente.

URL base sugerida:

```text
http://localhost:8080
```

El frontend debe guardar el JWT recibido en login y enviarlo en:

```http
Authorization: Bearer <token>
```

## Esquema back



Carpeta base: `esquema-back`.

Debe servir como referencia de estructura para que los demas servicios sigan el mismo patron:

- NestJS por servicio.
- Dockerfile por servicio.
- `src/config` para variables y configuracion.
- `src/database` para conexion directa a PostgreSQL.
- `src/common` para utilidades compartidas dentro del servicio.
- carpetas por dominio con `controllers`, `services`, `repositories`, `dto` e `interfaces`.
- comunicacion entre servicios mediante API Gateway y, donde aplique, RabbitMQ.

## Pendiente para integracion completa

- Agregar `movies-service` al `docker-compose.yml` cuando se implemente cartelera.
- Agregar `reservations-service` al `docker-compose.yml` cuando se implemente reservas/asientos.
- Agregar `payments-service` al `docker-compose.yml` cuando se implementen pagos.
- Agregar bases de datos separadas para peliculas, reservas y pagos.
- Agregar RabbitMQ y colas.
- Integrar frontend React + Vite con Gateway.
- Actualizar diagramas/documentacion general del equipo.
