
---

# Endpoints finales

## 1. Listar ciudades

```http
GET /api/admin/cinemas/cities/list
```

Respuesta:

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "nombre": "Ciudad de Guatemala"
  },
  {
    "id": "11111111-1111-1111-1111-111111111112",
    "nombre": "Quetzaltenango"
  }
]
```

Este endpoint sirve para llenar un `<select>` en el frontend.

---

## 2. Obtener cines por ciudad

```http
GET /api/admin/cinemas/cities/:cityId/cinemas
```

Ejemplo:

```http
GET /api/admin/cinemas/cities/11111111-1111-1111-1111-111111111111/cinemas
```

Respuesta:

```json
[
  {
    "id": "22222222-2222-2222-2222-222222222221",
    "nombre": "cineA",
    "direccion": "Zona 10, Ciudad de Guatemala",
    "activo": true
  },
  {
    "id": "22222222-2222-2222-2222-222222222222",
    "nombre": "FilmStars Miraflores",
    "direccion": "Zona 11, Ciudad de Guatemala",
    "activo": true
  }
]
```

Muy útil para filtros dependientes:

```
Ciudad
   ↓
Cines de esa ciudad
```

---

## 3. Listar todos los cines

```http
GET /api/admin/cinemas
```

Respuesta:

```json
[
  {
    "id": "...",
    "ciudad_id": "...",
    "ciudad_nombre": "Ciudad de Guatemala",
    "nombre": "cineA",
    "direccion": "Zona 10",
    "activo": true
  }
]
```

---

## 4. Obtener un cine

```http
GET /api/admin/cinemas/:id
```

---

## 5. Crear cine

```http
POST /api/admin/cinemas
```

Request:

```json
{
  "ciudad_id": "11111111-1111-1111-1111-111111111111",
  "nombre": "FilmStars Pradera",
  "direccion": "Zona 10",
  "activo": true
}
```

---

## 6. Actualizar cine

```http
PUT /api/admin/cinemas/:id
```

Request:

```json
{
  "ciudad_id": "11111111-1111-1111-1111-111111111111",
  "nombre": "FilmStars Pradera Norte",
  "direccion": "Zona 10",
  "activo": true
}
```

---

## 7. Eliminar cine

```http
DELETE /api/admin/cinemas/:id
```

