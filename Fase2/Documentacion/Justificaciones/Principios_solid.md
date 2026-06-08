# Principios SOLID aplicados en FilmStars

## S — Single Responsibility Principle

**Principio:** cada clase, módulo o componente debe tener una sola responsabilidad y una única razón para cambiar.

| Servicio | Dónde se aplicó | Cómo se aplicó | Por qué se aplicó |
|---|---|---|---|
| API Gateway | `api-gateway/src/main.ts` | El gateway se encarga únicamente de recibir peticiones, validar JWT en rutas protegidas y redirigir tráfico a los servicios internos. No contiene lógica de negocio de usuarios ni cartelera. | Permite centralizar entrada y seguridad sin mezclar reglas de negocio. |
| Users Service | `users-service/src/auth/auth.controller.ts` | El controlador solo recibe peticiones HTTP de registro/login y delega la lógica a `AuthService`. | Evita que el controlador tenga lógica de autenticación, cifrado o consulta a base de datos. |
| Users Service | `users-service/src/auth/auth.service.ts` | El servicio se enfoca en autenticación, validación de credenciales y emisión de JWT. | Mantiene separada la autenticación de la gestión general de usuarios. |
| Users Service | `users-service/src/users/user.service.ts` | Contiene reglas de negocio de usuarios: crear, listar, actualizar, cambiar contraseña y desactivar. | Centraliza la lógica de usuario sin mezclar SQL directo. |
| Users Service | `users-service/src/users/user.repository.ts` | Se encarga de ejecutar consultas SQL contra PostgreSQL. | Separa persistencia de lógica de negocio. |
| Movies Service | `movies-service/src/cities/*` | Las clases de cities manejan únicamente ciudades. | Facilita mantenimiento de ciudad sin afectar películas, cines o funciones. |
| Movies Service | `movies-service/src/theaters/*` | Las clases de theaters manejan únicamente cines. | Evita mezclar consulta de cines con películas o funciones. |
| Movies Service | `movies-service/src/movies/*` | Las clases de movies manejan películas y categorías. | Mantiene aislada la lógica de cartelera. |
| Movies Service | `movies-service/src/functions/*` | Las clases de functions manejan funciones/horarios. | Permite modificar horarios sin afectar la consulta de películas. |

**Ejemplo:**

```ts
// movies-service/src/cities/cities.controller.ts
@Controller('api/movies/cities')
export class CitiesController {
  constructor(@Inject(CITIES_SERVICE) private readonly cities: ICitiesService) {}
}
```

El controlador solo maneja HTTP; la lógica queda en el servicio y las consultas en el repositorio.

---

## O — Open/Closed Principle

**Principio:** el software debe estar abierto para extensión, pero cerrado para modificación.

| Servicio | Dónde se aplicó | Cómo se aplicó | Por qué se aplicó |
|---|---|---|---|
| Movies Service | `movies-service/src/movies/price-strategy/movie-price.strategy.ts` | Se creó la interfaz `IMoviePriceStrategy`. | Permite agregar nuevas reglas de precio sin modificar la lógica principal. |
| Movies Service | `movies-service/src/movies/price-strategy/estreno.strategy.ts` | Estrategia para películas de estreno. | Encapsula el cálculo específico de este tipo. |
| Movies Service | `movies-service/src/movies/price-strategy/preventa.strategy.ts` | Estrategia para películas en preventa. | Permite aplicar recargo sin modificar `MoviesService`. |
| Movies Service | `movies-service/src/movies/price-strategy/reestreno.strategy.ts` | Estrategia para películas de reestreno. | Permite aplicar descuento sin modificar `MoviesService`. |

**Ejemplo:**

```ts
const PRICE_STRATEGIES = new Map<string, IMoviePriceStrategy>([
  ['ESTRENO', new EstrenoPriceStrategy()],
  ['PREVENTA', new PreventaPriceStrategy()],
  ['REESTRENO', new ReestrenoPriceStrategy()],
]);
```

Si en el futuro se agrega un tipo `VIP` o `3D`, se crea una nueva estrategia sin alterar las estrategias existentes.

---

## L — Liskov Substitution Principle

