okay mira vamos a realizar otro servicio:

te doy un resumen de lo que estoy trabajando:

Actualmente tengo este flujo:

todo el servicio de reservas ya lo tengo
"
## CDU004: Reserva y Compra de Boletos

Sus expandidos serían:

- CDU004.1: Seleccionar función y asientos
- CDU004.2: Bloquear asientos temporalmente
- CDU004.3: Procesar pago
- CDU004.4: Confirmar compra y emitir boleto
- CDU004.5: Cancelar reserva

![CDU004_ReservaCompraBoletos](imgs/CDU004_%20Reserva%20y%20Compra%20de%20Boletos.png)

---

| Campo             | Detalle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre            | Seleccionar función y asientos                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Código            | CDU004.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Actores           | Usuario                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Descripción       | Permite al usuario seleccionar una función disponible y elegir sus asientos en el mapa interactivo de la sala, visualizando en tiempo real el estado de cada asiento (Disponible, Ocupado o Bloqueado temporalmente).                                                                                                                                                                                                                                                                                                                   |
| Precondiciones    | - El usuario debe estar autenticado.<br>- Existe al menos una función disponible con asientos libres (CDU003.4).                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Post Condiciones  | - Los asientos seleccionados quedan bloqueados temporalmente para el usuario.<br>- El usuario puede proceder al pago.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Flujo principal   | 1. El usuario selecciona la función deseada desde el listado de funciones (CDU003.4).<br>2. El sistema muestra el mapa interactivo de la sala con el estado de cada asiento.<br>3. El usuario identifica los asientos disponibles (marcados en verde).<br>4. El usuario selecciona uno o más asientos disponibles.<br>5. El sistema valida que los asientos seleccionados sigan disponibles.<br>6. El sistema bloquea temporalmente los asientos seleccionados (CDU004.2).<br>7. El sistema muestra el resumen de la selección (asientos, película, función, precio total).<br>8. El usuario confirma la selección y procede al pago. |
| Flujos alternos   | **FA1: El asiento fue ocupado por otro usuario mientras se seleccionaba**<br>FA1.1 El sistema detecta el conflicto en tiempo real.<br>FA1.2 El sistema notifica "El asiento [X] ya no está disponible".<br>FA1.3 El asiento se marca como ocupado en el mapa.<br>FA1.4 El usuario selecciona otro asiento disponible.<br><br>**FA2: El usuario no selecciona ningún asiento**<br>FA2.1 El sistema no habilita el botón de continuar.<br>FA2.2 El usuario debe seleccionar al menos un asiento para continuar. |
| Reglas de negocio | - Un usuario no puede seleccionar más asientos de los permitidos por función (máximo definido por el sistema).<br>- Los asientos seleccionados deben bloquearse de inmediato para evitar condiciones de carrera.<br>- El estado del mapa de asientos debe actualizarse en tiempo real. |
| Flujo de excepción | **FE1: Error del servidor al cargar el mapa de asientos**<br>FE1.1 El sistema intenta cargar el mapa de asientos pero el servicio no responde.<br>FE1.2 El sistema muestra mensaje: "Error al cargar el mapa de asientos. Inténtelo de nuevo".<br>FE1.3 El sistema ofrece un botón de reintento.<br><br>**FE2: Inconsistencia en tiempo real de la disponibilidad**<br>FE2.1 El usuario selecciona asientos que aparecen disponibles pero al confirmar ya están ocupados por otro usuario.<br>FE2.2 El sistema detecta la inconsistencia y notifica: "Los asientos seleccionados ya no están disponibles".<br>FE2.3 El mapa se refresca con la disponibilidad actual.<br>FE2.4 El usuario debe seleccionar otros asientos. |
| Reglas de calidad | - El mapa interactivo debe ser visualmente claro: verde (disponible), rojo (ocupado), amarillo (seleccionado/bloqueado temporalmente).<br>- La respuesta del sistema al seleccionar un asiento no debe exceder 1 segundo. |

---

