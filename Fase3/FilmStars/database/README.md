# Base de datos

Esta carpeta contiene los scripts SQL utilizados para inicializar las bases de datos del sistema **FilmStars**.

El sistema utiliza una arquitectura orientada a servicios, por lo que cada dominio principal cuenta con su propia base de datos independiente.

| Servicio              | Base de datos            | Puerto local | Estado       |
| --------------------- | ------------------------ | -----------: | ------------ |
| Usuarios              | `filmstars_users`        |       `5433` | Implementada |
| Películas / Cartelera | `filmstars_movies`       |       `5434` | Implementada |
| Reservas / Asientos   | `filmstars_reservations` |       `5435` | Implementada |
| Pagos                 | `filmstars_payments`     |       `5436` | Implementada |

## Estructura de carpetas

```txt
database/
│
├── README.md
│
└── sql/
    ├── users/
    │   └── init.sql
    │
    ├── movies/
    │   ├── init.sql
    │   └── seed.sql
    │
    ├── reservations/
    │   ├── init.sql
    │   └── seed.sql
    │
    └── payments/
        └── init.sql
```

## Descripción de bases de datos

### DB Usuarios

Base de datos utilizada por el servicio de usuarios.

| Tabla     | Descripción                                                                         |
| --------- | ----------------------------------------------------------------------------------- |
| `usuario` | Almacena la información de los usuarios registrados en la plataforma.               |
| `sesion`  | Almacena información relacionada con sesiones o tokens generados para los usuarios. |

### DB Películas / Cartelera

Base de datos utilizada por el servicio de películas y cartelera.

| Tabla             | Descripción                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `ciudad`          | Almacena las ciudades disponibles.                                          |
| `cine`            | Almacena los cines disponibles por ciudad.                                  |
| `sala`            | Almacena las salas existentes dentro de cada cine.                          |
| `asiento`         | Almacena los asientos físicos de cada sala.                                 |
| `genero`          | Almacena los géneros de películas.                                          |
| `pelicula`        | Almacena la información principal de las películas.                         |
| `pelicula_genero` | Relaciona películas con géneros.                                            |
| `funcion`         | Almacena las funciones programadas de cada película en una sala específica. |

Esta base cuenta con un archivo `seed.sql` que inserta datos iniciales de prueba para ciudades, cines, salas, asientos, géneros, películas y funciones.

### DB Reservas / Asientos

Base de datos utilizada por el servicio de reservas y asientos.

| Tabla                    | Descripción                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| `reserva`                | Almacena las reservas realizadas por los usuarios.                      |
| `estado_asiento_funcion` | Almacena el estado de cada asiento para una función específica.         |
| `reserva_asiento`        | Relaciona una reserva con los asientos seleccionados.                   |
| `mensajeria`             | Registra eventos relacionados con reservas para comunicación asíncrona. |

Esta base utiliza referencias externas como `usuario_id_ref`, `funcion_id_ref` y `asiento_id_ref`, ya que esos datos pertenecen a otros servicios. No se implementan llaves foráneas físicas entre bases de datos distintas.

Esta base cuenta con un archivo `seed.sql` que inicializa asientos disponibles para funciones específicas.

### DB Pagos

Base de datos utilizada por el servicio de pagos.

| Tabla          | Descripción                                                                    |
| -------------- | ------------------------------------------------------------------------------ |
| `pago`         | Almacena los pagos simulados realizados por los usuarios.                      |
| `detalle_pago` | Almacena el detalle de los pagos realizados.                                   |
| `boleto`       | Almacena los boletos emitidos después de una compra exitosa.                   |
| `reembolso`    | Almacena información relacionada con posibles reembolsos.                      |
| `mensajeria`   | Registra eventos relacionados con pagos y boletos para comunicación asíncrona. |

Esta base utiliza referencias externas como `reserva_id_ref`, `usuario_id_ref` y `reserva_asiento_id_ref`, ya que esos datos pertenecen a otros servicios.

