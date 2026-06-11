

# 1. Listar todos los cines disponibles

Esto es para llenar un `<select>` en React.

```http
GET /api/admin/salas/cines/list
```

Respuesta:

```json
[
  {
    "id": "22222222-2222-2222-2222-222222222221",
    "nombre": "cineA",
    "direccion": "Zona 10, Ciudad de Guatemala",
    "ciudad": {
      "id": "11111111-1111-1111-1111-111111111111",
      "nombre": "Ciudad de Guatemala"
    }
  },
  {
    "id": "22222222-2222-2222-2222-222222222223",
    "nombre": "FilmStars Xela",
    "direccion": "Quetzaltenango",
    "ciudad": {
      "id": "11111111-1111-1111-1111-111111111112",
      "nombre": "Quetzaltenango"
    }
  }
]
```

---

# 2. Listar salas

```http
GET /api/admin/salas
```

Respuesta:

```json
[
  {
    "id": "33333333-3333-3333-3333-333333333331",
    "nombre": "Sala 1",
    "capacidad": 20,
    "tipoSala": "NORMAL",
    "cine": {
      "id": "22222222-2222-2222-2222-222222222221",
      "nombre": "cineA"
    }
  }
]
```

---

# 3. Filtrar salas por cine

Este endpoint es clave para el panel administrativo.

```http
GET /api/admin/salas/cine/:cineId
```

Ejemplo:

```http
GET /api/admin/salas/cine/22222222-2222-2222-2222-222222222221
```

Respuesta:

```json
[
  {
    "id": "33333333-3333-3333-3333-333333333331",
    "nombre": "Sala 1",
    "capacidad": 20,
    "tipoSala": "NORMAL"
  },
  {
    "id": "33333333-3333-3333-3333-333333333332",
    "nombre": "Sala VIP",
    "capacidad": 20,
    "tipoSala": "VIP"
  }
]
```

Frontend:

```text
Seleccionar Cine
      ↓
GET /api/admin/salas/cine/:cineId
      ↓
Mostrar únicamente las salas de ese cine
```

---

# 4. Obtener una sala

```http
GET /api/admin/salas/:id
```

Respuesta:

```json
{
  "id": "33333333-3333-3333-3333-333333333331",
  "nombre": "Sala 1",
  "capacidad": 20,
  "tipoSala": "NORMAL",
  "activa": true,
  "cine": {
    "id": "22222222-2222-2222-2222-222222222221",
    "nombre": "cineA"
  }
}
```

---

# 5. Crear sala

```http
POST /api/admin/salas
```

Request:

```json
{
  "cineId": "22222222-2222-2222-2222-222222222221",
  "nombre": "Sala IMAX",
  "capacidad": 150,
  "tipoSala": "IMAX",
  "activa": true
}
```

Respuesta:

```json
{
  "message": "Sala creada correctamente"
}
```

---

# 6. Actualizar sala

```http
PUT /api/admin/salas/:id
```

Request:

```json
{
  "cineId": "22222222-2222-2222-2222-222222222221",
  "nombre": "Sala VIP Premium",
  "capacidad": 50,
  "tipoSala": "VIP",
  "activa": true
}
```

Respuesta:

```json
{
  "message": "Sala actualizada correctamente"
}
```

---

# 7. Eliminar sala

```http
DELETE /api/admin/salas/:id
```

Respuesta:

```json
{
  "message": "Sala eliminada correctamente"
}
```