| Campo             | Detalle                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre            | Bloquear asientos temporalmente                                                                                                                                                                                                                                                                                                                                                                 |
| Código            | CDU004.2                                                                                                                                                                                                                                                                                                                                                                                        |
| Actores           | Sistema                                                                                                                                                                                                                                                                                                                                                                                         |
| Descripción       | El sistema bloquea los asientos seleccionados por el usuario de forma temporal mientras este completa el proceso de pago, impidiendo que otros usuarios los seleccionen simultáneamente y evitando condiciones de carrera.                                                                                                                                                                       |
| Precondiciones    | - El usuario ha seleccionado al menos un asiento disponible (CDU004.1).                                                                                                                                                                                                                                                                                                                         |
| Post Condiciones  | - Los asientos quedan bloqueados temporalmente en el sistema, visibles como no disponibles para otros usuarios.<br>- Si el pago no se completa en el tiempo límite, los asientos son liberados automáticamente.                                                                                                                                                                                 |
| Flujo principal   | 1. El usuario confirma la selección de asientos.<br>2. El sistema envía la solicitud de bloqueo a la cola de mensajería.<br>3. El consumidor del servicio de reservas procesa el bloqueo de forma asíncrona.<br>4. El sistema actualiza el estado de los asientos a "Bloqueado temporalmente".<br>5. El sistema inicia el temporizador de reserva temporal.<br>6. El sistema notifica al usuario el tiempo disponible para completar el pago. |
| Flujos alternos   | **FA1: El asiento ya fue bloqueado por otro usuario en el mismo instante**<br>FA1.1 El servicio de reservas detecta el conflicto en la cola de mensajería.<br>FA1.2 El sistema notifica al usuario que el asiento ya no está disponible.<br>FA1.3 El mapa de asientos se actualiza en tiempo real.<br>FA1.4 El usuario selecciona otro asiento.<br><br>**FA2: Tiempo de reserva expirado**<br>FA2.1 El temporizador llega a cero sin completarse el pago.<br>FA2.2 El sistema libera automáticamente los asientos bloqueados.<br>FA2.3 El sistema notifica al usuario que su reserva ha expirado.<br>FA2.4 El usuario puede reiniciar el proceso de selección. |
| Reglas de negocio | - El bloqueo temporal tiene una duración máxima de 10 minutos.<br>- La gestión de bloqueos debe realizarse de forma asíncrona mediante la cola de mensajería para evitar condiciones de carrera.<br>- Al expirar el tiempo, los asientos se liberan automáticamente sin intervención manual. |
| Flujo de excepción | **FE1: Error en la cola de mensajería al procesar el bloqueo**<br>FE1.1 El sistema envía la solicitud a la cola pero el mensaje no se procesa.<br>FE1.2 El sistema detecta la falla y notifica: "Error al reservar los asientos. Inténtelo de nuevo".<br>FE1.3 Los asientos no se bloquean y siguen disponibles para el usuario.<br><br>**FE2: Fallo del temporizador de reserva**<br>FE2.1 El sistema bloquea los asientos pero el temporizador no se inicializa correctamente.<br>FE2.2 El sistema detecta el error tras 1 minuto y libera los asientos automáticamente.<br>FE2.3 El usuario es notificado de que debe reiniciar el proceso.<br>FE2.4 Se genera un registro de error para el equipo de desarrollo. |
| Reglas de calidad | - El temporizador debe ser visible para el usuario durante todo el proceso de pago.<br>- La liberación automática de asientos debe ejecutarse sin afectar el rendimiento del sistema.<br>- El sistema debe garantizar consistencia en el estado de los asientos entre múltiples sesiones concurrentes. |

---

