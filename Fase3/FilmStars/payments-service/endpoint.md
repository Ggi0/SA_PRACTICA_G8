

## ✅ ENPOINTS que implementa

| Método | Ruta            | Descripción    |
| ------ | --------------- | -------------- |
| POST   | `/payments`     | Procesar pago  |
| GET    | `/payments/:id` | Consultar pago |

***



***

## ✅ Flujo real

```text
POST /payments
      ↓
PaymentsController
      ↓
PaymentsService
      ↓
FakeGateway
      ↓
DB (pago + mensajeria)

GET /payments/:id
      ↓
PaymentsController
      ↓
Repository
      ↓
DB
```

***

# ✅ 2) 📄 `src/health/health.controller.ts`

***

## ✅ ¿Qué hace?

Expone endpoint de salud:

```http
GET /health
```
***

## ✅ ¿Por qué es importante?

✔ Kubernetes / Docker lo usan  
✔ API Gateway puede usarlo  
✔ Debug rápido


salida:
```
{
    "status": "ok",
    "service": "payments-service",
    "timestamp": "2026-06-21T06:19:26.437Z"
}

```


***

# ✅ 3)  YA PUEDES PROBAR EL SERVICIO

***

## ✅ ✅ 1. Health

```http
GET http://localhost:3004/health
```

Response:

```json
{
  "status": "ok",
  "service": "payments-service",
  "timestamp": "2026-..."
}
```

***

## ✅ ✅ 2. Crear pago (PRUEBA CLAVE)

```http
POST http://localhost:3004/payments
```

Body:

```json
{
  "reservaId": "11111111-1111-1111-1111-111111111111",
  "usuarioId": "22222222-2222-2222-2222-222222222222",
  "monto": 90,
  "metodoPago": "TEST_APROBADO"
}
```

TODO: aqui me da un error:
```
{
    "message": [
        "reservaId must be a UUID",
        "usuarioId must be a UUID"
    ],
    "error": "Bad Request",
    "statusCode": 400
}

```

este es el token que estoy usando: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZGY3MTRiZi1iNGZhLTQ0ZjMtOTZhYi02YzU5MmNiOWE3MjEiLCJlbWFpbCI6InBhZ29zQGdtYWlsLmNvbSIsIm5vbWJyZSI6Imdpby1wYWdvcyIsInJvbCI6ImN1c3RvbWVyIiwiaWF0IjoxNzgyMDIzMDMwLCJleHAiOjE3ODIxMDk0MzB9.SQ2NqQfS-NN-69tUBqQhQ98SlA3d1ThU_0Euz4Co1m8`

y esta la info:
```
{"id":"6df714bf-b4fa-44f3-96ab-6c592cb9a721","name":"gio-pagos","email":"pagos@gmail.com","role":"USER"}


```


con esta entrada si es funciona:
"{
  "reservaId": "7643a23f-2aba-4038-b698-f51b8c0ce385",
  "usuarioId": "6df714bf-b4fa-44f3-96ab-6c592cb9a721",
  "monto": 90,
  "metodoPago": "TEST_APROBADO"
}"



esta es la respuesta:
"
```
{
    "id": "631e09fb-9e67-4866-90e2-51ebcb1658d5",
    "estado": "APROBADO",
    "monto": "90.00",
    "moneda": "GTQ",
    "reservaId": "7643a23f-2aba-4038-b698-f51b8c0ce385",
    "usuarioId": "6df714bf-b4fa-44f3-96ab-6c592cb9a721",
    "metodoPago": "TEST_APROBADO",
    "proveedorRef": "fake-ok-631e09fb-9e67-4866-90e2-51ebcb1658d5",
    "procesadoEn": "2026-06-21T06:27:22.917Z"
}

```
"


***

### Resultado esperado:

```json
{
  "id": "uuid",
  "estado": "APROBADO",
  "monto": "90.00",
  "reservaId": "...",
  "metodoPago": "TEST_APROBADO"
}
```

***

## ✅ ✅ 3. Obtener pago

```http
GET http://localhost:3004/payments/{id}
```

Nota: el id debe e ser del pago
http://localhost:3004/payments/631e09fb-9e67-4866-90e2-51ebcb1658d5

```
{
    "id": "631e09fb-9e67-4866-90e2-51ebcb1658d5",
    "estado": "APROBADO",
    "monto": "90.00",
    "moneda": "GTQ",
    "reservaId": "7643a23f-2aba-4038-b698-f51b8c0ce385",
    "usuarioId": "6df714bf-b4fa-44f3-96ab-6c592cb9a721",
    "metodoPago": "TEST_APROBADO",
    "proveedorRef": "fake-ok-631e09fb-9e67-4866-90e2-51ebcb1658d5",
    "procesadoEn": "2026-06-21T06:27:22.917Z"
}


