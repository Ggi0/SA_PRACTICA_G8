Perfecto, vas **muy bien estructurado** 👍 — ya tienes lo más difícil (reservas).  
Ahora te ayudo a diseñar **PAYMENTS SERVICE mínimo, limpio, SOLID, y listo para integrar con RabbitMQ**.

Voy directo a lo que necesitas:

***

# ✅ 1. ¿QUÉ DEBE HACER TU SERVICIO DE PAGOS? (mínimo)

Tu servicio NO es un ecommerce completo.  
Debe hacer solo esto:

## 🎯 Responsabilidades clave

1. **Recibir solicitud de pago (vía RabbitMQ)**
2. **Simular procesamiento del pago (API externa fake)**
3. **Guardar transacción en DB**
4. **Publicar resultado del pago (RabbitMQ)**

***

## 🔥 En términos simples:

```text
RESERVAS → 📤 payment_process_queue
                ↓
         PAYMENTS SERVICE (consumer)
                ↓
     simula pago externo + guarda DB
                ↓
📤 payment_result_queue (APROBADO o RECHAZADO)
```

***

# ✅ 2. EVENTOS QUE DEBES USAR EN RABBITMQ

### ✅ ENTRADA (consumer)

```text
payment_process_queue
```

Payload:

```json
{
  "reservaId": "uuid",
  "usuarioId": "uuid",
  "monto": 90,
  "asientos": ["id1", "id2"]
}
```

***

### ✅ SALIDA (publisher)

```text
payment_result_queue
```

Payload:

```json
{
  "reservaId": "uuid",
  "estado": "APROBADO" | "RECHAZADO",
  "pagoId": "uuid"
}
```

***

# ✅ 3. ENDPOINTS (MÍNIMO ABSOLUTO)

Solo necesitas 2 o 3:

***

## ✅ 1. Health

```http
GET /payments/health
```

***

## ✅ 2. Consultar pago

```http
GET /payments/:id
```

Response:

```json
{
  "id": "uuid",
  "estado": "APROBADO",
  "monto": 90,
  "reservaId": "uuid"
}
```

***

## ✅ 3. (Opcional pero útil) Crear pago manual (debug)

```http
POST /payments
```

Sirve para pruebas.

***

✅ **Y LISTO. NO MÁS ENDPOINTS.**

***

# ✅ 4. ESTRUCTURA MÍNIMA (ADAPTADA A LO QUE YA TIENES)

Tu base actual:

```text
src/
  common/
  config/
  consumers/
  database/
  payments/
```

Te la optimizo 👇

***

# ✅ ESTRUCTURA FINAL RECOMENDADA

```text
src/
├── main.ts
├── app.module.ts
│
├── config/
│   ├── env.config.ts
│   └── database.config.ts
│
├── common/
│   └── enums/
│       └── pago-estado.enum.ts
│
├── database/
│   └── entities/
│       ├── pago.entity.ts
│       ├── detalle-pago.entity.ts
│       ├── boleto.entity.ts
│       └── mensajeria.entity.ts
│
├── payments/
│   ├── payments.module.ts
│   │
│   ├── controllers/
│   │   └── payments.controller.ts
│   │
│   ├── services/
│   │   ├── payments.service.ts
│   │   └── payment-gateway.service.ts ✅ (API externa fake)
│   │
│   ├── repositories/
│   │   └── pago.repository.ts
│   │
│   └── dto/
│       └── create-payment.dto.ts
│
├── consumers/
│   └── payment.consumer.ts ✅
│
└── messaging/
    ├── publisher.interface.ts
    └── rabbitmq.publisher.ts
```

***

# ✅ 5. ¿QUÉ VA EN CADA PARTE?

***

## ✅ `payment.consumer.ts`

### 🔥 EL MÁS IMPORTANTE

Escucha RabbitMQ:

```text
payment_process_queue
```

Llama a:

```ts
paymentsService.procesarPago(...)
```

***

## ✅ `payments.service.ts`

### 🎯 CORE DEL NEGOCIO

Hace:

