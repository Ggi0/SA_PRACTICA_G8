# FilmStars Backend - Usuarios y API Gateway

Implementacion correspondiente a Gestionar usuario / clientes y API Gateway.

## Stack

- TypeScript
- NestJS
- PostgreSQL con comunicacion directa usando `pg`
- JWT
- Docker Compose

No se usa ORM.

## Documentacion de diseno

- [Documentacion SOLID, decisiones tecnicas y despliegue](DOCUMENTACION_SOLID_ANGEL.md)
- [Guia base para servicios del equipo](GUIA_SERVICIOS_EQUIPO.md)
- [Pruebas con Postman](postman/README_POSTMAN.md)

## Servicios

| Servicio | Puerto | Descripcion |
| --- | --- | --- |
| API Gateway | 8080 | Punto de entrada unico implementado con NestJS |
| Users Service | 3001 | Autenticacion y gestion de clientes implementado con NestJS |
| PostgreSQL Users | 5433 | Base de datos de usuarios/clientes |

## Rutas via Gateway

| Metodo | Ruta | Protegida | Descripcion |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | No | Registro de cliente |
| POST | `/api/auth/login` | No | Login y emision de JWT |
| GET | `/api/clientes/me` | Si | Perfil del cliente autenticado |
| GET | `/api/clientes` | Si | Listar clientes |
| GET | `/api/clientes/:id` | Si | Consultar cliente por ID |
| POST | `/api/clientes` | Si | Crear cliente |
| PUT | `/api/clientes/:id` | Si | Actualizar cliente |
| PATCH | `/api/clientes/:id/status` | Si | Activar/desactivar cliente |
| PATCH | `/api/clientes/:id/password` | Si | Cambiar contrasena |
| DELETE | `/api/clientes/:id` | Si | Eliminacion logica |

Tambien se mantiene alias `/api/users` para compatibilidad con la guia.

## Levantar con Docker

```bash
docker compose up --build
```

## Credenciales iniciales

Al iniciar, si no existe ningun administrador se crea:

- Email: `admin@filmstars.com`
- Password: `admin12345`
