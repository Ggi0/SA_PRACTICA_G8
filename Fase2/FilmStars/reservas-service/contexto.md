

# Estructura propuesta (simple pero completa)

```text
src
├── main.ts
├── app.module.ts
│
├── config
│   ├── env.config.ts
│   └── database.config.ts
│
├── common
│   ├── enums
│   │   ├── reserva-estado.enum.ts
│   │   ├── asiento-estado.enum.ts
│   │   └── mensajeria-estado.enum.ts
│   │
│   ├── decorators
│   │   └── user-id.decorator.ts
│   │
│   ├── guards
│   │   └── jwt-auth.guard.ts
│   │
│   └── exceptions
│       ├── asiento-no-disponible.exception.ts
│       ├── reserva-no-encontrada.exception.ts
│       └── reserva-invalida.exception.ts
│
├── health
│   ├── health.controller.ts
│   └── health.module.ts
│
├── reservas
│   ├── reservas.module.ts
│   │
│   ├── controllers
│   │   └── reservas.controller.ts
│   │
│   ├── services
│   │   ├── reservas.service.ts
│   │   ├── disponibilidad.service.ts
│   │   └── expiracion.service.ts
│   │
│   ├── dto
│   │   ├── crear-reserva.dto.ts
│   │   ├── confirmar-reserva.dto.ts
│   │   └── reserva-response.dto.ts
│   │
│   ├── entities
│   │   ├── reserva.entity.ts
│   │   ├── estado-asiento-funcion.entity.ts
│   │   ├── reserva-asiento.entity.ts
│   │   └── mensajeria.entity.ts
│   │
│   └── repositories
│       ├── reserva.repository.ts
│       ├── estado-asiento-funcion.repository.ts
│       └── mensajeria.repository.ts
│
├── scheduler
│   └── expiracion.scheduler.ts
│
└── messaging
    ├── messaging.module.ts
    ├── publisher.interface.ts
    ├── rabbitmq.publisher.ts
    └── payment.consumer.ts
```

***

***

# ¿Qué eliminas de lo actual?

Puedes eliminar estos archivos porque ya no te aportan nada:

```text
src/app.controller.ts
src/app.controller.spec.ts
src/app.service.ts
```

Te quedas con:

```text
src/main.ts
src/app.module.ts
```

***

# Filosofía de esta estructura

La idea es:

* **No hacer demasiados módulos**
* **No separar 20 capas innecesarias**
* Mantenerlo **fácil de entender**
* Pero sí cubrir:
  * endpoints
  * lógica transaccional
  * expiración de reservas
  * bloqueo/liberación de asientos
  * persistencia en PostgreSQL
  * mensajería/outbox preparada para RabbitMQ
  * JWT guard simple
  * health check

***

# Qué va en cada carpeta y archivo

***

## 1) `main.ts`

### ¿Qué hace?

Es el punto de entrada del proyecto.

### Contendrá:

* creación de la app Nest
* prefijo global si quieres (`/api`)
* `ValidationPipe`
* puerto desde variables de entorno

### Ejemplo de responsabilidad:

```ts
bootstrap();
```

Nada de lógica de negocio aquí.

***

## 2) `app.module.ts`

### ¿Qué hace?

Es el módulo raíz. Importa todo lo demás.

### Va a importar:

* `ConfigModule`
* `TypeOrmModule`
* `ReservasModule`
* `HealthModule`
* `MessagingModule`
* `ScheduleModule.forRoot()`

### Responsabilidad:

Conectar todas las piezas.

***

# CONFIG

***

## 3) `config/env.config.ts`

### ¿Qué hace?

Maneja variables de entorno de forma centralizada.

### Aquí defines acceso a:

* `PORT`
* `DB_HOST`
* `DB_PORT`
* `DB_NAME`
* `DB_USER`
* `DB_PASS`
* `JWT_SECRET`
* `RABBITMQ_*`
* `RESERVATION_TIMEOUT_MINUTES`