1. Crear pago en DB (`PENDIENTE`)
2. Llamar al gateway fake
3. Cambiar estado (`APROBADO` o `RECHAZADO`)
4. Guardar en mensajería (outbox)
5. Publicar evento

***

## ✅ `payment-gateway.service.ts` 🔥 (SIMULADOR)

Este es tu "API externa fake"

Ejemplo:

```ts
procesarPago(monto: number): 'APROBADO' | 'RECHAZADO' {
  const random = Math.random();

  if (random > 0.2) {
    return 'APROBADO';
  }

  return 'RECHAZADO';
}
```

✅ Simple  
✅ Perfecto para tu práctica  
✅ Cumple arquitectura

***

## ✅ `pago.repository.ts`

Encapsula DB:

* crear pago
* actualizar estado
* buscar por id

***

## ✅ `payments.controller.ts`

Solo:

```text
GET /payments/:id
GET /payments/health
```

***

## ✅ `mensajeria.entity.ts`

👉 EXACTAMENTE igual que en reservas (outbox pattern)

***

## ✅ `rabbitmq.publisher.ts`

Publica:

```text
payment_result_queue
```

***

# ✅ 6. FLUJO COMPLETO (TU ENTREGA)

```text
CLIENTE
  ↓
POST /reservas
  ↓
📤 seat_hold_queue

CONFIRMAR RESERVA
  ↓
📤 payment_process_queue
  ↓
      (consumer)
      PAYMENTS SERVICE
          ↓
      simula pago
          ↓
      guarda DB pago
          ↓
📤 payment_result_queue
  ↓
RESERVAS SERVICE (consumer)
  ↓
confirmarReserva()
  ↓
📤 ticket emitido
```

***

# ✅ 7. CÓMO APLICAS SOLID (IMPORTANTE PARA NOTA)

***

## ✅ S - Single Responsibility

✔ `payment.consumer.ts` → solo consume  
✔ `payments.service.ts` → lógica negocio  
✔ `payment-gateway.service.ts` → simula API  
✔ `repository` → DB

***

## ✅ O - Open/Closed

Puedes agregar:

```ts
StripeGateway
PayPalGateway
```

sin tocar el service.

***

## ✅ D - Dependency Inversion (CLAVE)

```ts
constructor(
  private readonly gateway: PaymentGatewayInterface
)
```

NO dependes de implementación concreta.

***

## ✅ I - Interface Segregation

```ts
interface PaymentGateway {
  procesarPago(monto: number): string;
}
```

Simple ✅

***

## ✅ L - Liskov

Cualquier gateway debe comportarse igual.

***

# ✅ 8. CONCLUSIÓN (LO QUE TU PROFE QUIERE VER)

Tu servicio de pagos:

✅ pequeño  
✅ desacoplado  
✅ asincrónico  
✅ usa RabbitMQ  
✅ usa outbox  
✅ respeta SOLID  
✅ tiene simulación de API externa  
✅ no es CRUD innecesario

***

# 🚀 RESUMEN FINAL (LO MÁS IMPORTANTE)

Solo necesitas:

### ✔ 1 CONSUMER

```text
payment_process_queue
```

### ✔ 1 PRODUCER

```text
payment_result_queue
```

### ✔ 1 SERVICE

```ts
procesarPago()
```

### ✔ 1 SIMULADOR API

```ts
payment-gateway.service.ts
```

### ✔ 2 ENDPOINTS

***



-----------------------------------------------------------



Perfecto. Vamos con la **siguiente parte funcional real** del `payments-service`: el **service** y el **fake gateway**, **sin conectar aún RabbitMQ**, pero **dejando el diseño preparado** para enchufarlo después sin romper nada.

Te lo doy **listo para copiar**, explicándote en cada archivo:

* **ruta**
* **qué hace**
* **por qué es importante en el flujo**
* **código funcional**

Además te doy un **ajuste pequeño al repository y al module**, porque para que el service funcione bien hace falta registrar proveedores y guardar también el resultado del pago + outbox.

***