| Campo             | Detalle                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre            | Procesar pago                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Código            | CDU004.3                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Actores           | Usuario, Sistema de pago                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Descripción       | Permite al usuario completar la transacción económica para confirmar la compra de sus boletos, procesando el pago a través del sistema de pago integrado y garantizando la integridad de la transacción ante posibles fallos del sistema.                                                                                                                                                                                                                                        |
| Precondiciones    | - El usuario tiene asientos bloqueados temporalmente (CDU004.2).<br>- El tiempo de reserva temporal no ha expirado.                                                                                                                                                                                                                                                                                                                                                             |
| Post Condiciones  | - Pago procesado exitosamente y transacción registrada en el sistema.<br>- O bien, pago rechazado y asientos aún bloqueados para reintento dentro del tiempo límite.                                                                                                                                                                                                                                                                                                            |
| Flujo principal   | 1. El sistema muestra el resumen de la compra (película, función, asientos, precio total).<br>2. El usuario selecciona el método de pago.<br>3. El usuario ingresa los datos de pago requeridos.<br>4. El usuario confirma el pago presionando "Pagar".<br>5. El sistema envía la transacción a la cola de mensajería para su procesamiento asíncrono.<br>6. El sistema de pago procesa la transacción.<br>7. El sistema recibe confirmación del pago exitoso.<br>8. El sistema registra la transacción y procede a confirmar la compra (CDU004.4). |
| Flujos alternos   | **FA1: Datos de pago incompletos o inválidos**<br>FA1.1 El sistema notifica los campos incorrectos.<br>FA1.2 El usuario corrige los datos.<br>FA1.3 Continúa flujo principal en el paso 5.<br><br>**FA2: Pago rechazado por el sistema de pago**<br>FA2.1 El sistema notifica "El pago fue rechazado".<br>FA2.2 El sistema permite al usuario intentar con otro método de pago.<br>FA2.3 Los asientos permanecen bloqueados si el tiempo no ha expirado.<br><br>**FA3: Fallo del sistema durante el pago**<br>FA3.1 La transacción queda pendiente en la cola de mensajería.<br>FA3.2 El sistema reintenta el procesamiento automáticamente.<br>FA3.3 Si el reintento falla, el sistema notifica al usuario y libera los asientos.<br>FA3.4 La transacción no se pierde gracias al mecanismo de cola persistente. |
| Reglas de negocio | - El pago debe procesarse de forma asíncrona mediante la cola de mensajería para garantizar la integridad ante caídas del sistema.<br>- No se puede confirmar una compra sin un pago exitoso.<br>- Los asientos permanecen bloqueados durante el proceso de pago hasta el tiempo límite. |
| Flujo de excepción | **FE1: Error del sistema de pago externo**<br>FE1.1 El sistema envía la transacción al servicio de pago pero este no responde o devuelve un error no controlado.<br>FE1.2 El sistema marca la transacción como "Pendiente de verificación".<br>FE1.3 El sistema notifica al usuario: "Su pago está en proceso de verificación. Recibirá una notificación por correo".<br>FE1.4 El sistema programa un reintento automático de verificación cada 5 minutos por 30 minutos.<br><br>**FE2: Fallo de la base de datos durante el registro del pago**<br>FE2.1 El pago es procesado exitosamente por el servicio externo pero falla el registro en la base de datos local.<br>FE2.2 El sistema detecta la inconsistencia al intentar confirmar la compra.<br>FE2.3 El sistema marca la transacción como "Requiere verificación manual".<br>FE2.4 El usuario recibe acceso provisional a los boletos mientras se resuelve el conflicto.<br>FE2.5 El equipo de soporte recibe una alerta de alta prioridad. |
| Reglas de calidad | - El tiempo de espera visible para el usuario durante el procesamiento no debe exceder 5 segundos.<br>- Las transacciones fallidas deben poder reintentarse sin pérdida de datos.<br>- Los datos de pago deben transmitirse y almacenarse de forma segura y cifrada. |

---

