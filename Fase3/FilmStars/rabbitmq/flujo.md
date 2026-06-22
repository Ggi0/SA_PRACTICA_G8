# 1. se hace la reservacion

PSOt http://localhost:8080/api/reservas
```
{"funcionId":"77777777-7777-7777-7777-777777777772","asientos":["589fbf75-dfd7-4578-bf50-5ff1cd397722","b30a9f74-ad18-4416-9f6d-6edb1750f298","a4a18506-f15a-420c-914b-6aee88219288"]}

```

en el servico de reservas:
```
query: UPDATE "estado_asiento_funcion" SET "estado" = $1, "reserva_id" = $2, "bloqueado_hasta" = $3, "modificacion" = $4 WHERE "id" = $5 -- PARAMETERS: ["BLOQUEADO","92917e62-d8ec-4c65-ad6a-d681c3559e34","2026-06-22T00:11:10.988Z","2026-06-22T00:01:11.043Z","a4a18506-f15a-420c-914b-6aee88219288"]

query: UPDATE "estado_asiento_funcion" SET "estado" = $1, "reserva_id" = $2, "bloqueado_hasta" = $3, "modificacion" = $4 WHERE "id" = $5 -- PARAMETERS: ["BLOQUEADO","92917e62-d8ec-4c65-ad6a-d681c3559e34","2026-06-22T00:11:10.988Z","2026-06-22T00:01:11.043Z","b30a9f74-ad18-4416-9f6d-6edb1750f298"]

query: UPDATE "estado_asiento_funcion" SET "estado" = $1, "reserva_id" = $2, "bloqueado_hasta" = $3, "modificacion" = $4 WHERE "id" = $5 -- PARAMETERS: ["BLOQUEADO","92917e62-d8ec-4c65-ad6a-d681c3559e34","2026-06-22T00:11:10.988Z","2026-06-22T00:01:11.043Z","589fbf75-dfd7-4578-bf50-5ff1cd397722"]

query: INSERT INTO "reserva_asiento"("id", "reserva_id", "estado_asiento_funcion_id", "precio_unitario", "tipo_entrada") VALUES (DEFAULT, $1, $2, $3, $4), (DEFAULT, $5, $6, $7, $8), (DEFAULT, $9, $10, $11, $12) RETURNING "id", "tipo_entrada" -- PARAMETERS: ["92917e62-d8ec-4c65-ad6a-d681c3559e34","a4a18506-f15a-420c-914b-6aee88219288",45,"GENERAL","92917e62-d8ec-4c65-ad6a-d681c3559e34","b30a9f74-ad18-4416-9f6d-6edb1750f298",45,"GENERAL","92917e62-d8ec-4c65-ad6a-d681c3559e34","589fbf75-dfd7-4578-bf50-5ff1cd397722",45,"GENERAL"]

query: INSERT INTO "mensajeria"("id", "servicio_origen", "agregado_tipo", "agregado_id", "tipo_evento", "payload_json", "estado", "fecha_creacion", "fecha_procesado") VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, DEFAULT) RETURNING "id", "estado" -- PARAMETERS: ["reservas-service","reserva","92917e62-d8ec-4c65-ad6a-d681c3559e34","reserva.solicitada","{\"reservaId\":\"92917e62-d8ec-4c65-ad6a-d681c3559e34\",\"usuarioId\":\"909f5465-7f50-4f5a-b876-04896c3301db\",\"funcionId\":\"77777777-7777-7777-7777-777777777772\",\"asientos\":[{\"asientoId\":\"44444444-4444-4444-4444-444444444405\",\"codigo\":\"A5\",\"fila\":\"A\",\"numero\":5},{\"asientoId\":\"44444444-4444-4444-4444-444444444410\",\"codigo\":\"B5\",\"fila\":\"B\",\"numero\":5},{\"asientoId\":\"44444444-4444-4444-4444-444444444415\",\"codigo\":\"C5\",\"fila\":\"C\",\"numero\":5}]}","PENDIENTE","2026-06-22T00:01:11.069Z"]

📤 Mensaje enviado a seat_hold_queue
query: COMMIT
gio@gio:~$ 

```

en el servico de de pagos:
```

aun nada

```


# hacer el pago:

```
POST
	
scheme
	http
host
	localhost:8080
filename
	/api/reservas/92917e62-d8ec-4c65-ad6a-d681c3559e34/confirmar
Dirección
	127.0.0.1:8080
Estado
201
Created
VersiónHTTP/1.1
Transferido323 B (tamaño 79 B)
Política de referenciastrict-origin-when-cross-origin
Prioridad de la solicitudHighest
Resolución DNSSistema
```

respuesta: `{"estado":"EN_PROCESO_PAGO","reservaId":"92917e62-d8ec-4c65-ad6a-d681c3559e34"}`


confirmar acciona el rabbit mq, servicio de pago
```
[Nest] 1  - 06/22/2026, 12:08:37 AM     LOG [PaymentConsumer] Mensaje recibido en payment_process_queue: {"reservaId":"92917e62-d8ec-4c65-ad6a-d681c3559e34","usuarioId":"909f5465-7f50-4f5a-b876-04896c3301db","monto":135,"moneda":"GTQ","metodoPago":"TEST_APROBADO"}

query: START TRANSACTION
query: INSERT INTO "pago"("id", "reserva_id_ref", "usuario_id_ref", "monto", "moneda", "estado", "metodo_pago", "proveedor_ref", "procesado_en", "creado", "modificacion") VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, DEFAULT, DEFAULT, DEFAULT, DEFAULT) RETURNING "id", "moneda", "estado", "creado", "modificacion" -- PARAMETERS: ["92917e62-d8ec-4c65-ad6a-d681c3559e34","909f5465-7f50-4f5a-b876-04896c3301db","135.00","GTQ","PENDIENTE","TEST_APROBADO"]
query: COMMIT

query: UPDATE "pago" SET "estado" = $1, "proveedor_ref" = $2, "procesado_en" = $3, "modificacion" = CURRENT_TIMESTAMP WHERE "id" = $4 -- PARAMETERS: ["APROBADO","fake-ok-7ebed419-ba62-464e-b62e-b1a2acb45a76","2026-06-22T00:08:37.888Z","7ebed419-ba62-464e-b62e-b1a2acb45a76"]

query: START TRANSACTION
query: INSERT INTO "mensajeria"("id", "servicio_origen", "agregado_tipo", "agregado_id", "tipo_evento", "payload_json", "estado", "fecha_creacion", "fecha_procesado") VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, DEFAULT, DEFAULT) RETURNING "id", "estado", "fecha_creacion" -- PARAMETERS: ["payments-service","pago","7ebed419-ba62-464e-b62e-b1a2acb45a76","pago.procesado","{\"pagoId\":\"7ebed419-ba62-464e-b62e-b1a2acb45a76\",\"reservaId\":\"92917e62-d8ec-4c65-ad6a-d681c3559e34\",\"usuarioId\":\"909f5465-7f50-4f5a-b876-04896c3301db\",\"estado\":\"APROBADO\",\"monto\":135,\"moneda\":\"GTQ\",\"metodoPago\":\"TEST_APROBADO\",\"proveedorRef\":\"fake-ok-7ebed419-ba62-464e-b62e-b1a2acb45a76\",\"procesadoEn\":\"2026-06-22T00:08:37.888Z\"}","PENDIENTE"]
query: COMMIT

[Nest] 1  - 06/22/2026, 12:08:37 AM     LOG [RabbitMqPublisher] Mensaje publicado en cola payment_result_queue: {"reservaId":"92917e62-d8ec-4c65-ad6a-d681c3559e34","estado":"APROBADO","pagoId":"7ebed419-ba62-464e-b62e-b1a2acb45a76"}

query: SELECT DISTINCT "distinctAlias"."PagoEntity_id" AS "ids_PagoEntity_id" FROM (SELECT "PagoEntity"."id" AS "PagoEntity_id", "PagoEntity"."reserva_id_ref" AS "PagoEntity_reserva_id_ref", "PagoEntity"."usuario_id_ref" AS "PagoEntity_usuario_id_ref", "PagoEntity"."monto" AS "PagoEntity_monto", "PagoEntity"."moneda" AS "PagoEntity_moneda", "PagoEntity"."estado" AS "PagoEntity_estado", "PagoEntity"."metodo_pago" AS "PagoEntity_metodo_pago", "PagoEntity"."proveedor_ref" AS "PagoEntity_proveedor_ref", "PagoEntity"."procesado_en" AS "PagoEntity_procesado_en", "PagoEntity"."creado" AS "PagoEntity_creado", "PagoEntity"."modificacion" AS "PagoEntity_modificacion", "PagoEntity__PagoEntity_detalles"."id" AS "PagoEntity__PagoEntity_detalles_id", "PagoEntity__PagoEntity_detalles"."tipo" AS "PagoEntity__PagoEntity_detalles_tipo", "PagoEntity__PagoEntity_detalles"."descripcion" AS "PagoEntity__PagoEntity_detalles_descripcion", "PagoEntity__PagoEntity_detalles"."subtotal" AS "PagoEntity__PagoEntity_detalles_subtotal", "PagoEntity__PagoEntity_detalles"."pago_id" AS "PagoEntity__PagoEntity_detalles_pago_id", "PagoEntity__PagoEntity_boletos"."id" AS "PagoEntity__PagoEntity_boletos_id", "PagoEntity__PagoEntity_boletos"."reserva_id_ref" AS "PagoEntity__PagoEntity_boletos_reserva_id_ref", "PagoEntity__PagoEntity_boletos"."reserva_asiento_id_ref" AS "PagoEntity__PagoEntity_boletos_reserva_asiento_id_ref", "PagoEntity__PagoEntity_boletos"."codigo_boleto" AS "PagoEntity__PagoEntity_boletos_codigo_boleto", "PagoEntity__PagoEntity_boletos"."codigo_qr" AS "PagoEntity__PagoEntity_boletos_codigo_qr", "PagoEntity__PagoEntity_boletos"."estado" AS "PagoEntity__PagoEntity_boletos_estado", "PagoEntity__PagoEntity_boletos"."creado" AS "PagoEntity__PagoEntity_boletos_creado", "PagoEntity__PagoEntity_boletos"."pago_id" AS "PagoEntity__PagoEntity_boletos_pago_id", "PagoEntity__PagoEntity_reembolsos"."id" AS "PagoEntity__PagoEntity_reembolsos_id", "PagoEntity__PagoEntity_reembolsos"."monto" AS "PagoEntity__PagoEntity_reembolsos_monto", "PagoEntity__PagoEntity_reembolsos"."motivo" AS "PagoEntity__PagoEntity_reembolsos_motivo", "PagoEntity__PagoEntity_reembolsos"."estado" AS "PagoEntity__PagoEntity_reembolsos_estado", "PagoEntity__PagoEntity_reembolsos"."creado_en" AS "PagoEntity__PagoEntity_reembolsos_creado_en", "PagoEntity__PagoEntity_reembolsos"."procesado_en" AS "PagoEntity__PagoEntity_reembolsos_procesado_en", "PagoEntity__PagoEntity_reembolsos"."pago_id" AS "PagoEntity__PagoEntity_reembolsos_pago_id" FROM "pago" "PagoEntity" LEFT JOIN "detalle_pago" "PagoEntity__PagoEntity_detalles" ON "PagoEntity__PagoEntity_detalles"."pago_id"="PagoEntity"."id"  LEFT JOIN "boleto" "PagoEntity__PagoEntity_boletos" ON "PagoEntity__PagoEntity_boletos"."pago_id"="PagoEntity"."id"  LEFT JOIN "reembolso" "PagoEntity__PagoEntity_reembolsos" ON "PagoEntity__PagoEntity_reembolsos"."pago_id"="PagoEntity"."id" WHERE (("PagoEntity"."id" = $1))) "distinctAlias" ORDER BY "PagoEntity_id" ASC LIMIT 1 -- PARAMETERS: ["7ebed419-ba62-464e-b62e-b1a2acb45a76"]

query: SELECT "PagoEntity"."id" AS "PagoEntity_id", "PagoEntity"."reserva_id_ref" AS "PagoEntity_reserva_id_ref", "PagoEntity"."usuario_id_ref" AS "PagoEntity_usuario_id_ref", "PagoEntity"."monto" AS "PagoEntity_monto", "PagoEntity"."moneda" AS "PagoEntity_moneda", "PagoEntity"."estado" AS "PagoEntity_estado", "PagoEntity"."metodo_pago" AS "PagoEntity_metodo_pago", "PagoEntity"."proveedor_ref" AS "PagoEntity_proveedor_ref", "PagoEntity"."procesado_en" AS "PagoEntity_procesado_en", "PagoEntity"."creado" AS "PagoEntity_creado", "PagoEntity"."modificacion" AS "PagoEntity_modificacion", "PagoEntity__PagoEntity_detalles"."id" AS "PagoEntity__PagoEntity_detalles_id", "PagoEntity__PagoEntity_detalles"."tipo" AS "PagoEntity__PagoEntity_detalles_tipo", "PagoEntity__PagoEntity_detalles"."descripcion" AS "PagoEntity__PagoEntity_detalles_descripcion", "PagoEntity__PagoEntity_detalles"."subtotal" AS "PagoEntity__PagoEntity_detalles_subtotal", "PagoEntity__PagoEntity_detalles"."pago_id" AS "PagoEntity__PagoEntity_detalles_pago_id", "PagoEntity__PagoEntity_boletos"."id" AS "PagoEntity__PagoEntity_boletos_id", "PagoEntity__PagoEntity_boletos"."reserva_id_ref" AS "PagoEntity__PagoEntity_boletos_reserva_id_ref", "PagoEntity__PagoEntity_boletos"."reserva_asiento_id_ref" AS "PagoEntity__PagoEntity_boletos_reserva_asiento_id_ref", "PagoEntity__PagoEntity_boletos"."codigo_boleto" AS "PagoEntity__PagoEntity_boletos_codigo_boleto", "PagoEntity__PagoEntity_boletos"."codigo_qr" AS "PagoEntity__PagoEntity_boletos_codigo_qr", "PagoEntity__PagoEntity_boletos"."estado" AS "PagoEntity__PagoEntity_boletos_estado", "PagoEntity__PagoEntity_boletos"."creado" AS "PagoEntity__PagoEntity_boletos_creado", "PagoEntity__PagoEntity_boletos"."pago_id" AS "PagoEntity__PagoEntity_boletos_pago_id", "PagoEntity__PagoEntity_reembolsos"."id" AS "PagoEntity__PagoEntity_reembolsos_id", "PagoEntity__PagoEntity_reembolsos"."monto" AS "PagoEntity__PagoEntity_reembolsos_monto", "PagoEntity__PagoEntity_reembolsos"."motivo" AS "PagoEntity__PagoEntity_reembolsos_motivo", "PagoEntity__PagoEntity_reembolsos"."estado" AS "PagoEntity__PagoEntity_reembolsos_estado", "PagoEntity__PagoEntity_reembolsos"."creado_en" AS "PagoEntity__PagoEntity_reembolsos_creado_en", "PagoEntity__PagoEntity_reembolsos"."procesado_en" AS "PagoEntity__PagoEntity_reembolsos_procesado_en", "PagoEntity__PagoEntity_reembolsos"."pago_id" AS "PagoEntity__PagoEntity_reembolsos_pago_id" FROM "pago" "PagoEntity" LEFT JOIN "detalle_pago" "PagoEntity__PagoEntity_detalles" ON "PagoEntity__PagoEntity_detalles"."pago_id"="PagoEntity"."id"  LEFT JOIN "boleto" "PagoEntity__PagoEntity_boletos" ON "PagoEntity__PagoEntity_boletos"."pago_id"="PagoEntity"."id"  LEFT JOIN "reembolso" "PagoEntity__PagoEntity_reembolsos" ON "PagoEntity__PagoEntity_reembolsos"."pago_id"="PagoEntity"."id" WHERE ( (("PagoEntity"."id" = $1)) ) AND ( "PagoEntity"."id" IN ($2) ) -- PARAMETERS: ["7ebed419-ba62-464e-b62e-b1a2acb45a76","7ebed419-ba62-464e-b62e-b1a2acb45a76"]
gio@gio:~$ 



```