**Principio:** una clase derivada debe poder reemplazar a su clase base o interfaz sin alterar el comportamiento esperado del sistema.

| Servicio | Dónde se aplicó | Cómo se aplicó | Por qué se aplicó |
|---|---|---|---|
| Movies Service | `EstrenoPriceStrategy`, `PreventaPriceStrategy`, `ReestrenoPriceStrategy` | Todas implementan `IMoviePriceStrategy` y exponen el método `calculate(basePrice)`. | `MoviesService` puede usar cualquier estrategia sin conocer su implementación concreta. |
| Users Service | `JwtAuthGuard` y `RolesGuard` | Ambos implementan `CanActivate` de NestJS. | NestJS puede tratarlos como guards intercambiables en rutas protegidas. |

**Ejemplo:**

```ts
export class PreventaPriceStrategy implements IMoviePriceStrategy {
  calculate(basePrice: number): number {
    return parseFloat((basePrice * 1.10).toFixed(2));
  }
}
```

Todas las estrategias pueden sustituirse porque respetan el mismo contrato.

---

## I — Interface Segregation Principle

**Principio:** los clientes no deben depender de interfaces que no utilizan.

| Servicio | Dónde se aplicó | Cómo se aplicó | Por qué se aplicó |
|---|---|---|---|
| Users Service | `users-service/src/users/user.service.ts` | `IUserService` define operaciones propias de usuarios. | El controlador de usuarios depende solo de métodos relacionados con usuarios. |
| Users Service | `users-service/src/users/user.repository.ts` | `IUserRepository` define consultas específicas para usuarios. | El servicio no depende de una interfaz genérica de base de datos. |
| Movies Service | `ICitiesRepository` | Define `findAll()` y `findById()`. | Cities no necesita métodos de películas, cines o funciones. |
| Movies Service | `ITheatersRepository` | Define `findByCityId()` y `findById()`. | Theaters solo expone operaciones de cines. |
| Movies Service | `IMoviesRepository` | Define `findAll(filters)` y `findById()`. | Movies no depende de métodos de ciudades o funciones. |
| Movies Service | `IFunctionsRepository` | Define `findAll(filters)` y `findById()`. | Functions se mantiene especializado en horarios/funciones. |

**Ejemplo:**

```ts
export interface ICitiesRepository {
  findAll(): Promise<CityRecord[]>;
  findById(id: string): Promise<CityRecord | null>;
}
```

No se usa una interfaz gigante para todos los repositorios.

---

## D — Dependency Inversion Principle

**Principio:** los módulos de alto nivel no deben depender de módulos de bajo nivel; ambos deben depender de abstracciones.

| Servicio | Dónde se aplicó | Cómo se aplicó | Por qué se aplicó |
|---|---|---|---|
| Users Service | `users-service/src/common/tokens.ts` | Se definieron tokens `USER_SERVICE`, `USER_REPOSITORY`, `PG_POOL`. | Permite inyectar abstracciones y no clases concretas. |
| Users Service | `users-service/src/users/users.module.ts` | El módulo vincula token con implementación real mediante `useClass`. | La dependencia concreta se resuelve en el módulo, no en el controlador. |
| Movies Service | `movies-service/src/common/tokens.ts` | Se definieron tokens para services y repositories. | Desacopla controladores y servicios de implementaciones concretas. |
| Movies Service | `movies-service/src/*/*.module.ts` | Cada módulo registra providers con tokens. | Facilita reemplazar implementaciones en pruebas o futuras versiones. |
| Movies Service | `movies-service/src/database/database.module.ts` | `PG_POOL` se provee como abstracción global. | Los repositorios no crean conexiones manuales; reciben la conexión por inyección. |

**Ejemplo:**

```ts
constructor(@Inject(MOVIES_SERVICE) private readonly movies: IMoviesService) {}
```

El controlador depende de `IMoviesService`, no de `MoviesService` directamente.

---

## Conclusión

La aplicación de SOLID se evidencia principalmente en la separación controller-service-repository, el uso de interfaces, tokens de inyección de dependencias y el patrón Strategy para el cálculo de precios. Esto mejora la mantenibilidad, reduce acoplamiento y facilita extender el sistema sin modificar innecesariamente código existente.