| Campo             | Detalle                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre            | Confirmar compra y emitir boleto                                                                                                                                                                                                                                                                                                                                                          |
| Código            | CDU004.4                                                                                                                                                                                                                                                                                                                                                                                  |
| Actores           | Usuario                                                                                                                                                                                                                                                                                                                                                                                   |
| Descripción       | Tras la confirmación del pago exitoso, el sistema confirma la compra de forma definitiva, convierte el bloqueo temporal en una reserva permanente, genera el boleto digital y lo entrega al usuario.                                                                                                                                                                                     |
| Precondiciones    | - El pago ha sido procesado exitosamente (CDU004.3).<br>- Los asientos aún se encuentran bloqueados para el usuario.                                                                                                                                                                                                                                                                      |
| Post Condiciones  | - Los asientos quedan marcados como "Ocupados" de forma permanente.<br>- El boleto digital es generado y entregado al usuario.<br>- La transacción queda registrada en el historial del usuario.                                                                                                                                                                                          |
| Flujo principal   | 1. El sistema recibe confirmación del pago exitoso desde la cola de mensajería.<br>2. El sistema actualiza el estado de los asientos de "Bloqueado temporalmente" a "Ocupado".<br>3. El sistema genera el boleto digital con la información de la función, asientos.<br>4. El sistema muestra el boleto al usuario en pantalla.<br>5. El sistema envía el boleto al correo electrónico del usuario.<br>6. El sistema registra la compra en el historial del usuario. |
| Flujos alternos   | **FA1: Error al generar el boleto**<br>FA1.1 El sistema registra el error sin liberar los asientos (el pago ya fue procesado).<br>FA1.2 El sistema notifica al usuario e indica que el boleto será enviado por correo en breve.<br>FA1.3 El sistema reintenta la generación del boleto de forma automática.<br><br>**FA2: Error al enviar el correo**<br>FA2.1 El boleto se mantiene disponible en la sección "Mis boletos" del perfil del usuario.<br>FA2.2 El sistema notifica que el correo no pudo enviarse y sugiere descargarlo manualmente. |
| Reglas de negocio | - El boleto solo puede generarse tras un pago confirmado exitosamente.<br>- Cada boleto debe contener un código único e irrepetible para su validación en taquilla.<br>- Los asientos confirmados no pueden ser liberados ni reasignados. |
| Flujo de excepción | **FE1: Error al registrar la compra en la base de datos**<br>FE1.1 El pago fue procesado pero el sistema no puede registrar la compra definitiva.<br>FE1.2 El sistema marca la transacción como "Compra pendiente de confirmación".<br>FE1.3 El sistema notifica al usuario que sus boletos están en proceso de generación.<br>FE1.4 El sistema reintenta automáticamente la confirmación cada 2 minutos.<br>FE1.5 Si persiste el fallo, se notifica al equipo de soporte para intervención manual.<br><br>**FE2: Fallo crítico en la generación del boleto digital**<br>FE2.1 Tras múltiples intentos, el sistema no puede generar el boleto digital.<br>FE2.2 El sistema notifica al usuario que sus asientos están confirmados pero el boleto tardará en generarse.<br>FE2.3 El sistema genera un código de confirmación temporal que el usuario puede usar en taquilla.<br>FE2.4 El equipo de soporte recibe alerta para generar el boleto manualmente. |
| Reglas de calidad | - El boleto debe generarse y mostrarse en menos de 3 segundos tras la confirmación del pago.<br>- El boleto debe estar disponible en el perfil del usuario para descarga posterior. |

---

| Campo             | Detalle                                                                                                                                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre            | Cancelar reserva                                                                                                                                                                                                                                                                                           |
| Código            | CDU004.5                                                                                                                                                                                                                                                                                                   |
| Actores           | Usuario                                                                                                                                                                                                                                                                                                    |
| Descripción       | Permite al usuario cancelar una reserva de asientos bloqueados temporalmente antes de completar el pago, liberando los asientos para que otros usuarios puedan adquirirlos.                                                                                                                                |
| Precondiciones    | - El usuario tiene asientos bloqueados temporalmente.<br>- El tiempo de reserva temporal aún no ha expirado.                                                                                                                                                                                              |
| Post Condiciones  | - Los asientos bloqueados son liberados y quedan disponibles para otros usuarios.<br>- El proceso de compra del usuario es cancelado sin cargo alguno.                                                                                                                                                     |
| Flujo principal   | 1. El usuario presiona "Cancelar reserva" o "Volver a la cartelera" durante el proceso de compra.<br>2. El sistema solicita confirmación de la cancelación.<br>3. El usuario confirma la cancelación.<br>4. El sistema libera los asientos bloqueados.<br>5. El sistema actualiza el mapa de asientos en tiempo real.<br>6. El sistema redirige al usuario a la cartelera. |
| Flujos alternos   | **FA1: El usuario no confirma la cancelación**<br>FA1.1 El sistema mantiene los asientos bloqueados.<br>FA1.2 El usuario puede continuar con el proceso de pago.<br><br>**FA2: El tiempo de reserva expira antes de que el usuario cancele manualmente**<br>FA2.1 El sistema libera los asientos automáticamente (CDU004.2, FA2).<br>FA2.2 El sistema notifica al usuario que la reserva expiró. |
| Reglas de negocio | - La cancelación de un bloqueo temporal no tiene costo para el usuario.<br>- Solo se pueden cancelar reservas que aún están en estado de bloqueo temporal (no compras confirmadas).<br>- Los asientos liberados deben quedar disponibles de inmediato para otros usuarios. |
| Flujo de excepción | **FE1: Error al liberar los asientos bloqueados**<br>FE1.1 El usuario confirma la cancelación pero el sistema no puede liberar los asientos en la base de datos.<br>FE1.2 El sistema notifica: "Error al cancelar la reserva. Inténtelo de nuevo".<br>FE1.3 El sistema mantiene los asientos bloqueados y permite reintentar la cancelación.<br>FE1.4 Si el error persiste, el sistema libera los asientos automáticamente al expirar el temporizador.<br><br>**FE2: Fallo en la notificación de cancelación al usuario**<br>FE2.1 Los asientos se liberan correctamente pero el sistema no puede confirmar la cancelación al usuario.<br>FE2.2 El usuario recibe un mensaje ambiguo pero al regresar a la cartelera puede verificar que la reserva fue cancelada.<br>FE2.3 El sistema registra la falla de notificación para revisión técnica. |
| Reglas de calidad | - La liberación de los asientos debe procesarse en menos de 2 segundos.<br>- El mapa de asientos debe actualizarse en tiempo real para todos los usuarios conectados.<br>- La confirmación de cancelación debe presentarse en una ventana modal clara. |
"