# en la base de datos de pago:
```
filmstars_payments=# select * from pago limit 10;
                  id                  |            reserva_id_ref            |            usuario_id_ref            | monto  | moneda |  estado  |  metodo_pago  |                proveedor_ref                 |      procesado_en       |           creado           |        modificacion        
--------------------------------------+--------------------------------------+--------------------------------------+--------+--------+----------+---------------+----------------------------------------------+-------------------------+----------------------------+----------------------------
 7ebed419-ba62-464e-b62e-b1a2acb45a76 | 92917e62-d8ec-4c65-ad6a-d681c3559e34 | 909f5465-7f50-4f5a-b876-04896c3301db | 135.00 | GTQ    | APROBADO | TEST_APROBADO | fake-ok-7ebed419-ba62-464e-b62e-b1a2acb45a76 | 2026-06-22 00:08:37.888 | 2026-06-22 00:08:37.580029 | 2026-06-22 00:08:37.892149
(3 rows)

filmstars_payments=# 
```

# en el servicio de reservas
```
query: START TRANSACTION
query: SELECT "reserva"."id" AS "reserva_id", "reserva"."usuario_id_ref" AS "reserva_usuario_id_ref", "reserva"."funcion_id_ref" AS "reserva_funcion_id_ref", "reserva"."estado" AS "reserva_estado", "reserva"."precio_total" AS "reserva_precio_total", "reserva"."referencia_pago_ref" AS "reserva_referencia_pago_ref", "reserva"."expira_en" AS "reserva_expira_en", "reserva"."creado" AS "reserva_creado", "reserva"."modificacion" AS "reserva_modificacion" FROM "reserva" "reserva" WHERE "reserva"."id" = $1 FOR UPDATE -- PARAMETERS: ["92917e62-d8ec-4c65-ad6a-d681c3559e34"]

query: INSERT INTO "mensajeria"("id", "servicio_origen", "agregado_tipo", "agregado_id", "tipo_evento", "payload_json", "estado", "fecha_creacion", "fecha_procesado") VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, DEFAULT) RETURNING "id", "estado" -- PARAMETERS: ["reservas-service","reserva","92917e62-d8ec-4c65-ad6a-d681c3559e34","pago.solicitado","{\"reservaId\":\"92917e62-d8ec-4c65-ad6a-d681c3559e34\",\"usuarioId\":\"909f5465-7f50-4f5a-b876-04896c3301db\",\"monto\":135,\"moneda\":\"GTQ\",\"metodoPago\":\"TEST_APROBADO\"}","PENDIENTE","2026-06-22T00:08:37.263Z"]

📤 Mensaje enviado a payment_process_queue
query: COMMIT
📥 Evento recibido: {
  reservaId: '92917e62-d8ec-4c65-ad6a-d681c3559e34',
  estado: 'APROBADO',
  pagoId: '7ebed419-ba62-464e-b62e-b1a2acb45a76'
}

query: START TRANSACTION
query: SELECT "ReservaEntity"."id" AS "ReservaEntity_id", "ReservaEntity"."usuario_id_ref" AS "ReservaEntity_usuario_id_ref", "ReservaEntity"."funcion_id_ref" AS "ReservaEntity_funcion_id_ref", "ReservaEntity"."estado" AS "ReservaEntity_estado", "ReservaEntity"."precio_total" AS "ReservaEntity_precio_total", "ReservaEntity"."referencia_pago_ref" AS "ReservaEntity_referencia_pago_ref", "ReservaEntity"."expira_en" AS "ReservaEntity_expira_en", "ReservaEntity"."creado" AS "ReservaEntity_creado", "ReservaEntity"."modificacion" AS "ReservaEntity_modificacion" FROM "reserva" "ReservaEntity" WHERE (("ReservaEntity"."id" = $1)) LIMIT 1 -- PARAMETERS: ["92917e62-d8ec-4c65-ad6a-d681c3559e34"]

query: SELECT "ReservaEntity"."id" AS "ReservaEntity_id", "ReservaEntity"."usuario_id_ref" AS "ReservaEntity_usuario_id_ref", "ReservaEntity"."funcion_id_ref" AS "ReservaEntity_funcion_id_ref", "ReservaEntity"."estado" AS "ReservaEntity_estado", "ReservaEntity"."precio_total" AS "ReservaEntity_precio_total", "ReservaEntity"."referencia_pago_ref" AS "ReservaEntity_referencia_pago_ref", "ReservaEntity"."expira_en" AS "ReservaEntity_expira_en", "ReservaEntity"."creado" AS "ReservaEntity_creado", "ReservaEntity"."modificacion" AS "ReservaEntity_modificacion" FROM "reserva" "ReservaEntity" WHERE "ReservaEntity"."id" = $1 -- PARAMETERS: ["92917e62-d8ec-4c65-ad6a-d681c3559e34"]

query: UPDATE "reserva" SET "estado" = $1, "referencia_pago_ref" = $2, "modificacion" = CURRENT_TIMESTAMP WHERE "id" = $3 RETURNING "modificacion" -- PARAMETERS: ["CONFIRMADA","7ebed419-ba62-464e-b62e-b1a2acb45a76","92917e62-d8ec-4c65-ad6a-d681c3559e34"]

query: SELECT "EstadoAsientoFuncionEntity"."id" AS "EstadoAsientoFuncionEntity_id", "EstadoAsientoFuncionEntity"."funcion_id_ref" AS "EstadoAsientoFuncionEntity_funcion_id_ref", "EstadoAsientoFuncionEntity"."asiento_id_ref" AS "EstadoAsientoFuncionEntity_asiento_id_ref", "EstadoAsientoFuncionEntity"."codigo_asiento" AS "EstadoAsientoFuncionEntity_codigo_asiento", "EstadoAsientoFuncionEntity"."fila" AS "EstadoAsientoFuncionEntity_fila", "EstadoAsientoFuncionEntity"."numero" AS "EstadoAsientoFuncionEntity_numero", "EstadoAsientoFuncionEntity"."estado" AS "EstadoAsientoFuncionEntity_estado", "EstadoAsientoFuncionEntity"."reserva_id" AS "EstadoAsientoFuncionEntity_reserva_id", "EstadoAsientoFuncionEntity"."bloqueado_hasta" AS "EstadoAsientoFuncionEntity_bloqueado_hasta", "EstadoAsientoFuncionEntity"."modificacion" AS "EstadoAsientoFuncionEntity_modificacion" FROM "estado_asiento_funcion" "EstadoAsientoFuncionEntity" WHERE (("EstadoAsientoFuncionEntity"."reserva_id" = $1)) -- PARAMETERS: ["92917e62-d8ec-4c65-ad6a-d681c3559e34"]

query: SELECT "EstadoAsientoFuncionEntity"."id" AS "EstadoAsientoFuncionEntity_id", "EstadoAsientoFuncionEntity"."funcion_id_ref" AS "EstadoAsientoFuncionEntity_funcion_id_ref", "EstadoAsientoFuncionEntity"."asiento_id_ref" AS "EstadoAsientoFuncionEntity_asiento_id_ref", "EstadoAsientoFuncionEntity"."codigo_asiento" AS "EstadoAsientoFuncionEntity_codigo_asiento", "EstadoAsientoFuncionEntity"."fila" AS "EstadoAsientoFuncionEntity_fila", "EstadoAsientoFuncionEntity"."numero" AS "EstadoAsientoFuncionEntity_numero", "EstadoAsientoFuncionEntity"."estado" AS "EstadoAsientoFuncionEntity_estado", "EstadoAsientoFuncionEntity"."reserva_id" AS "EstadoAsientoFuncionEntity_reserva_id", "EstadoAsientoFuncionEntity"."bloqueado_hasta" AS "EstadoAsientoFuncionEntity_bloqueado_hasta", "EstadoAsientoFuncionEntity"."modificacion" AS "EstadoAsientoFuncionEntity_modificacion" FROM "estado_asiento_funcion" "EstadoAsientoFuncionEntity" WHERE "EstadoAsientoFuncionEntity"."id" IN ($1, $2, $3) -- PARAMETERS: ["a4a18506-f15a-420c-914b-6aee88219288","b30a9f74-ad18-4416-9f6d-6edb1750f298","589fbf75-dfd7-4578-bf50-5ff1cd397722"]

query: UPDATE "estado_asiento_funcion" SET "estado" = $1 WHERE "id" = $2 -- PARAMETERS: ["OCUPADO","a4a18506-f15a-420c-914b-6aee88219288"]
query: UPDATE "estado_asiento_funcion" SET "estado" = $1 WHERE "id" = $2 -- PARAMETERS: ["OCUPADO","b30a9f74-ad18-4416-9f6d-6edb1750f298"]
query: UPDATE "estado_asiento_funcion" SET "estado" = $1 WHERE "id" = $2 -- PARAMETERS: ["OCUPADO","589fbf75-dfd7-4578-bf50-5ff1cd397722"]
query: COMMIT
gio@gio:~$ 

```

##############