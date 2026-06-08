
# Arquitectura 4+1 — FilmStars

El modelo **4+1** describe la arquitectura del sistema desde cinco perspectivas complementarias, cada una dirigida a distintos stakeholders. La vista de Escenarios actúa como hilo conductor que valida las demás vistas.

![Vista 4+1](<Vista 4+1.png>)

---

## Vista de Escenarios (Casos de Uso)

Representa los casos de uso críticos del sistema desde la perspectiva del usuario final y el administrador. Incluye los cuatro flujos principales: autenticación y gestión de usuarios (CDU001), gestión de cartelera (CDU002), búsqueda y visualización (CDU003), y reserva y compra de boletos (CDU004). Además, detalla escenarios de concurrencia como la compra exitosa simultánea, condiciones de carrera entre usuarios, pagos rechazados y expiración de bloqueos TTL.

![Vista de Escenarios](<Vista de Escenarios.png>)

---

## Vista Lógica

Muestra la estructura estática del sistema mediante un diagrama de secuencia que describe la interacción entre los componentes principales durante el flujo de reserva y compra. El cliente interactúa con la **Interfaz WebClient**, que se comunica de forma síncrona (REST) con el **ControladorSeatService** para bloquear el asiento y confirmar la compra. El controlador delega el procesamiento del pago de forma asíncrona a los **WorkersAsíncronos** mediante eventos, quienes retornan la confirmación final.

![Vista Lógica](<Vista lógica.png>)

---

## Vista de Procesos

Detalla el comportamiento dinámico del sistema a través de un diagrama de actividades con carriles (swimlanes). Muestra el flujo completo desde que el cliente ingresa credenciales hasta que recibe su boleto, pasando por la validación JWT en el **API Gateway**, el bloqueo de asiento con `SELECT FOR UPDATE` en el **Seat Service (REST)**, el encolamiento de mensajes en el **RabbitMQ Broker** y el procesamiento asíncrono en los **Workers**. También ilustra los flujos alternativos: asiento ocupado, reserva inválida y pago fallido.

![Vista de Procesos](<Vista de Procesos.png>)

---


## Vista de Despliegue

Representa la distribución lógica de los artefactos de software sobre la infraestructura. Muestra cómo el `filmstars-ui.bundle` se conecta al `api-gateway.js` a través de la interfaz `IPublicAPI`, este delega al `seat-core-service.js` via `ISeatRouter`, y el microservicio core se comunica con `rabbit-connector.js` por `IMessageBroker` usando protocolo AMQP. Finalmente, el `res-worker.js` accede a la base de datos mediante `pg-driver.js` por `IDatabase`.

![Vista de Despliegue](<Vista de despliegue.png>)

---

## Vista de Despliegue (Física)

Describe el mapeo físico de los componentes sobre la infraestructura de nube. Todo el backend se despliega en **AWS EC2**: el **API Gateway** (puerto 3000) valida JWT y enruta las peticiones a los microservicios **User Service** (8001), **Catalog Service** (8002) y **Seat Service** (8003), todos en contenedores Docker con Node.js. La mensajería asíncrona corre sobre un **Cluster RabbitMQ** de dos nodos con alta disponibilidad (AMQP puerto 5672). Los workers de reserva, pago y generación de boletos consumen de dicho broker. Las cuatro bases de datos PostgreSQL (`users_db`, `movies_db`, `reservations_db`, `payments_db`) se alojan en **GCP (Google Cloud)**, accesibles por TCP en el puerto 5432.

![Vista de Despliegue (Física)](<Vista de Despliegue(Física) .png>)
