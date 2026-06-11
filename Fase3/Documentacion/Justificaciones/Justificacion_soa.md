# Justificación de Arquitectura Orientada a Servicios (SOA)

En FilmStars, la Arquitectura Orientada a Servicios se aplicó separando el sistema en servicios con responsabilidades de negocio independientes. Cada servicio contiene funcionalidades específicas y mantiene su propia base de datos o lógica de acceso a datos.

Los dominios principales son:

| Servicio | Responsabilidad principal | Base de datos |
|---|---|---|
| API Gateway | Punto de entrada único, enrutamiento y validación JWT. | No aplica. |
| Users Service | Autenticación, registro, login, emisión de JWT y gestión de usuarios. | `filmstars_users` |
| Movies Service | Ciudades, cines, cartelera, películas y funciones. | `filmstars_movies` |
| Reservations Service | Reservas, asientos por función, bloqueo temporal y disponibilidad. | `filmstars_reservations` |
| Payments Service | Pagos simulados, detalles de pago, boletos y reembolsos. | `filmstars_payments` |
| RabbitMQ | Comunicación asíncrona entre procesos críticos. | No aplica. |

## ¿Por qué se eligió SOA?

Se eligió SOA porque FilmStars tiene procesos con responsabilidades claramente separadas. Autenticación, cartelera, reservas y pagos pueden evolucionar de forma independiente.

Además, el sistema debe manejar picos de demanda y evitar condiciones de carrera al seleccionar asientos. Separar reservas y pagos permite que estos procesos críticos se procesen de forma controlada y asíncrona.

## Justificación por servicio

### API Gateway

| Aspecto | Justificación |
|---|---|
| ¿Qué hace? | Recibe las peticiones del frontend y las redirige hacia los servicios internos. |
| ¿Por qué existe? | Evita que el frontend conozca directamente la ubicación interna de cada servicio. |
| ¿Para qué sirve? | Centraliza CORS, validación JWT y enrutamiento. |
| Ejemplo | `/api/auth/login` se redirige a users-service; `/api/movies` se redirige a movies-service. |

### Users Service

| Aspecto | Justificación |
|---|---|
| ¿Qué hace? | Gestiona registro, login, usuarios, roles y JWT. |
| ¿Por qué está separado? | La autenticación es una responsabilidad transversal y sensible que no debe mezclarse con cartelera, reservas o pagos. |
| ¿Para qué sirve? | Permite proteger rutas y controlar identidad del usuario. |
| Base de datos | `filmstars_users` |

### Movies Service

| Aspecto | Justificación |
|---|---|
| ¿Qué hace? | Gestiona la consulta de ciudades, cines, películas y funciones. |
| ¿Por qué está separado? | La cartelera es consultada frecuentemente y puede escalar de forma independiente. |
| ¿Para qué sirve? | Permite que el usuario seleccione ubicación, cine, película y función. |
| Base de datos | `filmstars_movies` |

### Reservations Service

| Aspecto | Justificación |
|---|---|
| ¿Qué hace? | Gestiona reservas, bloqueo temporal de asientos y estado de asientos por función. |
| ¿Por qué está separado? | Es el dominio más crítico en concurrencia, porque varios usuarios pueden intentar reservar el mismo asiento. |
| ¿Para qué sirve? | Evita doble asignación de asientos y permite liberar asientos vencidos. |
| Base de datos | `filmstars_reservations` |
| Comunicación | Debe publicar/consumir eventos de RabbitMQ para procesar reservas de forma asíncrona. |

### Payments Service

| Aspecto | Justificación |
|---|---|
| ¿Qué hace? | Gestiona pagos simulados, detalles de pago, boletos y reembolsos. |
| ¿Por qué está separado? | Las transacciones financieras deben aislarse para mejorar seguridad, trazabilidad y tolerancia a fallos. |
| ¿Para qué sirve? | Permite confirmar compras y emitir boletos después de un pago exitoso. |
| Base de datos | `filmstars_payments` |
| Comunicación | Debe consumir eventos de reserva y publicar resultados de pago. |

### RabbitMQ

| Aspecto | Justificación |
|---|---|
| ¿Qué hace? | Actúa como middleware de mensajería basado en colas. |
| ¿Por qué se usa? | Desacopla procesos críticos y evita bloquear el hilo principal de la aplicación. |
| ¿Para qué sirve? | Permite procesar reservas, pagos y emisión de boletos de forma asíncrona. |

## Comunicación síncrona y asíncrona

| Tipo de comunicación | Uso en el sistema | Justificación |
|---|---|---|
| Síncrona HTTP/REST | Login, registro, consulta de cartelera, consulta de ciudades, cines y funciones. | Son operaciones de consulta o respuesta inmediata al usuario. |
| Asíncrona RabbitMQ | Reserva de asientos, procesamiento de pago y emisión de boleto. | Son operaciones críticas que pueden tardar o requerir reproceso ante fallos. |

## Base de datos por servicio

Se eligió el patrón Database per Service. Cada servicio mantiene su propia base de datos:

| Servicio | DB | Motivo |
|---|---|---|
| Users Service | `filmstars_users` | Aísla credenciales, roles y datos personales. |
| Movies Service | `filmstars_movies` | Aísla cartelera y funciones. |
| Reservations Service | `filmstars_reservations` | Aísla disponibilidad y estado de asientos. |
| Payments Service | `filmstars_payments` | Aísla transacciones, boletos y reembolsos. |

Las relaciones entre servicios no se implementan mediante llaves foráneas físicas entre bases de datos distintas. En su lugar, se usan referencias externas como:

| Campo | Significado |
|---|---|
| `usuario_id_ref` | Referencia lógica a un usuario del Users Service. |
| `funcion_id_ref` | Referencia lógica a una función del Movies Service. |
| `asiento_id_ref` | Referencia lógica a un asiento del Movies Service. |
| `reserva_id_ref` | Referencia lógica a una reserva del Reservations Service. |
| `reserva_asiento_id_ref` | Referencia lógica a un asiento reservado. |

## Resultados

| Beneficio | Explicación |
|---|---|
| Bajo acoplamiento | Cada servicio puede modificarse sin afectar directamente a los demás. |
| Escalabilidad | Servicios con mayor carga, como cartelera o reservas, pueden escalarse por separado. |
| Mantenibilidad | La lógica está separada por dominio de negocio. |
| Seguridad | El acceso está centralizado en el API Gateway y se protege con JWT. |
| Tolerancia a fallos | RabbitMQ permite mantener mensajes en cola y reprocesar eventos críticos. |
| Trazabilidad | Las tablas de mensajería y eventos permiten registrar operaciones importantes. |

## Conclusión

SOA fue adecuada para FilmStars porque el sistema combina autenticación, consultas de cartelera, reservas concurrentes y pagos. Estos dominios tienen necesidades distintas y pueden evolucionar de forma independiente. La combinación de API Gateway, servicios separados, bases de datos independientes y RabbitMQ permite construir una solución más mantenible, escalable y alineada con los requerimientos de la práctica.