## Levantar bases de datos y RabbitMQ

Para levantar únicamente las bases de datos y RabbitMQ, ejecutar desde la raíz del proyecto:

```powershell
docker compose up -d db-users db-movies db-reservations db-payments rabbitmq
```

Para verificar que los contenedores estén activos:

```powershell
docker ps
```

Contenedores esperados:

| Contenedor                  | Descripción                           |
| --------------------------- | ------------------------------------- |
| `filmstars-db-users`        | Base de datos de usuarios.            |
| `filmstars-db-movies`       | Base de datos de películas/cartelera. |
| `filmstars-db-reservations` | Base de datos de reservas/asientos.   |
| `filmstars-db-payments`     | Base de datos de pagos.               |
| `filmstars-rabbitmq`        | Broker de mensajería RabbitMQ.        |

## Validar tablas creadas

### DB Usuarios

```powershell
docker exec -it filmstars-db-users psql -U postgres -d filmstars_users -c "\dt"
```

Tablas:

```txt
usuario
sesion
```

### DB Películas / Cartelera

```powershell
docker exec -it filmstars-db-movies psql -U postgres -d filmstars_movies -c "\dt"
```

Tablas:

```txt
ciudad
cine
sala
asiento
genero
pelicula
pelicula_genero
funcion
```

### DB Reservas / Asientos

```powershell
docker exec -it filmstars-db-reservations psql -U postgres -d filmstars_reservations -c "\dt"
```

Tablas:

```txt
reserva
estado_asiento_funcion
reserva_asiento
mensajeria
```

### DB Pagos

```powershell
docker exec -it filmstars-db-payments psql -U postgres -d filmstars_payments -c "\dt"
```

Tablas:

```txt
pago
detalle_pago
boleto
reembolso
mensajeria
```

## Validar datos iniciales

### Consultar películas registradas

```powershell
docker exec -it filmstars-db-movies psql -U postgres -d filmstars_movies -c "SELECT titulo, tipo FROM pelicula;"
```

### Consultar cines registrados

```powershell
docker exec -it filmstars-db-movies psql -U postgres -d filmstars_movies -c "SELECT nombre FROM cine;"
```

### Consultar cantidad de asientos por función

```powershell
docker exec -it filmstars-db-reservations psql -U postgres -d filmstars_reservations -c "SELECT funcion_id_ref, COUNT(*) AS total_asientos FROM estado_asiento_funcion GROUP BY funcion_id_ref;"
```

### Consultar mapa de asientos de una función

```powershell
docker exec -it filmstars-db-reservations psql -U postgres -d filmstars_reservations -c "SELECT codigo_asiento, fila, numero, estado FROM estado_asiento_funcion WHERE funcion_id_ref = '77777777-7777-7777-7777-777777777771' ORDER BY fila, numero;"
```

## Acceso a RabbitMQ

RabbitMQ se encuentra disponible en:

```txt
http://localhost:15672
```

Credenciales:

| Usuario | Contraseña |
| ------- | ---------- |
| `admin` | `admin123` |

## Nota arquitectónica

Debido a que FilmStars utiliza Arquitectura Orientada a Servicios, cada servicio posee su propia base de datos.

Las relaciones entre servicios no se implementan mediante llaves foráneas físicas, sino mediante referencias externas y eventos de mensajería.

Las llaves foráneas se mantienen únicamente dentro de cada base de datos individual.

| Campo                    | Significado                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| `usuario_id_ref`         | Referencia lógica al usuario registrado en el servicio de usuarios.               |
| `funcion_id_ref`         | Referencia lógica a una función registrada en el servicio de películas/cartelera. |
| `asiento_id_ref`         | Referencia lógica a un asiento registrado en el servicio de películas/cartelera.  |
| `reserva_id_ref`         | Referencia lógica a una reserva registrada en el servicio de reservas/asientos.   |
| `reserva_asiento_id_ref` | Referencia lógica a un asiento reservado en el servicio de reservas/asientos.     |