# ✅ VISIÓN DEL FLUJO QUE VAMOS A IMPLEMENTAR AHORA

De momento, sin RabbitMQ conectado todavía, tu flujo quedará así:

```text
POST /payments
      ↓
payments.controller
      ↓
payments.service
      ↓
1) crea pago PENDIENTE en DB
2) llama fake gateway
3) actualiza estado del pago
4) guarda evento en mensajeria (outbox)
5) devuelve resultado

GET /payments/:id
      ↓
consulta el pago ya guardado
```

Luego, cuando metas RabbitMQ, simplemente harás esto:

```text
payment.consumer
      ↓
payments.service.procesarPago(...)
      ↓
outbox / publisher
```

O sea: **el núcleo del negocio ya queda listo hoy**.

***

***

# 1) 📄 `src/payments/interfaces/payment-gateway.interface.ts`

## ✅ ¿Qué hace?

Define el **contrato** que debe cumplir cualquier proveedor de pagos.

## ✅ ¿Por qué es importante?

Porque el `payments.service.ts` no debe depender de una clase concreta como `FakePaymentGatewayService`, sino de una **abstracción**.

Eso aplica **D de SOLID (Dependency Inversion Principle)**.

## ✅ ¿Qué representa?

Representa “una API externa de pagos”, aunque ahorita sea simulada.

***

## ✅ Código

```ts
// src/payments/interfaces/payment-gateway.interface.ts

import { PagoEstado } from '../../common/enums/pago-estado.enum';

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

export interface PaymentGatewayRequest {
  pagoId: string;
  reservaId: string;
  usuarioId: string;
  monto: number;
  moneda: string;
  metodoPago: string;
}

export interface PaymentGatewayResponse {
  estado: PagoEstado;
  proveedorRef: string;
  mensaje: string;
  procesadoEn: Date;
}

export interface PaymentGatewayInterface {
  procesarPago(
    payload: PaymentGatewayRequest,
  ): Promise<PaymentGatewayResponse>;
}
```

***

## ✅ Por qué es importante en el flujo

El service hará esto:

```text
payments.service
   ↓
PaymentGatewayInterface
   ↓
Fake gateway hoy / API real mañana
```

Y así tu arquitectura no queda acoplada.

***

# 2) 📄 `src/payments/dto/create-payment.dto.ts`

## ✅ ¿Qué hace?

Define el body del endpoint manual:

```http
POST /payments
```

## ✅ ¿Por qué es importante?

Valida los datos de entrada antes de que lleguen al service.

## ✅ ¿Qué representa?

La solicitud mínima para procesar un pago desde HTTP.

***

## ✅ Código

```ts
// src/payments/dto/create-payment.dto.ts

import {
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsUUID()
  reservaId: string;

  @IsUUID()
  usuarioId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  monto: number;

  @IsOptional()
  @IsString()
  @Length(3, 10)
  moneda?: string = 'GTQ';

  @IsString()
  @Length(2, 50)
  metodoPago: string;
}
```

***

## ✅ Por qué es importante en el flujo

Impide que lleguen cosas como:

* monto negativo
* UUID inválido
* método de pago vacío

Eso evita errores más abajo.

***

# 3) 📄 `src/payments/services/payment-gateway.service.ts`

## ✅ ¿Qué hace?

Simula el comportamiento de una API externa de pago.

## ✅ ¿Por qué es importante?

Porque el proyecto necesita modelar que **pagos se procesa en otro sistema**, pero tú no quieres depender todavía de una API real.

## ✅ ¿Qué representa?

La “pasarela externa” o “proveedor” de cobro.

***

## ✅ Diseño recomendado

Para que sea fácil de probar, en lugar de pura aleatoriedad, haremos una simulación **determinista**:

* `metodoPago = "TEST_APROBADO"` → aprueba
* `metodoPago = "TEST_RECHAZADO"` → rechaza
* `metodoPago = "TEST_FALLIDO"` → lanza error
* cualquier otro → aprueba por defecto

👉 Esto te sirve muchísimo para frontend y pruebas.

