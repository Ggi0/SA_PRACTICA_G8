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

***

Si quieres, en el siguiente paso te puedo dar:

✅ código base (NestJS listo)  
✅ consumer RabbitMQ  
✅ example DTO  
✅ payment gateway listo para copiar

🔥 eso ya te deja el microservicio completamente funcional en 20 min


# ✅ 1. ENUM — ESTADO DEL PAGO

***

## 📄 `src/common/enums/pago-estado.enum.ts`

### ✅ ¿Qué estamos haciendo?

Definir los estados válidos del pago.

### ✅ ¿Qué representa?

El ciclo de vida de un pago dentro del sistema.

### ✅ Código

```ts
// src/common/enums/pago-estado.enum.ts

export enum PagoEstado {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  FALLIDO = 'FALLIDO',
}
```

***

## 🧠 ¿Por qué es importante?

✔ Evitas escribir strings como `"APROBADO"` por todo el código  
✔ Evitas errores  
✔ Cumple **SRP (una sola responsabilidad)**

***

# ✅ 2. ENTITIES (MAPEO DE TU BASE DE DATOS)

Ahora cada tabla de tu SQL se convierte en una clase.

***

# ✅ 📄 `src/database/entities/pago.entity.ts`

## ✅ ¿Qué representa?

👉 Una transacción de pago ligada a una reserva

Es el **corazón del sistema de pagos**.

***

## ✅ Código

```ts
// src/database/entities/pago.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PagoEstado } from '../../common/enums/pago-estado.enum';
import { DetallePagoEntity } from './detalle-pago.entity';
import { BoletoEntity } from './boleto.entity';
import { ReembolsoEntity } from './reembolso.entity';

@Entity('pago')
export class PagoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reserva_id_ref', type: 'uuid' })
  reservaIdRef: string;

  @Column({ name: 'usuario_id_ref', type: 'uuid' })
  usuarioIdRef: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: string;

  @Column({ type: 'varchar', default: 'GTQ' })
  moneda: string;

  @Column({
    type: 'enum',
    enum: PagoEstado,
    default: PagoEstado.PENDIENTE,
  })
  estado: PagoEstado;

  @Column({ name: 'metodo_pago', type: 'varchar' })
  metodoPago: string;

  @Column({ name: 'proveedor_ref', nullable: true })
  proveedorRef?: string;

  @Column({ name: 'procesado_en', nullable: true })
  procesadoEn?: Date;

  @CreateDateColumn({ name: 'creado' })
  creado: Date;

  @UpdateDateColumn({ name: 'modificacion' })
  modificacion: Date;

  @OneToMany(() => DetallePagoEntity, (d) => d.pago)
  detalles: DetallePagoEntity[];

  @OneToMany(() => BoletoEntity, (b) => b.pago)
  boletos: BoletoEntity[];

  @OneToMany(() => ReembolsoEntity, (r) => r.pago)
  reembolsos: ReembolsoEntity[];
}
```

***

# ✅ 📄 `src/database/entities/detalle-pago.entity.ts`

## ✅ ¿Qué representa?

👉 Desglose del pago (por ejemplo: entradas, impuestos, etc.)

***

## ✅ Código

```ts
// src/database/entities/detalle-pago.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { PagoEntity } from './pago.entity';

@Entity('detalle_pago')
export class DetallePagoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tipo' })
  tipo: string;

  @Column({ name: 'descripcion', nullable: true })
  descripcion?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: string;

  @ManyToOne(() => PagoEntity, (pago) => pago.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pago_id' })
  pago: PagoEntity;
}
```

***

# ✅ 📄 `src/database/entities/boleto.entity.ts`

## ✅ ¿Qué representa?

👉 El boleto generado después del pago

***

## ✅ Código

```ts
// src/database/entities/boleto.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { PagoEntity } from './pago.entity';

@Entity('boleto')
export class BoletoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reserva_id_ref', type: 'uuid' })
  reservaIdRef: string;

  @Column({ name: 'reserva_asiento_id_ref', type: 'uuid' })
  reservaAsientoIdRef: string;

  @Column({ name: 'codigo_boleto' })
  codigoBoleto: string;

  @Column({ name: 'codigo_qr', nullable: true })
  codigoQr?: string;

  @Column({ default: 'EMITIDO' })
  estado: string;

  @Column({ name: 'creado' })
  creado: Date;

  @ManyToOne(() => PagoEntity, (pago) => pago.boletos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pago_id' })
  pago: PagoEntity;
}
```

***

# ✅ 📄 `src/database/entities/reembolso.entity.ts`

## ✅ ¿Qué representa?

👉 Reembolso de pagos

(No lo vas a usar ahora, pero queda listo ✔)

***

## ✅ Código

```ts
// src/database/entities/reembolso.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { PagoEntity } from './pago.entity';

@Entity('reembolso')
export class ReembolsoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: string;

  @Column()
  motivo: string;

  @Column({ default: 'PENDIENTE' })
  estado: string;

  @Column({ name: 'creado_en' })
  creadoEn: Date;

  @Column({ name: 'procesado_en', nullable: true })
  procesadoEn?: Date;

  @ManyToOne(() => PagoEntity, (pago) => pago.reembolsos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pago_id' })
  pago: PagoEntity;
}
```

***

# ✅ 📄 `src/database/entities/mensajeria.entity.ts`

## ✅ ¿Qué representa?

👉 El patrón **OUTBOX** (esto es CLAVE)

***

## 🧠 IMPORTANTE

Esto NO es RabbitMQ directamente.

👉 Esto es una tabla que guarda eventos  
👉 Después otro proceso los envía a RabbitMQ

***

## ✅ Código

```ts
// src/database/entities/mensajeria.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('mensajeria')
export class MensajeriaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'servicio_origen' })
  servicioOrigen: string;

  @Column({ name: 'agregado_tipo' })
  agregadoTipo: string;

  @Column({ name: 'agregado_id', type: 'uuid' })
  agregadoId: string;

  @Column({ name: 'tipo_evento' })
  tipoEvento: string;

  @Column({ name: 'payload_json', type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ default: 'PENDIENTE' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_procesado', nullable: true })
  fechaProcesado?: Date;
}
```

***

# ✅ 3. RELACIÓN ENTRE TODO

```text
Pago
 ├── DetallePago
 ├── Boleto
 └── Reembolso

Mensajeria (independiente)
   → eventos del sistema
```

***

# ✅ 4. ¿DÓNDE ENTRA RABBITMQ?

💡 Esto es clave para tu arquitectura:

***

## ❌ RabbitMQ NO va aquí (entities)

Entities = solo base de datos

***

## ✅ RabbitMQ entra aquí:

```text
messaging/
consumers/
services/
```

***

## ✅ Flujo correcto:

1. Payment Service crea pago
2. Guarda en DB ✅
3. Guarda evento en `mensajeria` ✅
4. Luego:
   → Publisher envía a RabbitMQ

***

## ✅ Ejemplo

```text
Pago creado → guardar en mensajeria
             → evento: pago.procesado

RabbitMQ:
   payment_result_queue
```

***