son entos enpoints:
"# DOCUMENTACIÓN DE ENDPOINTS — RESERVAS SERVICE

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

"

y mi servico hace esto:
"

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
"

integrado con rabittmq

yo ahora lo que tengo que hacer son los pagos eso se ejecuta desde otro servico.
teoricamente es una api externa que consultamos y por ellos nosotros solo la llamaos para que haga el pago entonces yo tengo que hacer el servicio que haga eso, y algo que simule ser el api externo.
que sea un archivo en el mismo serivicio que lo llamemos y ya haga el pago.

quiero que sea sencillo nada extermandamente grande pocos enpoints que hagan solo el pago y ya una que otra cosa necesaria mas.



"Descripción del problema
Una importante cadena de cines desea modernizar su plataforma digital para permitir la venta de boletos en línea. El sistema debe de ser capaz de gestionar picos altos de demanda de manera eficiente garantizando que no ocurran condiciones de carrera al seleccionar asientos de forma simultánea, y evitando la pérdida de transacciones financieras ante caídas del sistema.
Para complir con estos atributos de calidad, el departamento de ingeniería ha determinado que el sistema se construirá bajo un enfoque de Arquitectura Orientada a Servicios (SOA). La comunicación crítica entre servicios debe gestionarse obligatoriamente de forma asíncrona, utilizando un middleware de mensajería basado en colas.
En la práctica anterior, se diseñó la arquitectura base para el sistema de reserva y venta de boletos de cine bajo un enfoque Orientado a Servicios (SOA). Para esta segunda iteración, el objetivo principal es trasladar el diseño a un sistema de software completamente funcional, elevando los estándares de calidad en la construcción del código e implementando el esquema de seguridad para el control de acceso.
El desarrollo de esta fase exige la aplicación rigurosa de los Principios SOLID de diseño orientado a objetos. Esto garantizará que los servicios (como la cartelera, usuarios o pagos) sean tolerantes al cambio, fáciles de mantener y probar de forma aislada. Asimismo, se debe asegurar la frontera del sistema implementando autenticación basada en claims mediante JWT (JSON Web Tokens). Alcance del sistema
El sistema final entregado debe fusionar las capacidades de la práctica anterior con los nuevos componentes de seguridad:
1. Módulo de Autenticación y Sesión (Nuevo)
● Registro de usuarios: Formulario con validaciones en el frontend y persistencia segura (contraseñas encriptadas en la base de datos).
● Inicio de Sesión: Validación de credenciales en el servicio de usuarios.
● Emisión y Gestión de JWT: Tras un login exitoso, el backend debe firmar y retornar un token JWT que almacene los claims esenciales del usuario (ej. ID, Nombre, Rol). El frontend debe capturar y enviar este token en la cabecera HTTP (Authorization: Bearer <token>) para acceder a las rutas protegidas (como el flujo de compra y selección de asientos).
2. Selección de Ubicación y Funciones
● El usuario debe de poder seleccionar su ciudad para visualizar dinámicamente los cines y los horarios/funciones disponibles en dicha localidad.
3. Visualización de películas por categoría
● Clasificación y despliegue de la cartelera segmentada según el tipo de proyección: Estrenos, Pre-ventas, Re-Estrenos.
4. Selección de Asientos en Tiempo real
● Mapa interactivo de la sala para la función seleccionada. Se debe mapear visualmente el estado de cada asiento (Disponible, Ocupado, Seleccionado/Bloqueado temporalmente)
5. Flujo de Compra de Boleto
● Procesamiento del flujo desde que se confirma la selección de asientos, se envía la cola de mensajería para su validación, se procesa el pago simulado y se emite el boleto final. Requisitos y restricciones
Cada dominio conceptual (Usuario, Películas/Cartelera, Reservas/Asientos, Pagos) debe de modelarse como servicio independiente con su propio almacenamiento o lógica de acceso a datos.
Los procesos donde la concurrencia sea crítica deben de desacoplarse mediante un bróker de mensajería. Las peticiones no deben bloquear el hijo principal de la aplicación, en su lugar, deben de entrar a cola y serán procesadas por consumidores independientes.
Esta práctica NO consiste únicamente en la entrega de endpoints o APIs en el backend. Se requiere obligatoriamente una aplicación web funcional de extremo a extremo (End-to-End), lo que incluye una interfaz de usuario (Frontend) interactiva e integrada con los servicios mediante consumo de APIs
Requisitos Técnicos y de Arquitectura
1. Principios SOLID (Calidad de código)
Los estudiantes deberán demostrar de forma explícita en su código fuente la aplicación de los siguientes principios:
● S - Single Responsibility Principle (Responsabilidad Única)
Cada clase, controlador o servicio de backend debe tener una única razón para cambiar (ej. separar la lógica de negocio de la reserva de la lógica de persistencia de datos o del envío a la cola de mensajería).
● O - Open/Closed Principle (Abierto/Cerrado):
El software debe estar abierto para su extensión pero cerrado para su modificación (ej. el sistema de cálculo de precios según el tipo de función—estreno, preventa o re-estreno—debe permitir añadir nuevas reglas sin modificar las clases existentes).
● L - Liskov Substitution Principle (Sustitución de Liskov):
Las clases derivadas deben poder sustituir a sus clases base sin alterar el comportamiento del programa.
● I - Interface Segregation Principle (Segregación de Interfaces):
Los clientes no deben ser obligados a depender de interfaces o métodos que no utilizan.
● D - Dependency Inversion Principle (Inversión de Dependencias):
Los módulos de alto nivel no deben depender de módulos de bajo nivel; ambos deben depender de abstracciones (uso estricto de interfaces para desacoplar controladores de servicios y servicios de repositorios de datos). "