### Objetivo:

Que no estés leyendo `process.env` por todos lados.

***

## 4) `config/database.config.ts`

### ¿Qué hace?

Expone la configuración de TypeORM para PostgreSQL.

### Debe apuntar a:

* host externo (`db-reservations`)
* puerto externo
* usuario/password
* entidades
* sincronización desactivada si usarás scripts SQL externos

### Importante

Como tú ya tienes el SQL definido, lo ideal es:

* **no usar `synchronize: true` en producción**
* usar solo las entidades para mapear

***

# COMMON

***

## 5) `common/enums/reserva-estado.enum.ts`

### ¿Qué contiene?

Los estados de la reserva:

```ts
PENDIENTE
CONFIRMADA
CANCELADA
EXPIRADA
```

***

## 6) `common/enums/asiento-estado.enum.ts`

### ¿Qué contiene?

Los estados del asiento:

```ts
DISPONIBLE
BLOQUEADO
OCUPADO
```

***

## 7) `common/enums/mensajeria-estado.enum.ts`

### ¿Qué contiene?

Estados de la tabla `mensajeria`:

```ts
PENDIENTE
PUBLICADO
PROCESADO
FALLIDO
```

***

## 8) `common/decorators/user-id.decorator.ts`

### ¿Qué hace?

Extrae el `usuarioId` del request/JWT sin repetir código en los controladores.

### Ejemplo:

```ts
@UserId() usuarioId: string
```

***

## 9) `common/guards/jwt-auth.guard.ts`

### ¿Qué hace?

Valida que venga JWT.

### En esta primera versión sencilla:

Puede:

* leer `Authorization: Bearer ...`
* verificar el token con `JWT_SECRET`
* meter el payload en `request.user`

### Nota importante

Aquí no estás implementando autenticación completa, solo validación del token de entrada, porque **autenticación pertenece a otro servicio**.

***

## 10) `common/exceptions/*`

### ¿Qué hacen?

Centralizan errores de dominio.

### Ejemplos:

* `asiento-no-disponible.exception.ts`
* `reserva-no-encontrada.exception.ts`
* `reserva-invalida.exception.ts`

### ¿Por qué sirve?

Porque tu servicio no es un CRUD simple; hay reglas de negocio.  
Estas excepciones hacen el código más limpio.

***

# HEALTH

***

## 11) `health/health.controller.ts`

### ¿Qué hace?

Expone:

```http
GET /health
```

### Response:

```json
{
  "status": "ok"
}
```

***

## 12) `health/health.module.ts`

### ¿Qué hace?

Módulo pequeño solo para el health check.

***

# RESERVAS (núcleo del proyecto)

Esta carpeta concentra lo más importante.

***

## 13) `reservas/reservas.module.ts`

### ¿Qué hace?

Agrupa:

* controlador
* servicios
* repositorios
* entidades TypeORM

### Aquí registras:

* `TypeOrmModule.forFeature([...])`

***

## 14) `reservas/controllers/reservas.controller.ts`

### ¿Qué hace?

Define todos los endpoints:

* `GET /reservas/funciones/:funcionId/asientos`
* `GET /reservas/funciones/:funcionId/disponibilidad`
* `POST /reservas`
* `GET /reservas/:id`
* `GET /reservas/mis-reservas`
* `DELETE /reservas/:id`
* `POST /reservas/:id/confirmar`

### Responsabilidad:

* recibir request
* validar DTO
* aplicar guard cuando sea necesario
* delegar a servicios

**Aquí NO va lógica de negocio compleja.**

***

## 15) `reservas/services/reservas.service.ts`

### ¿Qué hace?

Es el **corazón del negocio**.

### Aquí va la lógica de:

* crear reserva pendiente
* bloquear asientos
* calcular expiración
* consultar una reserva
* listar mis reservas
* cancelar reserva
* confirmar reserva
* registrar evento en outbox (`mensajeria`)

