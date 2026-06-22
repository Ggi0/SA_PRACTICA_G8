# Justificación ACID - FilmStars

ACID se refiere a cuatro propiedades de las transacciones: atomicidad, consistencia, aislamiento y durabilidad. En FilmStars estas propiedades son esenciales porque el sistema maneja reservas de asientos, pagos, emisión de boletos, carga masiva de películas, historial, descarga de boletos y control de accesos.

La arquitectura usa servicios separados, por lo que no existe una única transacción distribuida global entre todos los servicios. En su lugar, cada servicio garantiza ACID dentro de su propia base de datos y coordina procesos entre servicios mediante eventos, colas, estados y referencias lógicas.

---

## 1. Atomicidad

### Justificación integrada

La atomicidad significa que una operación se completa totalmente o se revierte. En FilmStars se aplica en la creación de reservas, bloqueo de asientos, confirmación de compra, carga CSV, pago y validación de boletos.

En reservas, la creación de reserva, bloqueo de asientos, relación reserva-asiento y registro de evento deben ocurrir como una unidad lógica. En carga CSV, se usa transacción general con `SAVEPOINT` por fila para que una fila inválida no arruine toda la importación. En control de accesos, marcar un boleto como usado y actualizar el asiento a `EN_USO` debe realizarse como una operación atómica.

### Evidencia en reservas

```ts
// reservas-service/src/reservas/services/reservas.service.ts
return this.dataSource.transaction(async (manager) => {
  const reservaRepoTx = manager.getRepository(ReservaEntity);
  const asientoRepoTx = manager.getRepository(EstadoAsientoFuncionEntity);
  const reservaAsientoRepoTx = manager.getRepository(ReservaAsientoEntity);
  const mensajeriaRepoTx = manager.getRepository(MensajeriaEntity);

  const reservaGuardada = await reservaRepoTx.save(reserva);
  await asientoRepoTx.save(asientos);
  await reservaAsientoRepoTx.save(relacionesReservaAsiento);

  await mensajeriaRepoTx.save(
    mensajeriaRepoTx.create({
      servicioOrigen: 'reservas-service',
      agregadoTipo: 'reserva',
      agregadoId: reservaGuardada.id,
      tipoEvento: 'reserva.solicitada',
      estado: MensajeriaEstado.PENDIENTE,
    }),
  );
});
```

**Explicación:** si falla el guardado de asientos, reserva-asiento o evento, se revierte la transacción completa.

### Evidencia en CSV

```ts
// movies-service/src/movies/admin/bulk-ingest/bulk.repository.ts
await client.query('BEGIN');

for (const row of chunk) {
  const savepointName = `sp_bulk_row_${row.rowNumber}`;

  await client.query(`SAVEPOINT ${savepointName}`);

  try {
    const movie = await this.insertMovie(client, row);
    await this.insertMovieGenres(client, movie.id, row.generoIds);

    insertedCount++;

    await client.query(`RELEASE SAVEPOINT ${savepointName}`);
  } catch (error: any) {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
    await client.query(`RELEASE SAVEPOINT ${savepointName}`);
  }
}

await client.query('COMMIT');
```

**Explicación:** la carga CSV mantiene atomicidad por fila. Una película con error se revierte sin afectar las filas válidas.

---

## 2. Consistencia

### Justificación integrada

La consistencia asegura que la base pase de un estado válido a otro estado válido. En FilmStars esto evita:

- Asientos duplicados en una misma función.
- Reservas confirmadas con asientos disponibles.
- Películas inválidas desde CSV.
- Boletos sin compra asociada.
- Boletos usados reutilizados.
- Validaciones manuales sobre boletos inexistentes.

### Evidencia en validación de asientos