okay yo estoy haciendo:

Servicio de Pagos	Procesar pago
	Registrar transacción

esta parte va ir conectado a un Rabitt MQ en donde se va ir agregando a colas para cumplir con los siguiete un sistema asincrono: "Descripción del problema
Una importante cadena de cines desea modernizar su plataforma digital para permitir la venta de boletos en línea. El sistema debe de ser capaz de gestionar picos altos de demanda de manera eficiente garantizando que no ocurran condiciones de carrera al seleccionar asientos de forma simultánea, y evitando la pérdida de transacciones financieras ante caídas del sistema.
Para complir con estos atributos de calidad, el departamento de ingeniería ha determinado que el sistema se construirá bajo un enfoque de Arquitectura Orientada a Servicios (SOA). La comunicación crítica entre servicios debe gestionarse obligatoriamente de forma asíncrona, utilizando un middleware de mensajería basado en colas. Alcance del sistema
La aplicación web debe resolver de extremo a extremo los siguientes módulos y capacidades de negocio:
1. Selección de Ubicación y Funciones
● El usuario debe de poder seleccionar su ciudad para visualizar dinámicamente los cines y los horarios/funciones disponibles en dicha localidad.
2. Visualización de películas por categoría
● Clasificación y despliegue de la cartelera segmentada según el tipo de proyección: Estrenos, Pre-ventas, Re-Estrenos.
3. Selección de Asientos en Tiempo Real
● Mapa interactivo de la sala para la función seleccionada. Se debe mapear visualmente el estado de cada asiento (Disponible, Ocupado, Seleccionado/Bloqueado temporalmente)
4. Flujo de Compra de Boletos
● Procesamiento del flujo desde que se confirma la selección de asientos, se envía la cola de mensajería para su validación, se procesa el pago simulado y se emite el boleto final. Requisitos y restricciones
Cada dominio conceptual (Usuario, Películas/Cartelera, Reservas/Asientos, Pagos) debe de modelarse como servicio independiente con su propio almacenamiento o lógica de acceso a datos.
Los procesos donde la concurrencia sea crítica deben de desacoplarse mediante un bróker de mensajería. Las peticiones no deben bloquear el hijo principal de la aplicación, en su lugar, deben de entrar a cola y serán procesadas por consumidores independientes. "