### Muy importante

Aquí deben ir las operaciones **transaccionales**.

Por ejemplo, en `crearReserva()`:

1. validar asientos solicitados
2. verificar que estén `DISPONIBLE`
3. crear registro en `reserva`
4. marcar asientos como `BLOQUEADO`
5. crear `reserva_asiento`
6. insertar evento `reserva.solicitada` en `mensajeria`
7. hacer commit

Ese método es el más delicado del sistema.

***

## 16) `reservas/services/disponibilidad.service.ts`

### ¿Qué hace?

Se encarga de consultas de lectura:

* mapa de asientos de una función
* resumen de disponibilidad

### ¿Por qué separarlo?

Porque así no mezclas:

* lógica de consulta
* lógica de transacciones

Queda mucho más limpio.

***

## 17) `reservas/services/expiracion.service.ts`

### ¿Qué hace?

Contiene la lógica para expirar reservas pendientes vencidas.

### Aquí va:

* buscar reservas `PENDIENTE` con `expira_en < now`
* cambiar estado a `EXPIRADA`
* liberar asientos `BLOQUEADO -> DISPONIBLE`
* registrar evento `reserva.expirada`

### Esto será usado por el scheduler.

***

# DTOs

***

## 18) `reservas/dto/crear-reserva.dto.ts`

### ¿Qué contiene?

El body de:

```http
POST /reservas
```

### Campos:

* `funcionId`
* `asientos: string[]`

Con validaciones:

* UUID
* array no vacío
* items UUID

***

## 19) `reservas/dto/confirmar-reserva.dto.ts`

### ¿Qué contiene?

Aunque confirmar por endpoint no necesitaría mucho body, puede incluir por ejemplo:

* `referenciaPago?: string`

Si decides confirmarlo manualmente.

Si quieres simplificar más, este archivo incluso podría omitirse.

***

## 20) `reservas/dto/reserva-response.dto.ts`

### ¿Qué hace?

Modela respuestas para que el código quede más claro.

No es obligatorio, pero ayuda bastante.

***

# ENTITIES

Estas deben mapear exactamente tu SQL.

***

## 21) `reservas/entities/reserva.entity.ts`

### Tabla:

`reserva`

### Tendrá campos:

* `id`
* `usuario_id_ref`
* `funcion_id_ref`
* `estado`
* `precio_total`
* `referencia_pago_ref`
* `expira_en`
* `creado`
* `modificacion`

### Relaciones:

* `OneToMany` con `reserva_asiento`

***

## 22) `reservas/entities/estado-asiento-funcion.entity.ts`

### Tabla:

`estado_asiento_funcion`

### Tendrá campos:

* `id`
* `funcion_id_ref`
* `asiento_id_ref`
* `codigo_asiento`
* `fila`
* `numero`
* `estado`
* `reserva_id`
* `bloqueado_hasta`
* `modificacion`

### Es clave

Esta tabla representa el estado actual del asiento para una función específica.

***

## 23) `reservas/entities/reserva-asiento.entity.ts`

### Tabla:

`reserva_asiento`

### Rela ciona:

* una reserva
* con los asientos concretos bloqueados/ocupados

### Campos:

* `reserva_id`
* `estado_asiento_funcion_id`
* `precio_unitario`
* `tipo_entrada`

***

## 24) `reservas/entities/mensajeria.entity.ts`

### Tabla:

`mensajeria`

### ¿Qué hace?

Implementa el patrón **outbox**.

Cada vez que el servicio haga algo relevante, en lugar de publicar directamente a RabbitMQ, primero guarda el evento aquí.

### Ventaja:

* no dependes de RabbitMQ vivo
* te permite cumplir con arquitectura desacoplada
* luego otro componente puede leer y publicar

***

# REPOSITORIES

Aquí no necesitamos interfaces complicadas todavía.  
Con 3 repositorios concretos basta.

***

