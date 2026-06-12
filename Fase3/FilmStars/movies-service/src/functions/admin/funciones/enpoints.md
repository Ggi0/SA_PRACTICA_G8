
# Endpoints del CRUD

## Catálogo de películas

```http
GET /api/admin/funciones/peliculas/list
```

Sirve para llenar el Select de películas.

Respuesta:

```json
[
  {
    "id": "66666666-6666-6666-6666-666666666661",
    "titulo": "Guardianes del Cine",
    "tipo": "ESTRENO",
    "duracionMin": 125,
    "clasificacion": "PG-13",
    "activa": true
  }
]
```

---

## Catálogo de salas

```http
GET /api/admin/funciones/salas/list
```

Respuesta:

```json
[
  {
    "id": "33333333-3333-3333-3333-333333333331",
    "nombre": "Sala 1",
    "tipoSala": "NORMAL",
    "capacidad": 20,
    "cine": {
      "id": "22222222-2222-2222-2222-222222222221",
      "nombre": "cineA"
    }
  }
]
```

---

# Listar funciones

```http
GET /api/admin/funciones
```

Respuesta:

```json
[
  {
    "id": "77777777-7777-7777-7777-777777777771",
    "fechaHora": "2026-06-08T18:00:00",
    "precioBase": 45,
    "activa": true,
    "pelicula": {
      "id": "66666666-6666-6666-6666-666666666661",
      "titulo": "Guardianes del Cine",
      "tipo": "ESTRENO"
    },
    "sala": {
      "id": "33333333-3333-3333-3333-333333333331",
      "nombre": "Sala 1",
      "tipoSala": "NORMAL"
    },
    "cine": {
      "id": "22222222-2222-2222-2222-222222222221",
      "nombre": "cineA"
    }
  }
]
```

---

# Obtener función

```http
GET /api/admin/funciones/:id
```

Respuesta:

```json
{
  "id": "77777777-7777-7777-7777-777777777771",
  "fechaHora": "2026-06-08T18:00:00",
  "precioBase": 45,
  "activa": true,
  "pelicula": {
    "id": "66666666-6666-6666-6666-666666666661",
    "titulo": "Guardianes del Cine",
    "tipo": "ESTRENO"
  },
  "sala": {
    "id": "33333333-3333-3333-3333-333333333331",
    "nombre": "Sala 1"
  },
  "cine": {
    "id": "22222222-2222-2222-2222-222222222221",
    "nombre": "cineA"
  }
}
```

---

# Crear función

```http
POST /api/admin/funciones
```

Request

```json
{
  "peliculaId": "66666666-6666-6666-6666-666666666661",
  "salaId": "33333333-3333-3333-3333-333333333331",
  "fechaHora": "2026-07-15T18:00:00",
  "tipo": "ESTRENO",
  "activa": true
}
```

Lógica:

```sql
UPDATE pelicula
SET tipo = $1
WHERE id = $2
```

Luego:

```sql
INSERT INTO funcion
```

Precio fijo:

```ts
const precioBase = 45;
```

Respuesta:

```json
{
  "message": "Función creada correctamente"
}
```

---

# Actualizar función

```http
PUT /api/admin/funciones/:id
```

Request

```json
{
  "peliculaId": "66666666-6666-6666-6666-666666666662",
  "salaId": "33333333-3333-3333-3333-333333333332",
  "fechaHora": "2026-07-20T19:00:00",
  "tipo": "PREVENTA",
  "activa": true
}
```

Respuesta:

```json
{
  "message": "Función actualizada correctamente"
}
```

---

# Eliminar función

```http
DELETE /api/admin/funciones/:id
```

Respuesta:

```json
{
  "message": "Función eliminada correctamente"
}
```

---

# Filtrar por película

```http
GET /api/admin/funciones/pelicula/:peliculaId
```

Respuesta:

```json
[
  {
    "id": "77777777-7777-7777-7777-777777777771",
    "fechaHora": "2026-07-15T18:00:00",
    "precioBase": 45,
    "sala": {
      "id": "33333333-3333-3333-3333-333333333331",
      "nombre": "Sala 1"
    }
  }
]
```

---

# Filtrar por sala

```http
GET /api/admin/funciones/sala/:salaId
```

Respuesta:

```json
[
  {
    "id": "77777777-7777-7777-7777-777777777771",
    "fechaHora": "2026-07-15T18:00:00",
    "pelicula": {
      "id": "66666666-6666-6666-6666-666666666661",
      "titulo": "Guardianes del Cine"
    }
  }
]
```

---

# Filtrar por fecha

```http
GET /api/admin/funciones/fecha/:fecha
```

Ejemplo:

```http
GET /api/admin/funciones/fecha/2026-07-15
```

Respuesta:

```json
[
  {
    "id": "77777777-7777-7777-7777-777777777771",
    "fechaHora": "2026-07-15T18:00:00",
    "pelicula": {
      "titulo": "Guardianes del Cine"
    },
    "sala": {
      "nombre": "Sala 1"
    },
    "cine": {
      "nombre": "cineA"
    }
  }
]
```