que funcionalidades debo tener en este servicio? y cuales van al rabit MQ tenia contemplado esto: "Integración Mediante RabbitMQ RabbitMQ actúa como el componente central de comunicación asíncrona dentro de la arquitectura. Su función consiste en desacoplar los procesos críticos relacionados con reservas y pagos mediante el intercambio de eventos. En lugar de depender de llamadas directas entre servicios, los mensajes son publicados en el broker y procesados posteriormente por consumidores especializados. El componente Exchange representa el punto de entrada de los mensajes dentro de RabbitMQ. Su responsabilidad consiste en recibir eventos publicados por los servicios productores y distribuirlos hacia las colas correspondientes según las reglas de enrutamiento configuradas. Las colas reserva.solicitada, reserva.validada, pago.procesado, pago.confirmado y reserva.expirada representan canales especializados donde los mensajes permanecen almacenados hasta ser procesados por sus respectivos consumidores. Esta estrategia garantiza tolerancia a fallos, resiliencia operativa y procesamiento desacoplado de eventos. Consumers de Mensajería Dentro de los servicios de Reservas y Pagos se identifican componentes consumidores especializados encargados de procesar eventos provenientes de RabbitMQ. El componente Payment Consumer consume solicitudes de reserva y ejecuta el procesamiento financiero correspondiente. Una vez completado el pago, genera nuevos eventos que continúan el flujo de negocio. El componente Reservation Consumer consume eventos relacionados con pagos confirmados y actualiza el estado definitivo de las reservas dentro del sistema. La separación de estos consumidores respecto a los controladores HTTP constituye una decisión arquitectónica importante, ya que permite que el procesamiento de eventos se ejecute independientemente de las solicitudes web recibidas por el sistema. Esto mejora la escalabilidad y evita bloquear recursos destinados a la atención de usuarios. Scheduler de Expiración El componente Expiry Scheduler forma parte del Servicio de Reservas y tiene la responsabilidad de gestionar el vencimiento automático de bloqueos temporales sobre asientos. Cuando un usuario selecciona asientos pero abandona el proceso de compra antes de completar el pago, dichos asientos no pueden permanecer bloqueados indefinidamente, ya que afectarían la disponibilidad real mostrada al resto de clientes. El Scheduler ejecuta verificaciones periódicas sobre las reservas pendientes y publica eventos de expiración cuando detecta bloqueos vencidos. Posteriormente, estos eventos son procesados para liberar nuevamente los asientos afectados. Esta decisión garantiza la correcta utilización de los recursos disponibles y evita inconsistencias en el proceso de selección de localidades. Comunicación Entre Componentes La arquitectura combina dos mecanismos de comunicación complementarios. La comunicación síncrona se implementa mediante interfaces REST y es utilizada para operaciones que requieren respuesta inmediata, como autenticación, consulta de cartelera o disponibilidad de asientos. La comunicación asíncrona se implementa mediante RabbitMQ y se utiliza para procesos críticos donde la concurrencia y la tolerancia a fallos son factores determinantes, como la confirmación de reservas y el procesamiento de pagos. La combinación de ambos enfoques permite equilibrar simplicidad operativa y robustez arquitectónica, satisfaciendo los requisitos funcionales y no funcionales establecidos para la plataforma. " ayudame a crear la estructura solo para el

