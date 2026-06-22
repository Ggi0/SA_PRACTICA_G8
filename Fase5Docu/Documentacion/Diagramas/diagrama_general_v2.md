

# Justificación de la Comunicación Asíncrona mediante RabbitMQ

## Introducción

La plataforma FilmStars implementa una arquitectura orientada a servicios (SOA) compuesta por múltiples dominios de negocio independientes: Usuarios, Películas y Cartelera, Reservas y Asientos, y Pagos.

Aunque gran parte de las operaciones del sistema pueden resolverse mediante comunicación síncrona utilizando APIs REST, existen procesos críticos que requieren un mecanismo más robusto para garantizar confiabilidad, escalabilidad y tolerancia a fallos.

Por esta razón se incorpora RabbitMQ como middleware de mensajería para habilitar comunicación asíncrona entre servicios.



## Problema de una Arquitectura Exclusivamente Síncrona

Si el proceso de compra de boletos se implementara únicamente mediante llamadas HTTP síncronas, el flujo sería similar al siguiente:

```text
Cliente
   |
   v
API Gateway
   |
   v
Servicio Reservas
   |
   +-------> Servicio Pagos
                    |
                    +-------> Confirmación
```

En este escenario:

1. El servicio de reservas depende directamente del servicio de pagos.
2. Si el servicio de pagos se encuentra caído, la reserva no puede completarse.
3. Una respuesta lenta del servicio de pagos bloquea todo el proceso.
4. Los errores temporales generan fallos visibles para el usuario.
5. Durante picos de demanda se incrementa significativamente la probabilidad de timeout.

Esta dependencia temporal incrementa el acoplamiento entre servicios y reduce la resiliencia general del sistema.



## Solución Basada en RabbitMQ

Para eliminar esta dependencia directa se introduce RabbitMQ como intermediario de mensajes.

El flujo se transforma de la siguiente manera:

```text
Servicio Reservas
        |
        | Publica Evento
        v
     RabbitMQ
        |
        | Consume Evento
        v
 Servicio Pagos
```

Ahora el servicio de reservas únicamente publica un evento indicando que existe una reserva pendiente de pago.

RabbitMQ almacena temporalmente el mensaje hasta que el servicio de pagos lo procese.

De esta forma:

* El productor no necesita esperar al consumidor.
* Los servicios operan de manera independiente.
* Los mensajes sobreviven a fallos temporales.
* Se reduce el acoplamiento entre dominios.


![](./img/Captura%20desde%202026-06-08%2005-29-03.png)

# Razones para Seleccionar RabbitMQ



## 1. Desacoplamiento entre Servicios

Uno de los principios fundamentales de SOA consiste en minimizar las dependencias entre servicios.

RabbitMQ permite que:

* Reservas no conozca detalles internos de Pagos.
* Pagos pueda evolucionar independientemente.
* Nuevos consumidores puedan agregarse posteriormente.

Por ejemplo:

```text
Evento:
RESERVATION_CREATED
```

Actualmente lo consume:

* Servicio de Pagos

En el futuro podría ser consumido también por:

* Servicio de Notificaciones
* Servicio de Reportes
* Servicio de Auditoría

Sin modificar el servicio productor.



## 2. Tolerancia a Fallos

Un requisito importante del sistema es garantizar la integridad de las operaciones de compra.

Si el servicio de pagos se encuentra temporalmente fuera de línea:

```text
Reserva -> RabbitMQ -> Pago OFFLINE
```

El mensaje permanece almacenado en la cola.

Cuando el servicio vuelve a estar disponible:

```text
RabbitMQ -> Pago ONLINE
```

El procesamiento continúa automáticamente.

Esto evita la pérdida de solicitudes de compra.



## 3. Manejo de Alta Concurrencia

Durante estrenos o preventas es posible que cientos de usuarios intenten reservar simultáneamente.

En una solución exclusivamente síncrona:

```text
1000 solicitudes
      |
      v
Servicio Pagos
```

El servicio puede saturarse.

RabbitMQ introduce una cola que actúa como amortiguador:

```text
1000 solicitudes
      |
      v
RabbitMQ
      |
      v
Consumidores
```

Esto permite procesar la carga de manera controlada y evita la sobrecarga inmediata de los servicios.



