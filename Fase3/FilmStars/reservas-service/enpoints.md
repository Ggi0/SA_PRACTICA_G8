# DOCUMENTACIÓN DE ENDPOINTS — RESERVAS SERVICE

Base URL:

```http
http://localhost:3003/reservas
```

***

# ✅ 1. MAPA DE ASIENTOS

## 🔹 GET `/reservas/funciones/:funcionId/asientos`

### 📥 Request

**Params:**

```json
{
  "funcionId": "uuid"
}
```

***

### ✅ Response 200

```json
{
  "funcionId": "11111111-1111-1111-1111-111111111111",
  "asientos": [
    {
      "id": "asiento-uuid",
      "codigo": "A1",
      "fila": "A",
      "numero": 1,
      "estado": "DISPONIBLE"
    }
  ]
}
```

***

### ❌ Errores posibles

| Código | Error              |
| ------ | ------------------ |
| 400    | funcionId inválido |
| 500    | error interno      |

***

***

# ✅ 2. RESUMEN DE DISPONIBILIDAD

## 🔹 GET `/reservas/funciones/:funcionId/disponibilidad`

***

### ✅ Response 200

```json
{
  "funcionId": "uuid",
  "disponibles": 50,
  "bloqueados": 10,
  "ocupados": 30
}
```

***

### ❌ Errores

| Código | Error              |
| ------ | ------------------ |
| 400    | funcionId inválido |

***

***

# ✅ 3. CREAR RESERVA 🔥

## 🔹 POST `/reservas`

### 🔐 Requiere JWT

***

### 📥 Request

```json
{
  "funcionId": "uuid",
  "asientos": [
    "uuid-asiento-1",
    "uuid-asiento-2"
  ]
}
```

***

### ✅ Response 201

```json
{
  "id": "uuid-reserva",
  "estado": "PENDIENTE",
  "precioTotal": 90,
  "expiraEn": "2026-06-08T02:00:00.000Z",
  "asientos": [
    {
      "id": "uuid",
      "codigo": "A1",
      "fila": "A",
      "numero": 1
    }
  ]
}
```

***

### ⚙️ Efectos internos

* ✅ Bloquea asientos
* ✅ Guarda en DB
* ✅ Inserta en `mensajeria`
* ✅ Publica a:

```text
📤 seat_hold_queue
```

***

### ❌ Errores

#### 400 — Reserva inválida

```json
{
  "statusCode": 400,
  "message": "Debes enviar al menos un asiento"
}
```

```json
{
  "statusCode": 400,
  "message": "No puedes enviar asientos duplicados"
}
```

***

#### 409 — Asientos no disponibles

```json
{
  "statusCode": 409,
  "message": "Uno o más asientos ya están bloqueados u ocupados"
}
```

***

***

# ✅ 4. OBTENER RESERVA

## 🔹 GET `/reservas/:id`

***

### ✅ Response 200

```json
{
  "id": "uuid",
  "usuarioIdRef": "uuid",
  "funcionIdRef": "uuid",
  "estado": "PENDIENTE",
  "precioTotal": 90,
  "expiraEn": "date"
}
```

***

### ❌ Error 404

```json
{
  "statusCode": 404,
  "message": "Reserva no encontrada"
}
```

***

***

# ✅ 5. MIS RESERVAS

## 🔹 GET `/reservas/mis-reservas`

### 🔐 Requiere JWT

***

### ✅ Response 200

```json
[
  {
    "id": "uuid",
    "estado": "PENDIENTE",
    "precioTotal": 90
  }
]
```

***

***

# ✅ 6. CANCELAR RESERVA

## 🔹 DELETE `/reservas/:id`

### 🔐 Requiere JWT

***

### ✅ Response 200

```json
{
  "message": "Reserva cancelada"
}
```

***

### ⚙️ Efectos

* ✅ Libera asientos
* ✅ Actualiza DB
* ✅ Inserta en outbox
* ✅ Publica:

```text
📤 seat_release_queue
```

***

### ❌ Errores

#### 404

```json
{
  "message": "Reserva no encontrada"
}
```

***

#### 400

```json
{
  "message": "Solo se pueden cancelar reservas en estado PENDIENTE"
}
```

***

#### 403

```json
{
  "message": "No puedes cancelar una reserva que no te pertenece"
}
```

***

***

# ✅ 7. CONFIRMAR RESERVA

## 🔹 POST `/reservas/:id/confirmar`

***

### 📥 Request

```json
{
  "referenciaPago": "uuid-opcional"
}
```

***

### ✅ Response 200

```json
{
  "estado": "CONFIRMADA"
}
```

***

### ⚙️ Efectos

* ✅ Cambia estado a CONFIRMADA
* ✅ Ocupa asientos
* ✅ Guarda evento outbox
* ✅ Publica:

```text
📤 payment_process_queue
📤 ticket_issued_queue
```

***

### ❌ Errores

#### 404

```json
{
  "message": "Reserva no encontrada"
}
```

***

#### 400

```json
{
  "message": "Solo se pueden confirmar reservas en estado PENDIENTE"
}
```

***

***

# ✅ ERRORES GENERALES (GLOBAL)

## 🔴 401 - JWT

```json
{
  "statusCode": 401,
  "message": "Token inválido o expirado"
}
```

***

## 🔴 500 - Internal

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

***

# ✅ INTEGRACIÓN CON RABBITMQ (RESUMEN)

| Evento           | Cola                              |
| ---------------- | --------------------------------- |
| crear reserva    | seat\_hold\_queue                 |
| cancelar reserva | seat\_release\_queue              |
| expirar reserva  | seat\_release\_queue              |
| confirmar pago   | payment\_process\_queue           |
| ticket emitido   | ticket\_issued\_queue             |
| resultado pago   | payment\_result\_queue (consumer) |

***

# ✅ FLUJO COMPLETO

```text
POST /reservas
   ↓
📤 seat_hold_queue

CONFIRMAR
   ↓
📤 payment_process_queue

PAYMENTS SERVICE
   ↓
📤 payment_result_queue

RESERVAS SERVICE (consumer)
   ↓
confirmarReserva()

   ↓
📤 ticket_issued_queue
```

***

# ✅ CONCLUSIÓN

Ya tienes documentación:

✅ clara  
✅ alineada a tu código  
✅ con errores  
✅ con efectos internos  
✅ con RabbitMQ  
✅ lista para frontend o backend

***