gio@gio:~/Documentos/26S1/vacas/sa/practica/SA_PRACTICA_G8/Fase2/FilmStars/payments-service$ ls
contexto1.txt  README.md  src
gio@gio:~/Documentos/26S1/vacas/sa/practica/SA_PRACTICA_G8/Fase2/FilmStars/payments-service$ ls src/
common  config  consumers  database  payments
gio@gio:~/Documentos/26S1/vacas/sa/practica/SA_PRACTICA_G8/Fase2/FilmStars/payments-service$ ls src/payments/
controllers  dto  interfaces  repositories  services
gio@gio:~/Documentos/26S1/vacas/sa/practica/SA_PRACTICA_G8/Fase2/FilmStars/payments-service$ 


como te dije queiro lo minimo minimo solo para que funcion reservas pocos enpoints

esta es la base de datos:
"CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS pago (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id_ref UUID NOT NULL,
    usuario_id_ref UUID NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(10) NOT NULL DEFAULT 'GTQ',
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    metodo_pago VARCHAR(50) NOT NULL,
    proveedor_ref VARCHAR(150),
    procesado_en TIMESTAMP,
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_pago_estado
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'FALLIDO')),

    CONSTRAINT chk_pago_monto
        CHECK (monto >= 0)
);

CREATE TABLE IF NOT EXISTS detalle_pago (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pago_id UUID NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    subtotal DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_detalle_pago_pago
        FOREIGN KEY (pago_id)
        REFERENCES pago(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_detalle_pago_subtotal
        CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS boleto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pago_id UUID NOT NULL,
    reserva_id_ref UUID NOT NULL,
    reserva_asiento_id_ref UUID NOT NULL,
    codigo_boleto VARCHAR(100) NOT NULL UNIQUE,
    codigo_qr TEXT,
    estado VARCHAR(50) NOT NULL DEFAULT 'EMITIDO',
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_boleto_pago
        FOREIGN KEY (pago_id)
        REFERENCES pago(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_boleto_estado
        CHECK (estado IN ('EMITIDO', 'USADO', 'ANULADO'))
);

CREATE TABLE IF NOT EXISTS reembolso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pago_id UUID NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    motivo TEXT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    procesado_en TIMESTAMP,

    CONSTRAINT fk_reembolso_pago
        FOREIGN KEY (pago_id)
        REFERENCES pago(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_reembolso_estado
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'PROCESADO')),

    CONSTRAINT chk_reembolso_monto
        CHECK (monto >= 0)
);

CREATE TABLE IF NOT EXISTS mensajeria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servicio_origen VARCHAR(100) NOT NULL,
    agregado_tipo VARCHAR(100) NOT NULL,
    agregado_id UUID NOT NULL,
    tipo_evento VARCHAR(100) NOT NULL,
    payload_json JSONB NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_procesado TIMESTAMP,

    CONSTRAINT chk_mensajeria_estado
        CHECK (estado IN ('PENDIENTE', 'PUBLICADO', 'PROCESADO', 'FALLIDO'))
);

CREATE INDEX IF NOT EXISTS idx_pago_reserva_id_ref
ON pago(reserva_id_ref);

CREATE INDEX IF NOT EXISTS idx_pago_usuario_id_ref
ON pago(usuario_id_ref);

CREATE INDEX IF NOT EXISTS idx_pago_estado
ON pago(estado);

CREATE INDEX IF NOT EXISTS idx_detalle_pago_pago_id
ON detalle_pago(pago_id);

CREATE INDEX IF NOT EXISTS idx_boleto_pago_id
ON boleto(pago_id);

CREATE INDEX IF NOT EXISTS idx_boleto_reserva_id_ref
ON boleto(reserva_id_ref);

CREATE INDEX IF NOT EXISTS idx_boleto_reserva_asiento_id_ref
ON boleto(reserva_asiento_id_ref);

CREATE INDEX IF NOT EXISTS idx_reembolso_pago_id
ON reembolso(pago_id);

CREATE INDEX IF NOT EXISTS idx_mensajeria_estado
ON mensajeria(estado);

CREATE INDEX IF NOT EXISTS idx_mensajeria_tipo_evento
ON mensajeria(tipo_evento);"


necesito 2 cosas la estrucutra y que va en cada parte recordando solid y los enpoints describimelos los minimo para terminar que funciones