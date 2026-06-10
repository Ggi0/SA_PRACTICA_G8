# RabbitMQ — FilmStars

RabbitMQ corre como imagen Docker oficial (`rabbitmq:3-management`), sin Dockerfile propio. Se levanta junto a todos los demás servicios con `docker-compose up`.

## Acceso

| Recurso | URL / valor |
|---|---|
| AMQP (servicios) | `amqp://admin:admin123@rabbitmq:5672/` |
| Management UI | http://localhost:15672 |
| Usuario | `admin` |
| Contraseña | `admin123` |

La UI de management permite ver el estado de las colas, mensajes encolados y consumidores activos en tiempo real.

## Colas definidas

Las 5 colas se crean automáticamente al iniciar el contenedor gracias a `definitions.json`. Son **durable** (sobreviven reinicios del broker).

### 1. `seat_hold_queue`
- **Propósito**: El `reservations-service` publica aquí cuando un usuario selecciona asientos. Reserva temporal de hasta 10 minutos.
- **TTL**: 600 000 ms (10 min) — si el mensaje no es consumido en ese tiempo, expira solo.
- **Productor**: reservations-service
- **Consumidor**: reservations-service (internamente, para manejar expiración)

### 2. `seat_release_queue`
- **Propósito**: Liberar asientos bloqueados cuando la reserva expira o el usuario cancela antes de pagar.
- **Productor**: reservations-service (al detectar timeout o cancelación)
- **Consumidor**: reservations-service

### 3. `payment_process_queue`
- **Propósito**: El `reservations-service` publica aquí cuando el usuario confirma y envía sus datos de pago. El `payments-service` lo consume y procesa el cobro.
- **Productor**: reservations-service
- **Consumidor**: payments-service

### 4. `payment_result_queue`
- **Propósito**: El `payments-service` publica el resultado del cobro (aprobado / rechazado). El `reservations-service` lo consume para confirmar o cancelar la reserva.
- **Productor**: payments-service
- **Consumidor**: reservations-service

### 5. `ticket_issued_queue`
- **Propósito**: Una vez confirmado el pago, el `reservations-service` notifica que el boleto fue emitido. Puede ser consumido por un servicio de notificaciones (email, push) en el futuro.
- **Productor**: reservations-service
- **Consumidor**: (futuro) notifications-service

## Flujo completo de mensajes

```
Usuario selecciona asientos
        │
        ▼
reservations-service ──► seat_hold_queue
        │                     │ (bloquea asientos en DB)
        │                     ▼
        │              [10 min o usuario paga]
        │
Usuario confirma pago
        │
        ▼
reservations-service ──► payment_process_queue
                                │
                                ▼
                        payments-service
                        (procesa cobro)
                                │
                                ▼
                        payment_result_queue
                                │
                                ▼
                        reservations-service
                        (confirma reserva en DB)
                                │
                                ▼
                        ticket_issued_queue
                        (boleto emitido → frontend)
```

## Configuración Docker

El servicio está declarado en `docker-compose.yml`:

```yaml
rabbitmq:
  image: rabbitmq:3-management
  container_name: filmstars-rabbitmq
  environment:
    RABBITMQ_DEFAULT_USER: admin
    RABBITMQ_DEFAULT_PASS: admin123
    RABBITMQ_DEFAULT_VHOST: /
  ports:
    - "5672:5672"    # AMQP
    - "15672:15672"  # Management UI
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq          # mensajes persistentes
    - ./rabbitmq/rabbitmq.conf:/etc/rabbitmq/conf.d/filmstars.conf:ro
  healthcheck:
    test: ["CMD", "rabbitmq-diagnostics", "ping"]
    interval: 10s
    retries: 10
```

El volumen `rabbitmq_data` garantiza que los mensajes encolados sobrevivan reinicios del contenedor.

## Estado actual

Las colas están definidas y listas. Los servicios `reservations-service` y `payments-service` (pendientes de implementación) se conectarán a estas colas. Los servicios actuales (`users-service` y `movies-service`) no utilizan RabbitMQ.
