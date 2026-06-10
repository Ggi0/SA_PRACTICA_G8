Perfecto 🔥 ahora ya entramos a la parte visible del sistema: **los controllers + health**.  
Esto convierte tu servicio en una API usable por frontend y por pruebas.

Te voy a dar TODO:

✅ archivos completos  
✅ explicación clara de cada uno  
✅ cómo encajan en el flujo  
✅ ajustes necesarios para que funcione

***

# ✅ 📁 ARCHIVOS QUE VAMOS A CREAR

```text
src/payments/controllers/payments.controller.ts
src/health/health.controller.ts
src/health/health.module.ts
```

***

# ✅ 1) 📄 `src/payments/controllers/payments.controller.ts`

***

## ✅ ¿Qué hace?

Es la capa HTTP del dominio pagos.

👉 Recibe requests  
👉 llama al service  
👉 devuelve respuesta

***

## ✅ ¿Qué representa?

El **entry point externo del microservicio de pagos**.

***

## ✅ ¿Por qué es importante?

Porque conecta:

```text
Frontend / API Gateway
        ↓
payments.controller
        ↓
payments.service
```

***

## ✅ ENPOINTS que implementa

| Método | Ruta            | Descripción    |
| ------ | --------------- | -------------- |
| POST   | `/payments`     | Procesar pago  |
| GET    | `/payments/:id` | Consultar pago |

***

## ✅ Código

```ts
// src/payments/controllers/payments.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * POST /payments
   * Procesa un pago manual (útil para pruebas o integración inicial)
   */
  @Post()
  async crearPago(@Body() dto: CreatePaymentDto) {
    const pago = await this.paymentsService.crearYProcesarPago(dto);

    return {
      id: pago.id,
      estado: pago.estado,
      monto: pago.monto,
      moneda: pago.moneda,
      reservaId: pago.reservaIdRef,
      usuarioId: pago.usuarioIdRef,
      metodoPago: pago.metodoPago,
      proveedorRef: pago.proveedorRef,
      procesadoEn: pago.procesadoEn,
    };
  }

  /**
   * GET /payments/:id
   * Obtiene un pago por su ID
   */
  @Get(':id')
  async getPago(@Param('id') id: string) {
    const pago = await this.paymentsService.getPagoById(id);

    return {
      id: pago.id,
      estado: pago.estado,
      monto: pago.monto,
      moneda: pago.moneda,
      reservaId: pago.reservaIdRef,
      usuarioId: pago.usuarioIdRef,
      metodoPago: pago.metodoPago,
      proveedorRef: pago.proveedorRef,
      procesadoEn: pago.procesadoEn,
    };
  }
}
```

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

## ✅ ¿Qué representa?

Un endpoint usado para:

* Docker healthchecks
* monitoreo
* pruebas rápidas

***

## ✅ Código

```ts
// src/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  /**
   * GET /health
   * Verifica que el servicio esté funcionando
   */
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'payments-service',
      timestamp: new Date().toISOString(),
    };
  }
}
```

***

## ✅ ¿Por qué es importante?

✔ Kubernetes / Docker lo usan  
✔ API Gateway puede usarlo  
✔ Debug rápido

***

# ✅ 3) 📄 `src/health/health.module.ts`

***

## ✅ ¿Qué hace?

Registra el controller de health.

***

## ✅ Código

```ts
// src/health/health.module.ts

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

***

# ✅ 4) 🔧 ACTUALIZAR `app.module.ts`

Necesitas registrar el módulo de health.

***

## ✅ Código actualizado

```ts
// src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { databaseConfig } from './config/database.config';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot(databaseConfig),

    PaymentsModule,
    HealthModule,
  ],
})
export class AppModule {}
```

***

# ✅ 5) 🚀 YA PUEDES PROBAR EL SERVICIO

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

# ✅ 7) 🔥 ESTADO ACTUAL DEL PROYECTO

Ya tienes:

✅ backend funcional completo  
✅ DB persistente  
✅ lógica de pago  
✅ fake API externa  
✅ endpoints  
✅ outbox listo  
✅ arquitectura SOA correcta

***

# ✅ 8) 🚀 SIGUIENTE PASO (YA FINAL)

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

***

# ✅ Si quieres avanzar

Dime:

👉 **"siguiente: rabbitmq consumer + publisher"**

y te doy:

✅ conexión AMQP lista  
✅ consumer de payment\_process\_queue  
✅ publisher de payment\_result\_queue  
✅ integración completa con reservas

🔥 y ya cierras todo el sistema end-to-end