## 25) `reservas/repositories/reserva.repository.ts`

### ¿Qué hace?

Encapsula consultas de la tabla `reserva`.

### Ejemplos de métodos:

* `createReserva(...)`
* `findById(...)`
* `findByUsuarioId(...)`
* `findPendientesExpiradas(...)`
* `save(...)`

***

## 26) `reservas/repositories/estado-asiento-funcion.repository.ts`

### ¿Qué hace?

Maneja el estado de los asientos.

### Métodos típicos:

* `findByFuncionId(...)`
* `findDisponiblesByIds(...)`
* `bloquearAsientos(...)`
* `ocuparAsientos(...)`
* `liberarAsientosPorReserva(...)`
* `countDisponibilidad(...)`

### Muy importante

Aquí es donde puedes aplicar:

* `SELECT ... FOR UPDATE`
* o locks pesimistas con TypeORM

para evitar doble reserva concurrente.

***

## 27) `reservas/repositories/mensajeria.repository.ts`

### ¿Qué hace?

Inserta eventos en la tabla `mensajeria`.

### Ejemplos:

* `guardarEvento(...)`
* `findPendientes(...)`
* `markPublicado(...)`

***

# SCHEDULER

***

## 28) `scheduler/expiracion.scheduler.ts`

### ¿Qué hace?

Ejecuta cada 30 segundos la expiración.

### Aquí va:

* `@Cron('*/30 * * * * *')`
* llamar a `expiracionService.expirarReservasVencidas()`

### Responsabilidad:

solo disparar el proceso, **no** implementar la lógica.

***

# MESSAGING

Tú pediste dejar RabbitMQ solo planteado. Esa es una excelente decisión.

***

## 29) `messaging/messaging.module.ts`

### ¿Qué hace?

Agrupa publisher y consumer placeholders.

***

## 30) `messaging/publisher.interface.ts`

### ¿Qué hace?

Define un contrato simple como:

```ts
publish(eventName: string, payload: unknown): Promise<void>
```

### ¿Por qué sirve?

Porque respetas DIP:

* el servicio de reservas depende de una abstracción
* no de RabbitMQ directamente

***

## 31) `messaging/rabbitmq.publisher.ts`

### ¿Qué hace?

Implementación *placeholder*.

Por ahora puede:

* no publicar realmente
* solo dejar el método listo
* incluso hacer log o lanzar `NotImplementedException`

### Objetivo

Que la arquitectura ya quede lista para enchufar RabbitMQ después.

***

## 32) `messaging/payment.consumer.ts`

### ¿Qué hace?

Deja preparados los handlers para:

* `pago.confirmado`
* `pago.rechazado`

### Por ahora

Solo como estructura o stubs.

Por ejemplo:

* `handlePagoConfirmado(payload)`
* `handlePagoRechazado(payload)`

Más adelante estos llamarán a:

* `reservasService.confirmarReserva(...)`
* `reservasService.cancelarReserva(...)`

***

# Cómo se reparten los requisitos en esta estructura

***

## Endpoint 1: mapa de asientos

Va en:

* `reservas.controller.ts`
* `disponibilidad.service.ts`
* `estado-asiento-funcion.repository.ts`

***

## Endpoint 2: resumen disponibilidad

Va en:

* `reservas.controller.ts`
* `disponibilidad.service.ts`
* `estado-asiento-funcion.repository.ts`

***

## Endpoint 3: crear reserva

Va en:

* `reservas.controller.ts`
* `jwt-auth.guard.ts`
* `user-id.decorator.ts`
* `crear-reserva.dto.ts`
* `reservas.service.ts`
* `reserva.repository.ts`
* `estado-asiento-funcion.repository.ts`
* `mensajeria.repository.ts`

***

## Endpoint 4: consultar reserva

Va en:

* `reservas.controller.ts`
* `reservas.service.ts`
* `reserva.repository.ts`

***

## Endpoint 5: mis reservas