```ts
// reservas-service/src/reservas/services/reservas.service.ts
const asientosNoDisponibles = asientos.filter(
  (asiento) => asiento.estado !== AsientoEstado.DISPONIBLE,
);

if (asientosNoDisponibles.length > 0) {
  throw new AsientoNoDisponibleException(
    'Uno o más asientos ya están bloqueados u ocupados',
  );
}

for (const asiento of asientos) {
  asiento.estado = AsientoEstado.BLOQUEADO;
  asiento.reservaId = reservaGuardada.id;
  asiento.bloqueadoHasta = expiraEn;
}
```

**Explicación:** antes de bloquear un asiento, el sistema valida que esté disponible. Así evita estados inconsistentes.

### Evidencia en CSV

```ts
// movies-service/src/movies/admin/bulk-ingest/csv.parser.ts
if (!['ESTRENO', 'PREVENTA', 'REESTRENO'].includes(tipoRaw)) {
  errors.push({
    field: 'tipo',
    message:
      'El campo tipo debe ser uno de: ESTRENO, PREVENTA, REESTRENO',
  });
}

if (!Number.isInteger(duracionMin) || duracionMin <= 0) {
  errors.push({
    field: 'duracion_min',
    message:
      'El campo duracion_min debe ser un número entero mayor que 0',
  });
}
```

**Explicación:** la importación no inserta registros que no cumplan las reglas del dominio de cartelera.

### Evidencia en boleto

```ts
// payments-service/src/database/entities/boleto.entity.ts
@Column({ name: 'codigo_boleto' })
codigoBoleto: string;

@Column({ name: 'codigo_qr', nullable: true })
codigoQr?: string;

@Column({ type: 'varchar', length: 50, default: 'EMITIDO' })
estado: string;
```

**Explicación:** el boleto posee identificador, QR y estado. Estos campos permiten validar si un boleto está emitido, usado o inválido.

---

## 3. Aislamiento

### Justificación integrada

El aislamiento evita que operaciones simultáneas se afecten incorrectamente. En FilmStars es crítico para:

- Dos usuarios que intentan reservar el mismo asiento.
- Dos administradores que intentan validar el mismo boleto al mismo tiempo.
- Procesos de confirmación y cancelación de reserva que podrían ejecutarse en paralelo.

### Evidencia de bloqueo pesimista en reserva

```ts
// reservas-service/src/reservas/services/reservas.service.ts
const asientos = await asientoRepoTx
  .createQueryBuilder('asiento')
  .setLock('pessimistic_write')
  .where('asiento.funcion_id_ref = :funcionId', { funcionId })
  .andWhere('asiento.id IN (:...ids)', { ids: asientosUnicos })
  .getMany();
```

**Explicación:** `pessimistic_write` bloquea las filas durante la transacción. Si otra operación intenta usar el mismo asiento, debe esperar o leer el estado actualizado.

### Evidencia al confirmar reserva

```ts
// reservas-service/src/reservas/services/reservas.service.ts
const reserva = await reservaRepoTx
  .createQueryBuilder('reserva')
  .setLock('pessimistic_write')
  .where('reserva.id = :id', { id })
  .getOne();

const asientos = await asientoRepoTx
  .createQueryBuilder('asiento')
  .setLock('pessimistic_write')
  .where('asiento.reserva_id = :reservaId', { reservaId: reserva.id })
  .getMany();
```

**Explicación:** al confirmar una reserva se bloquea la reserva y sus asientos. Esto evita cambios concurrentes mientras se pasa de `PENDIENTE` a `CONFIRMADA`.

---

## 4. Durabilidad

### Justificación integrada

La durabilidad implica que, una vez confirmada una operación, los cambios permanecen. En FilmStars aplica a reservas, pagos, boletos, eventos de mensajería, auditoría de accesos y registros de carga CSV.

### Evidencia en pagos y outbox

