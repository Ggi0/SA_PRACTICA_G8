# Base de datos

Carpeta reservada para scripts SQL, esquemas y documentacion de bases de datos.

| Servicio | Base sugerida | Estado |
| --- | --- | --- |
| Usuarios | `filmstars_users` | Implementada en `docker-compose.yml` |
| Peliculas / Cartelera | `filmstars_movies` | Pendiente |
| Reservas / Asientos | `filmstars_reservations` | Pendiente |
| Pagos | `filmstars_payments` | Pendiente |

La base de usuarios se crea automaticamente desde `users-service` usando SQL directo con `pg`, sin ORM.