***

## ✅ Código

```ts
// src/payments/services/payment-gateway.service.ts

import { Injectable } from '@nestjs/common';
import { PagoEstado } from '../../common/enums/pago-estado.enum';
import {
  PaymentGatewayInterface,
  PaymentGatewayRequest,
  PaymentGatewayResponse,
} from '../interfaces/payment-gateway.interface';

@Injectable()
export class FakePaymentGatewayService implements PaymentGatewayInterface {
  /**
   * Simula una API externa de pagos.
   *
   * Reglas de prueba:
   * - TEST_APROBADO  => APROBADO
   * - TEST_RECHAZADO => RECHAZADO
   * - TEST_FALLIDO   => lanza error
   * - cualquier otro => APROBADO
   */
  async procesarPago(
    payload: PaymentGatewayRequest,
  ): Promise<PaymentGatewayResponse> {
    const metodo = payload.metodoPago.trim().toUpperCase();

    // pequeño delay artificial para simular un tercero
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (metodo === 'TEST_FALLIDO') {
      throw new Error('Fallo simulado del proveedor externo');
    }

    if (metodo === 'TEST_RECHAZADO') {
      return {
        estado: PagoEstado.RECHAZADO,
        proveedorRef: `fake-reject-${payload.pagoId}`,
        mensaje: 'Pago rechazado por el proveedor simulado',
        procesadoEn: new Date(),
      };
    }

    return {
      estado: PagoEstado.APROBADO,
      proveedorRef: `fake-ok-${payload.pagoId}`,
      mensaje: 'Pago aprobado por el proveedor simulado',
      procesadoEn: new Date(),
    };
  }
}
```

***

## ✅ Por qué es importante en el flujo

Este archivo te permite demostrar que:

* el servicio de pagos **no procesa el pago “dentro” del controlador**
* existe una frontera externa
* luego puedes reemplazarlo por una API real sin reescribir la lógica central

***

# 4) 📄 `src/payments/services/payments.service.ts`

## ✅ ¿Qué hace?

Es el **núcleo de negocio** del servicio de pagos.

## ✅ ¿Por qué es importante?

Porque coordina todo el flujo:

1. crear pago pendiente
2. llamar al fake gateway
3. actualizar resultado
4. guardar evento en `mensajeria`
5. devolver el resultado

## ✅ ¿Qué representa?

La lógica central del dominio “Pagos”.

***

## ✅ Código