```ts
// payments-service/src/payments/services/payments.service.ts
await this.guardarEventoOutbox({
  agregadoId: pago.id,
  tipoEvento: 'pago.procesado',
  payload: {
    pagoId: pago.id,
    reservaId: dto.reservaId,
    usuarioId: dto.usuarioId,
    estado: resultado.estado,
    monto: dto.monto,
  },
});

await this.publisher.publish(RABBITMQ_QUEUES.PAYMENT_RESULT, {
  reservaId: dto.reservaId,
  estado: resultado.estado,
  pagoId: pago.id,
});
```

```ts
// payments-service/src/payments/services/payments.service.ts
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
```

**Explicación:** el evento de pago queda guardado en base de datos. Esto permite trazabilidad y recuperación ante fallos.

### Evidencia en RabbitMQ persistente

```ts
// payments-service/src/messaging/rabbitmq.publisher.ts
this.channel.sendToQueue(queue, buffer, {
  persistent: true,
  contentType: 'application/json',
});
```

**Explicación:** los mensajes críticos se publican como persistentes para reducir pérdida de eventos ante fallos del broker.

---

## 5. ACID aplicado a boletos y control de accesos

El control de accesos requiere aplicar ACID porque un boleto no debe poder reutilizarse. La validación de un boleto debe:

1. Buscar el boleto por código o QR.
2. Validar que exista.
3. Validar que pertenezca a una compra confirmada.
4. Validar que no haya sido usado.
5. Marcar el boleto como `USADO`.
6. Actualizar el asiento a `EN_USO`.
7. Registrar auditoría del intento.

Diseño transaccional esperado:

```ts
await dataSource.transaction(async (manager) => {
  const boleto = await manager
    .getRepository(BoletoEntity)
    .createQueryBuilder('boleto')
    .setLock('pessimistic_write')
    .where('boleto.codigo_boleto = :codigo', { codigo })
    .getOne();

  if (!boleto || boleto.estado !== 'EMITIDO') {
    throw new Error('Boleto inválido o ya utilizado');
  }

  boleto.estado = 'USADO';
  await manager.getRepository(BoletoEntity).save(boleto);

  await manager.getRepository(EstadoAsientoFuncionEntity).update(
    { id: boleto.reservaAsientoIdRef },
    { estado: 'EN_USO' },
  );

  await manager.getRepository(AuditoriaAccesoEntity).save({
    boletoId: boleto.id,
    resultado: 'PERMITIDO',
    fecha: new Date(),
  });
});
```

**Explicación:** el boleto, el asiento y la auditoría deben actualizarse en una misma transacción para evitar reutilización o inconsistencias.

---

## 6. Relación de ACID por funcionalidad

| Funcionalidad | Atomicidad | Consistencia | Aislamiento | Durabilidad |
|---|---|---|---|---|
| Reserva de asientos | Reserva, asientos y evento se guardan juntos. | Solo se bloquean asientos disponibles. | Se usan locks pesimistas. | La reserva queda persistida. |
| Pago | Se registra pago y resultado. | Estados válidos de pago. | Evita cambios simultáneos sobre pago. | Pago y evento quedan guardados. |
| CSV | Savepoint por fila. | Valida tipos y campos. | Transacción controla inserción. | Películas válidas quedan guardadas. |
| Boleto | Se emite después de compra exitosa. | Boleto se asocia a compra/reserva. | Código único evita doble uso. | Boleto queda disponible en historial. |
| Escaneo | Marca boleto y asiento juntos. | No valida boletos usados/inexistentes. | Lock evita doble escaneo. | Auditoría queda registrada. |
| Búsqueda manual | Solo permite validar boletos existentes. | Conserva reglas de estado. | Evita doble validación. | Deja registro de intervención. |

---

## Conclusión

FilmStars aplica ACID dentro de cada servicio y cada base de datos. Reservas usa transacciones y bloqueos pesimistas para evitar doble venta de asientos. Movies usa validaciones, transacciones y savepoints para carga CSV. Payments registra pagos, boletos y eventos de forma durable. En el control de accesos, ACID permite evitar que un boleto sea usado dos veces y asegura que boleto, asiento y auditoría queden sincronizados.