```


***

# ✅ 6) 🧠 ¿POR QUÉ ESTO ESTÁ BIEN?

***

## ✅ SRP

* controller → HTTP
* service → negocio
* repository → DB

***

## ✅ DIP

controller depende de:

```ts
PaymentsService
```

no de implementación DB ni gateway.

***

## ✅ OCP

puedes agregar:

```ts
StripeGatewayService
```

sin tocar controller ni service.

***

# 7) ESTADO ACTUAL DEL PROYECTO

Ya tienes:

✅ backend funcional completo  
✅ DB persistente  
✅ lógica de pago  
✅ fake API externa  
✅ endpoints  
✅ outbox listo  
✅ arquitectura SOA correcta

***

# 8) SIGUIENTE PASO (YA FINAL)

Ahora viene lo que conecta todo:

```text
RabbitMQ
```

Vas a crear:

```text
messaging/
consumers/payment.consumer.ts
```

Y conectarás:

```text
payment_process_queue
payment_result_queue
```

















# ============================== Practica 5 ==========================================

## obtener mis boletos
http://localhost:8080/api/payments/boletos/mis-boletos
Respuesta:
```
[
    {
        "id": "9038d1b2-5df4-4ba1-96cc-fb0c5f60f50c",
        "codigo": "BOL-1782092510320-0",
        "estado": "EMITIDO",
        "reservaId": "9c1bdc01-d25a-476b-b787-9703b19e1909",
        "creado": "2026-06-22T01:41:50.322Z"
    },
    {
        "id": "53479d4c-bacf-4594-91bd-c71a74f57489",
        "codigo": "BOL-1782095548510-0",
        "estado": "EMITIDO",
        "reservaId": "3df3983f-15df-482a-a421-a6e6560e1f9a",
        "creado": "2026-06-22T02:32:28.511Z"
    },
    {
        "id": "315e617b-edf0-4aff-bdfb-d8cc412f2d85",
        "codigo": "BOL-1782095591933-0",
        "estado": "EMITIDO",
        "reservaId": "667023ea-0abf-4039-b123-a4b30ecc3e05",
        "creado": "2026-06-22T02:33:11.936Z"
    }
]
```


http://localhost:8080/api/payments/boletos/mis-boletos?estado=EMITIDO

```
[
    {
        "id": "9038d1b2-5df4-4ba1-96cc-fb0c5f60f50c",
        "codigo": "BOL-1782092510320-0",
        "estado": "EMITIDO",
        "reservaId": "9c1bdc01-d25a-476b-b787-9703b19e1909",
        "creado": "2026-06-22T01:41:50.322Z"
    },
    {
        "id": "53479d4c-bacf-4594-91bd-c71a74f57489",
        "codigo": "BOL-1782095548510-0",
        "estado": "EMITIDO",
        "reservaId": "3df3983f-15df-482a-a421-a6e6560e1f9a",
        "creado": "2026-06-22T02:32:28.511Z"
    },
    {
        "id": "315e617b-edf0-4aff-bdfb-d8cc412f2d85",
        "codigo": "BOL-1782095591933-0",
        "estado": "EMITIDO",
        "reservaId": "667023ea-0abf-4039-b123-a4b30ecc3e05",
        "creado": "2026-06-22T02:33:11.936Z"
    }
]

```



http://localhost:8080/api/payments/boletos/mis-boletos?fechaInicio=2026-06-01
```
[
    {
        "id": "9038d1b2-5df4-4ba1-96cc-fb0c5f60f50c",
        "codigo": "BOL-1782092510320-0",
        "estado": "EMITIDO",
        "reservaId": "9c1bdc01-d25a-476b-b787-9703b19e1909",
        "creado": "2026-06-22T01:41:50.322Z"
    },
    {
        "id": "53479d4c-bacf-4594-91bd-c71a74f57489",
        "codigo": "BOL-1782095548510-0",
        "estado": "EMITIDO",
        "reservaId": "3df3983f-15df-482a-a421-a6e6560e1f9a",
        "creado": "2026-06-22T02:32:28.511Z"
    },
    {
        "id": "315e617b-edf0-4aff-bdfb-d8cc412f2d85",
        "codigo": "BOL-1782095591933-0",
        "estado": "EMITIDO",
        "reservaId": "667023ea-0abf-4039-b123-a4b30ecc3e05",
        "creado": "2026-06-22T02:33:11.936Z"
    }
]



```



# buscar por codigo
http://localhost:8080/api/payments/boletos/codigo/BOL-1782092510320-0

```
{
    "id": "9038d1b2-5df4-4ba1-96cc-fb0c5f60f50c",
    "codigo": "BOL-1782092510320-0",
    "estado": "EMITIDO",
    "reservaId": "9c1bdc01-d25a-476b-b787-9703b19e1909",
    "creado": "2026-06-22T01:41:50.322Z"
}

```

http://localhost:8080/api/payments/boletos/codigo/BOL-1782095591933-0:
```
{
    "id": "315e617b-edf0-4aff-bdfb-d8cc412f2d85",
    "codigo": "BOL-1782095591933-0",
    "estado": "EMITIDO",
    "reservaId": "667023ea-0abf-4039-b123-a4b30ecc3e05",
    "creado": "2026-06-22T02:33:11.936Z"
}

```