```ts
// src/payments/services/payments.service.ts

import {
  Inject,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PagoRepository } from '../repositories/pago.repository';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { PagoEstado } from '../../common/enums/pago-estado.enum';
import { MensajeriaEntity } from '../../database/entities/mensajeria.entity';
import { PagoEntity } from '../../database/entities/pago.entity';
import {
  PAYMENT_GATEWAY,
  PaymentGatewayInterface,
} from '../interfaces/payment-gateway.interface';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly pagoRepository: PagoRepository,

    @InjectRepository(MensajeriaEntity)
    private readonly mensajeriaRepo: Repository<MensajeriaEntity>,

    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGatewayInterface,
  ) {}

  /**
   * Procesa un pago completo de inicio a fin:
   * 1) crea pago pendiente
   * 2) llama al proveedor fake
   * 3) actualiza el estado final
   * 4) guarda outbox en mensajeria
   */
  async crearYProcesarPago(dto: CreatePaymentDto): Promise<PagoEntity> {
    // 1. Crear pago pendiente
    const pago = await this.pagoRepository.createPago({
      reservaIdRef: dto.reservaId,
      usuarioIdRef: dto.usuarioId,
      monto: dto.monto.toFixed(2),
      moneda: dto.moneda ?? 'GTQ',
      metodoPago: dto.metodoPago,
      estado: PagoEstado.PENDIENTE,
    });

    try {
      // 2. Procesar con gateway simulado
      const resultado = await this.paymentGateway.procesarPago({
        pagoId: pago.id,
        reservaId: dto.reservaId,
        usuarioId: dto.usuarioId,
        monto: dto.monto,
        moneda: dto.moneda ?? 'GTQ',
        metodoPago: dto.metodoPago,
      });

      // 3. Actualizar pago con resultado final
      await this.pagoRepository.updateResultado(pago.id, {
        estado: resultado.estado,
        proveedorRef: resultado.proveedorRef,
        procesadoEn: resultado.procesadoEn,
      });

      // 4. Guardar outbox (sin publicar aún a RabbitMQ)
      await this.guardarEventoOutbox({
        agregadoId: pago.id,
        tipoEvento: 'pago.procesado',
        payload: {
          pagoId: pago.id,
          reservaId: dto.reservaId,
          usuarioId: dto.usuarioId,
          estado: resultado.estado,
          monto: dto.monto,
          moneda: dto.moneda ?? 'GTQ',
          metodoPago: dto.metodoPago,
          proveedorRef: resultado.proveedorRef,
          procesadoEn: resultado.procesadoEn,
        },
      });

      const pagoActualizado = await this.pagoRepository.findById(pago.id);

      if (!pagoActualizado) {
        throw new NotFoundException('Pago procesado pero no encontrado al recargar');
      }

      return pagoActualizado;
    } catch (error) {
      // Si el gateway falla técnicamente, marcamos el pago como FALLIDO
      await this.pagoRepository.updateResultado(pago.id, {
        estado: PagoEstado.FALLIDO,
        proveedorRef: null,
        procesadoEn: new Date(),
      });

      await this.guardarEventoOutbox({
        agregadoId: pago.id,
        tipoEvento: 'pago.fallido',
        payload: {
          pagoId: pago.id,
          reservaId: dto.reservaId,
          usuarioId: dto.usuarioId,
          estado: PagoEstado.FALLIDO,
          monto: dto.monto,
          moneda: dto.moneda ?? 'GTQ',
          metodoPago: dto.metodoPago,
          motivo: error instanceof Error ? error.message : 'Error desconocido',
          procesadoEn: new Date(),
        },
      });

      const pagoFallido = await this.pagoRepository.findById(pago.id);
      if (pagoFallido) {
        return pagoFallido;
      }

      throw new InternalServerErrorException('No se pudo recuperar el pago fallido');
    }
  }

  /**
   * Obtener un pago por su ID
   */
  async getPagoById(id: string): Promise<PagoEntity> {
    const pago = await this.pagoRepository.findById(id);

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    return pago;
  }

  /**
   * Este método será reutilizado luego por RabbitMQ consumer
   * cuando llegue un mensaje desde payment_process_queue.
   */
  async procesarPagoDesdeEvento(payload: {
    reservaId: string;
    usuarioId: string;
    monto: number;
    moneda?: string;
    metodoPago: string;
  }): Promise<PagoEntity> {
    return this.crearYProcesarPago({
      reservaId: payload.reservaId,
      usuarioId: payload.usuarioId,
      monto: payload.monto,
      moneda: payload.moneda ?? 'GTQ',
      metodoPago: payload.metodoPago,
    });
  }

  /**
   * Guarda el evento en la tabla mensajeria (outbox).
   * Por ahora NO publica a RabbitMQ.
   */
  private async guardarEventoOutbox(params: {
    agregadoId: string;
    tipoEvento: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const evento = this.mensajeriaRepo.create({
      servicioOrigen: 'payments-service',
      agregadoTipo: 'pago',
      agregadoId: params.agregadoId,
      tipoEvento: params.tipoEvento,
      payload: params.payload,
      estado: 'PENDIENTE',
    });

    await this.mensajeriaRepo.save(evento);
  }
}
```

***

## ✅ Qué hace exactamente este service dentro del flujo

### Caso `POST /payments`

1. crea un pago `PENDIENTE`
2. llama al fake gateway
3. si aprueba → estado `APROBADO`
4. si rechaza → estado `RECHAZADO`
5. si falla técnicamente → estado `FALLIDO`
6. guarda un evento en `mensajeria`
7. devuelve el pago final