Va en:

* `reservas.controller.ts`
* `jwt-auth.guard.ts`
* `user-id.decorator.ts`
* `reservas.service.ts`
* `reserva.repository.ts`

***

## Endpoint 6: cancelar reserva

Va en:

* `reservas.controller.ts`
* `reservas.service.ts`
* `estado-asiento-funcion.repository.ts`
* `mensajeria.repository.ts`

***

## Endpoint 7: confirmar reserva

Va en:

* `reservas.controller.ts`
* `reservas.service.ts`
* `estado-asiento-funcion.repository.ts`
* `mensajeria.repository.ts`

***

## Endpoint 8: health

Va en:

* `health.controller.ts`

***

## Expiración automática

Va en:

* `scheduler/expiracion.scheduler.ts`
* `reservas/services/expiracion.service.ts`

***

## RabbitMQ preparado

Va en:

* `messaging/publisher.interface.ts`
* `messaging/rabbitmq.publisher.ts`
* `messaging/payment.consumer.ts`
* `reservas/entities/mensajeria.entity.ts`

***

# Decisiones importantes para mantenerlo simple

Te recomiendo estas simplificaciones:

### 1. No crear demasiadas interfaces

No hace falta meter interfaces para cada repository si estás empezando.  
Solo deja **una interfaz para publisher** porque ahí sí te ayuda con DIP y con RabbitMQ.

### 2. No separar “bloqueo.service”

La lógica de bloqueo puede vivir dentro de `reservas.service.ts`.

### 3. No hacer módulos por cada cosa

Con:

* `reservas`
* `health`
* `messaging`

ya estás bien.

### 4. Toda la concurrencia crítica en el service + repository

No en el controller.

### 5. Mantener la tabla `mensajeria` desde ya

Aunque RabbitMQ no se implemente todavía, esto te deja una arquitectura seria y lista.

***

# Resumen práctico

Si quieres algo **simple, sólido y entregable**, esta estructura es suficiente porque:

* cumple todos los endpoints
* soporta expiración automática
* soporta bloqueo de asientos
* permite transacciones
* usa PostgreSQL externo
* deja RabbitMQ desacoplado y preparado
* no está inflada innecesariamente

***


recuerda siempre aplicar los principios solid

"Requisitos Técnicos y de Arquitectura
1. Principios SOLID (Calidad de código)
Los estudiantes deberán demostrar de forma explícita en su código fuente la aplicación de
los siguientes principios:
● S - Single Responsibility Principle (Responsabilidad Única)
Cada clase, controlador o servicio de backend debe tener una única razón para
cambiar (ej. separar la lógica de negocio de la reserva de la lógica de persistencia
de datos o del envío a la cola de mensajería).
● O - Open/Closed Principle (Abierto/Cerrado):
El software debe estar abierto para su extensión pero cerrado para su modificación
(ej. el sistema de cálculo de precios según el tipo de función—estreno, preventa o
re-estreno—debe permitir añadir nuevas reglas sin modificar las clases existentes).
● L - Liskov Substitution Principle (Sustitución de Liskov):
Las clases derivadas deben poder sustituir a sus clases base sin alterar el
comportamiento del programa.
● I - Interface Segregation Principle (Segregación de Interfaces):
Los clientes no deben ser obligados a depender de interfaces o métodos que no
utilizan.
● D - Dependency Inversion Principle (Inversión de Dependencias):
Los módulos de alto nivel no deben depender de módulos de bajo nivel; ambos
deben depender de abstracciones (uso estricto de interfaces para desacoplar
controladores de servicios y servicios de repositorios de datos)."



# Mi recomendación final para tu caso

Yo haría esto en este orden:

1. **Config y conexión DB**
2. **Enums y entities**
3. **ReservasModule**
4. **Repositories**
5. **Services**
6. **Controller**
7. **Health**
8. **Scheduler**
9. **Messaging placeholder**

***