## 4. Garantía de Entrega

RabbitMQ ofrece mecanismos de:

* Acknowledgements.
* Mensajes persistentes.
* Reintentos automáticos.
* Dead Letter Queues.

Estas características resultan especialmente importantes para:

* Confirmaciones de pago.
* Reservas de asientos.
* Transacciones críticas.

La pérdida de un mensaje podría generar inconsistencias en el sistema.



## 5. Escalabilidad Horizontal

Si el volumen de pagos aumenta:

```text
Pago Worker 1
Pago Worker 2
Pago Worker 3
Pago Worker 4
```

Todos pueden consumir mensajes desde la misma cola.

Esto permite incrementar la capacidad de procesamiento sin modificar la lógica de negocio existente.



# Justificación del Uso de Docker Compose

## Objetivo

La solución está compuesta por múltiples componentes independientes:

* Frontend React
* API Gateway
* Servicio Usuarios
* Servicio Películas
* Servicio Reservas
* Servicio Pagos
* RabbitMQ
* Cuatro bases de datos PostgreSQL

Administrar manualmente todos estos procesos incrementaría considerablemente la complejidad operativa.

Por esta razón se utiliza Docker Compose como herramienta de orquestación local.



## Beneficios de Docker Compose

### Despliegue Simplificado

Toda la plataforma puede iniciarse mediante un único comando:

```bash
docker compose up -d
```

Lo anterior permite levantar automáticamente:

* Bases de datos.
* Servicios backend.
* RabbitMQ.
* API Gateway.
* Frontend.



### Aislamiento de Componentes

Cada servicio se ejecuta en su propio contenedor.

Por ejemplo:

```text
users-service
movies-service
reservations-service
payments-service
```

Cada uno posee:

* Dependencias propias.
* Variables de entorno independientes.
* Ciclo de vida aislado.

Esto reduce conflictos entre tecnologías y versiones.



### Reproducibilidad

Todos los integrantes del equipo ejecutan exactamente el mismo entorno.

Esto evita problemas del tipo:

```text
"Funciona en mi computadora"
```

ya que la infraestructura queda definida como código dentro del archivo:

```yaml
docker-compose.yml
```



### Redes Privadas

Docker Compose crea la red:

```yaml
filmstars-network
```

permitiendo comunicación interna entre servicios.

Por ejemplo:

```text
reservations-service
       |
       v
rabbitmq

payments-service
       |
       v
rabbitmq
```

sin necesidad de exponer todos los puertos al exterior.



### Persistencia de Datos

Las bases de datos utilizan volúmenes dedicados:

```yaml
db_users_data
db_movies_data
db_reservations_data
db_payments_data
rabbitmq_data
```

Esto garantiza que la información permanezca disponible incluso si los contenedores son recreados.



### Health Checks

La configuración incluye verificaciones de salud para:

* PostgreSQL
* RabbitMQ

Ejemplo:

```yaml
healthcheck:
  test: ["CMD", "rabbitmq-diagnostics", "ping"]
```

Esto asegura que los servicios dependientes inicien únicamente cuando los componentes requeridos se encuentren disponibles.



# Justificación de la Arquitectura Asíncrona

La decisión de implementar comunicación asíncrona mediante RabbitMQ responde a los requisitos de calidad del sistema relacionados con disponibilidad, escalabilidad y confiabilidad.

Las operaciones de consulta (cartelera, funciones, ciudades y disponibilidad) continúan utilizando comunicación síncrona debido a que requieren respuestas inmediatas para el usuario.

Sin embargo, los procesos de negocio más sensibles, como la creación de reservas y el procesamiento de pagos, utilizan comunicación basada en eventos para evitar dependencias temporales entre servicios y garantizar que las solicitudes sean procesadas incluso ante fallos parciales de la plataforma.

Como resultado, la arquitectura combina los beneficios de ambos modelos:

* Comunicación síncrona para consultas rápidas.
* Comunicación asíncrona para procesos críticos.
* Menor acoplamiento entre servicios.
* Mayor tolerancia a fallos.
* Mejor escalabilidad horizontal.
* Mayor robustez frente a picos de demanda.

Esta estrategia híbrida permite que FilmStars mantenga una arquitectura SOA moderna, resiliente y preparada para futuras ampliaciones funcionales.
