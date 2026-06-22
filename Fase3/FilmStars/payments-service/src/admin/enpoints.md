

# 🟢 ✅ ENDPOINTS FINALES (ADMIN)

### 🎟 Escaneo

```
POST /admin/boletos/scan
{
  "codigo": "BOL-xxx"
}


{
    "message": "El boleto ya fue utilizado",
    "error": "Bad Request",
    "statusCode": 400
}
```

***

### 🔍 Buscar manual

```
GET /admin/boletos/codigo/BOL-xxx
```

```
{
    "mensaje": " Acceso permitido",
    "estado": "USADO",
    "boletoId": "53479d4c-bacf-4594-91bd-c71a74f57489"
}


```

***

### ⚠️ Forzar uso

```
POST /admin/boletos/{id}/forzar
http://localhost:3004/admin/boletos/315e617b-edf0-4aff-bdfb-d8cc412f2d85/forzar
```

```

{
    "mensaje": "✅ Validación forzada"
}
```


***

### 📊 Listar todo

```
GET /admin/boletos?estado=EMITIDO
```

respuesta:

```
[
    {
        "id": "9038d1b2-5df4-4ba1-96cc-fb0c5f60f50c",
        "reservaIdRef": "9c1bdc01-d25a-476b-b787-9703b19e1909",
        "reservaAsientoIdRef": null,
        "codigoBoleto": "BOL-1782092510320-0",
        "codigoQr": "QR-1782092510320-0",
        "estado": "EMITIDO",
        "creado": "2026-06-22T01:41:50.322Z",
        "pago": {
            "id": "31232ff4-aaee-4a27-903d-bdae2486069f",
            "reservaIdRef": "9c1bdc01-d25a-476b-b787-9703b19e1909",
            "usuarioIdRef": "a551c5fd-044a-42d6-a818-9232b6ba3290",
            "monto": "90.00",
            "moneda": "GTQ",
            "estado": "APROBADO",
            "metodoPago": "TEST_APROBADO",
            "proveedorRef": "fake-ok-31232ff4-aaee-4a27-903d-bdae2486069f",
            "procesadoEn": "2026-06-22T01:41:50.267Z",
            "creado": "2026-06-22T01:41:49.958Z",
            "modificacion": "2026-06-22T01:41:50.269Z"
        }
    },
    {
        "id": "53479d4c-bacf-4594-91bd-c71a74f57489",
        "reservaIdRef": "3df3983f-15df-482a-a421-a6e6560e1f9a",
        "reservaAsientoIdRef": null,
        "codigoBoleto": "BOL-1782095548510-0",
        "codigoQr": "QR-1782095548510-0",
        "estado": "EMITIDO",
        "creado": "2026-06-22T02:32:28.511Z",
        "pago": {
            "id": "650c33ea-e67c-45d1-948f-38f9afc9c7cc",
            "reservaIdRef": "3df3983f-15df-482a-a421-a6e6560e1f9a",
            "usuarioIdRef": "a551c5fd-044a-42d6-a818-9232b6ba3290",
            "monto": "90.00",
            "moneda": "GTQ",
            "estado": "APROBADO",
            "metodoPago": "TEST_APROBADO",
            "proveedorRef": "fake-ok-650c33ea-e67c-45d1-948f-38f9afc9c7cc",
            "procesadoEn": "2026-06-22T02:32:28.427Z",
            "creado": "2026-06-22T02:32:28.102Z",
            "modificacion": "2026-06-22T02:32:28.439Z"
        }
    },
    {
        "id": "315e617b-edf0-4aff-bdfb-d8cc412f2d85",
        "reservaIdRef": "667023ea-0abf-4039-b123-a4b30ecc3e05",
        "reservaAsientoIdRef": null,
        "codigoBoleto": "BOL-1782095591933-0",
        "codigoQr": "QR-1782095591933-0",
        "estado": "EMITIDO",
        "creado": "2026-06-22T02:33:11.936Z",
        "pago": {
            "id": "8f488c5f-f872-4e18-9aa0-c99b1220b6cb",
            "reservaIdRef": "667023ea-0abf-4039-b123-a4b30ecc3e05",
            "usuarioIdRef": "a551c5fd-044a-42d6-a818-9232b6ba3290",
            "monto": "45.00",
            "moneda": "GTQ",
            "estado": "APROBADO",
            "metodoPago": "TEST_APROBADO",
            "proveedorRef": "fake-ok-8f488c5f-f872-4e18-9aa0-c99b1220b6cb",
            "procesadoEn": "2026-06-22T02:33:11.869Z",
            "creado": "2026-06-22T02:33:11.559Z",
            "modificacion": "2026-06-22T02:33:11.872Z"
        }
    }
]

```

***