***

## ✅ Por qué este archivo es **el más importante**

Porque aquí está **la lógica del negocio**, y eso debe estar separado de:

* HTTP → controller
* DB → repository
* proveedor externo → gateway
* mensajería → publisher/consumer (después)

Esto cumple muchísimo **SRP**.

***

# 5) 📄 `src/payments/repositories/pago.repository.ts` ✅ pequeño ajuste necesario

Tu repository actual necesita un método más para guardar:

* `estado`
* `proveedorRef`
* `procesadoEn`

***

## ✅ Reemplázalo por esta versión

```ts
// src/payments/repositories/pago.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { PagoEntity } from '../../database/entities/pago.entity';
import { PagoEstado } from '../../common/enums/pago-estado.enum';

@Injectable()
export class PagoRepository {
  constructor(
    @InjectRepository(PagoEntity)
    private readonly pagoRepo: Repository<PagoEntity>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crear un pago
   */
  async createPago(data: Partial<PagoEntity>): Promise<PagoEntity> {
    const pago = this.pagoRepo.create(data);
    return this.pagoRepo.save(pago);
  }

  /**
   * Buscar pago por ID
   */
  async findById(id: string): Promise<PagoEntity | null> {
    return this.pagoRepo.findOne({
      where: { id },
      relations: ['detalles', 'boletos', 'reembolsos'],
    });
  }

  /**
   * Actualiza el resultado final de un pago
   */
  async updateResultado(
    pagoId: string,
    data: {
      estado: PagoEstado;
      proveedorRef?: string | null;
      procesadoEn: Date;
    },
  ): Promise<void> {
    await this.pagoRepo.update(pagoId, {
      estado: data.estado,
      proveedorRef: data.proveedorRef ?? null,
      procesadoEn: data.procesadoEn,
    });
  }

  /**
   * Ejemplo de transacción útil para evolución futura.
   * Por ahora todavía no guardamos detalle/boleto aquí,
   * pero queda listo si lo necesitas.
   */
  async withTransaction<T>(
    operation: (dataSource: DataSource) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async () => {
      return operation(this.dataSource);
    });
  }
}
```

***

# 6) 📄 `src/payments/payments.module.ts` ✅ versión actualizada

Ahora ya no basta con registrar el repository.  
También tienes que registrar:

* `PaymentsService`
* `FakePaymentGatewayService`
* el provider `PAYMENT_GATEWAY`

***

## ✅ Código

```ts
// src/payments/payments.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PagoEntity } from '../database/entities/pago.entity';
import { DetallePagoEntity } from '../database/entities/detalle-pago.entity';
import { BoletoEntity } from '../database/entities/boleto.entity';
import { ReembolsoEntity } from '../database/entities/reembolso.entity';
import { MensajeriaEntity } from '../database/entities/mensajeria.entity';

import { PagoRepository } from './repositories/pago.repository';
import { PaymentsService } from './services/payments.service';
import { FakePaymentGatewayService } from './services/payment-gateway.service';
import { PAYMENT_GATEWAY } from '../interfaces/payment-gateway.interface';
import type { PaymentGatewayInterface } from '../interfaces/payment-gateway.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PagoEntity,
      DetallePagoEntity,
      BoletoEntity,
      ReembolsoEntity,
      MensajeriaEntity,
    ]),
  ],
  providers: [
    PagoRepository,
    PaymentsService,
    FakePaymentGatewayService,
    {
      provide: PAYMENT_GATEWAY,
      useExisting: FakePaymentGatewayService,
    },
  ],
  exports: [
    PaymentsService,
    PagoRepository,
    PAYMENT_GATEWAY,
  ],
})
export class PaymentsModule {}
```

***

# 7) 📄 Ajuste recomendado en `src/app.module.ts`

Ya debes importar `PaymentsModule`.

***

## ✅ Código

```ts
// src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { databaseConfig } from './config/database.config';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    PaymentsModule,
  ],
})
export class AppModule {}
```

***

# 8) Ajuste importante en entities para que coincidan con tu SQL

