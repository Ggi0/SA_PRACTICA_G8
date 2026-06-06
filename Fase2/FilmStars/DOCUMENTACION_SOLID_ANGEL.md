# Documentacion SOLID - Gestion de Usuarios y API Gateway

Responsable: Angel Mendoza

## Alcance implementado

- Servicio de usuarios/clientes.
- Modulo de autenticacion y sesion con JWT.
- API Gateway como punto de entrada unico.
- Persistencia en PostgreSQL usando comunicacion directa con `pg`.
- Contenedores Docker para `api-gateway`, `users-service` y `db-users`.

## S - Single Responsibility Principle

### Donde se aplico

- `users-service/src/users/users.controller.ts`
- `users-service/src/users/user.service.ts`
- `users-service/src/users/user.repository.ts`
- `users-service/src/auth/auth.service.ts`
- `api-gateway/src/main.ts`

### Como se aplico

- `UsersController` solo recibe peticiones HTTP, valida permisos y delega operaciones.
- `UserService` contiene reglas de negocio de clientes: validaciones, contrasenas, estados y soft delete.
- `UserRepository` contiene exclusivamente consultas SQL directas hacia PostgreSQL.
- `AuthService` solo gestiona registro, login, verificacion de credenciales y firma de JWT.
- `api-gateway/src/main.ts` solo valida JWT y reenvia peticiones al servicio correspondiente.

### Por que se aplico

Separar responsabilidades evita que cambios en HTTP, reglas de negocio o SQL afecten varias capas al mismo tiempo.

## O - Open/Closed Principle

### Donde se aplico

- `users-service/src/users/user.repository.ts`
- `users-service/src/users/user.service.ts`
- `users-service/src/common/tokens.ts`

### Como se aplico

El servicio depende de la abstraccion `IUserRepository`, registrada mediante tokens de inyeccion (`USER_REPOSITORY`, `USER_SERVICE`). Si se desea cambiar la persistencia, se puede crear otra implementacion del repositorio sin modificar el controlador.

### Por que se aplico

Permite extender la persistencia o reglas de negocio sin reescribir las capas superiores.

## L - Liskov Substitution Principle

### Donde se aplico

- `users-service/src/users/user.repository.ts`
- `users-service/src/users/user.service.ts`

### Como se aplico

`UserRepository` cumple el contrato `IUserRepository` y `UserService` cumple `IUserService`. Cualquier clase que implemente esos contratos puede sustituir la implementacion actual si conserva las mismas entradas y salidas.

### Por que se aplico

Permite sustituir implementaciones sin romper el comportamiento del sistema.

## I - Interface Segregation Principle

### Donde se aplico

- `users-service/src/users/user.repository.ts`
- `users-service/src/users/user.service.ts`

### Como se aplico

Los contratos separan la logica de persistencia (`IUserRepository`) de la logica de negocio (`IUserService`). Los controladores no dependen de metodos SQL ni de detalles de base de datos.

### Por que se aplico

Evita acoplar controladores con metodos que no usan y facilita pruebas unitarias por capa.

## D - Dependency Inversion Principle

### Donde se aplico

- `users-service/src/users/users.module.ts`
- `users-service/src/app.bootstrap.ts`
- `users-service/src/auth/auth.service.ts`
- `users-service/src/users/user.service.ts`

### Como se aplico

NestJS inyecta dependencias mediante providers y tokens:

- `USER_REPOSITORY` -> `UserRepository`
- `USER_SERVICE` -> `UserService`
- `PG_POOL` -> pool de PostgreSQL

Ninguna capa de alto nivel instancia manualmente sus dependencias con `new`.

### Por que se aplico

Disminuye el acoplamiento y permite reemplazar implementaciones o simular dependencias en pruebas.

## Decisiones tecnicas

| Decision | Que | Por que | Para que |
| --- | --- | --- | --- |
| Lenguaje | TypeScript | Tipado fuerte y compatibilidad con Node.js | Reducir errores y mantener codigo claro |
| Framework | NestJS | Estructura modular, DI nativa y soporte para servicios SOA | Alinear con la decision del grupo y escalar por servicios |
| Base de datos | PostgreSQL | Base relacional robusta y permitida por el enunciado | Persistir usuarios/clientes de forma independiente |
| Acceso a datos | `pg` directo | El requisito individual pidio no usar ORM | Tener control directo sobre SQL y evitar dependencia de ORM |
| Autenticacion | JWT | Requisito del PDF para claims de usuario | Proteger rutas y transportar ID/nombre/rol |
| Contenedores | Docker Compose | Requisito DevOps del PDF | Levantar BD, servicio y gateway con un comando |

## Despliegue con contenedores

Archivo principal: `Fase2/FilmStars/docker-compose.yml`

| Contenedor | Puerto | Funcion |
| --- | --- | --- |
| `filmstars-api-gateway` | `8080` | Punto de entrada unico |
| `filmstars-users-service` | `3001` | Servicio SOA de usuarios/clientes |
| `filmstars-db-users` | `5433 -> 5432` | PostgreSQL independiente del dominio Usuario |

Comando:

```bash
docker compose up --build
```

## Evidencia funcional validada

- Health del Gateway: `GET /health`.
- Health de Users Service: `GET /health`.
- Login de administrador semilla: `POST /api/auth/login`.
- Ruta protegida sin token devuelve `401`.
- Perfil autenticado: `GET /api/clientes/me`.
- CRUD de cliente por Gateway: crear, listar, consultar, actualizar, activar/desactivar y eliminar logicamente.
- Alias de guia: `/api/users` funciona como alias de `/api/clientes`.