Como tu DB usa `VARCHAR` con `CHECK`, no uses `type: 'enum'` en PostgreSQL.

## ✅ En `pago.entity.ts`, la columna `estado` debería quedar así:

```ts
@Column({ type: 'varchar', length: 50, default: PagoEstado.PENDIENTE })
estado: PagoEstado;
```

## ✅ Y además recomiendo estos ajustes:

### `boleto.entity.ts`

```ts
@Column({ type: 'varchar', length: 50, default: 'EMITIDO' })
estado: string;

@CreateDateColumn({ name: 'creado', type: 'timestamp' })
creado: Date;
```

### `reembolso.entity.ts`

```ts
@Column({ type: 'varchar', length: 50, default: 'PENDIENTE' })
estado: string;

@CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
creadoEn: Date;
```

### `mensajeria.entity.ts`

```ts
@Column({ type: 'varchar', length: 50, default: 'PENDIENTE' })
estado: string;

@CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp' })
fechaCreacion: Date;
```

***

# 9) ¿Dónde queda planteado RabbitMQ sin conectarlo aún?

Perfecto que lo quieres dejar planteado pero sin meterlo todavía.

## ✅ Lo correcto es esto:

### HOY

* `PaymentsService` guarda evento en `mensajeria`
* no publica nada todavía

### MAÑANA

Creas:

```text
src/messaging/publisher.interface.ts
src/messaging/rabbitmq.publisher.ts
src/consumers/payment.consumer.ts
```

Y el flujo será:

```text
payment.consumer
   ↓
payments.service.procesarPagoDesdeEvento()

payments.service
   ↓
guarda pago
   ↓
guarda outbox

rabbitmq.publisher
   ↓
lee outbox / publica payment_result_queue
```

***

## ✅ O sea: RabbitMQ queda “planteado” en dos sitios

### 1. En el método:

```ts
procesarPagoDesdeEvento(...)
```

porque ese lo usará el consumer

### 2. En la tabla:

```ts
mensajeria
```

porque esa guardará el evento antes de publicarlo

***

# 10) Resumen de qué hace cada archivo de esta parte

***

## `src/payments/interfaces/payment-gateway.interface.ts`

**Qué hace:** define el contrato del gateway  
**Por qué importa:** desacopla el service de implementaciones concretas

***

## `src/payments/dto/create-payment.dto.ts`

**Qué hace:** valida el request del pago manual  
**Por qué importa:** evita entradas inválidas

***

## `src/payments/services/payment-gateway.service.ts`

**Qué hace:** simula el proveedor externo  
**Por qué importa:** modela el sistema externo sin dependencia real

***

## `src/payments/services/payments.service.ts`

**Qué hace:** ejecuta el flujo completo de pago  
**Por qué importa:** es el corazón del negocio

***

## `src/payments/repositories/pago.repository.ts`

**Qué hace:** persiste y actualiza pagos en DB  
**Por qué importa:** separa acceso a datos de la lógica de negocio

***

## `src/payments/payments.module.ts`

**Qué hace:** registra todo el dominio de pagos  
**Por qué importa:** permite DI y ensamblaje correcto

***

# 11) En qué orden seguir ahora

Ya con esto, el siguiente orden lógico es:

1. ✅ config
2. ✅ entities
3. ✅ repository
4. ✅ service + fake gateway
5. **controllers**
6. **health**
7. **probar POST /payments y GET /payments/:id**
8. **después RabbitMQ**

***

# ✅ SIGUIENTE PASO RECOMENDADO

Ahora ya toca hacer la parte visible de la API:

```text
payments.controller.ts
health.controller.ts
health.module.ts
```

con estos endpoints mínimos:

```http
GET /payments/health
POST /payments
GET /payments/:id
```

***

Si quieres, te doy **ya mismo el siguiente bloque completo** con:

* `src/payments/controllers/payments.controller.ts`
* `src/health/health.controller.ts`
* `src/health/health.module.ts`

y además te dejo **la documentación mínima de endpoints** para el README.
