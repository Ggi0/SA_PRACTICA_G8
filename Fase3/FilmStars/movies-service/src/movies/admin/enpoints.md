

```http
GET /adm/movies/genres/list
```

Respuesta:

```json
[
  {
    "id": "55555555-5555-5555-5555-555555555551",
    "nombre": "Acción"
  },
  {
    "id": "55555555-5555-5555-5555-555555555552",
    "nombre": "Aventura"
  },
  {
    "id": "55555555-5555-5555-5555-555555555553",
    "nombre": "Drama"
  },
  {
    "id": "55555555-5555-5555-5555-555555555554",
    "nombre": "Comedia"
  },
  {
    "id": "55555555-5555-5555-5555-555555555555",
    "nombre": "Animación"
  }
]
```

---

## Crear película

```http
POST /adm/movies
```

Request:

```json
{
  "titulo": "Avengers Secret Wars",
  "sinopsis": "Nueva película",
  "duracion_min": 180,
  "clasificacion": "PG-13",
  "poster_url": "https://...",
  "fecha_estreno": "2026-12-15",
  "tipo": "ESTRENO",
  "activa": true,
  "generos": [
    "55555555-5555-5555-5555-555555555551",
    "55555555-5555-5555-5555-555555555552"
  ]
}
```

---

## Obtener película

```http
GET /adm/movies/:id
```

Respuesta:

```json
{
  "id": "66666666-6666-6666-6666-666666666661",
  "titulo": "Guardianes del Cine",
  "sinopsis": "...",
  "duracion_min": 125,
  "tipo": "ESTRENO",

  "generos": [
    {
      "id": "55555555-5555-5555-5555-555555555551",
      "nombre": "Acción"
    },
    {
      "id": "55555555-5555-5555-5555-555555555552",
      "nombre": "Aventura"
    }
  ]
}
```

---

## Actualizar película

```http
PUT /adm/movies/:id
```

Si envías:

```json
{
  "titulo": "Guardianes del Cine 2",
  "sinopsis": "...",
  "duracion_min": 140,
  "clasificacion": "PG-13",
  "poster_url": "...",
  "fecha_estreno": "2026-08-01",
  "tipo": "ESTRENO",
  "activa": true,

  "generos": [
    "55555555-5555-5555-5555-555555555553",
    "55555555-5555-5555-5555-555555555554"
  ]
}
```

Primero elimina todas las relaciones existentes de `pelicula_genero` y luego inserta las nuevas.

---

## Eliminar película

```http
DELETE /adm/movies/:id
```

PostgreSQL hará automáticamente:

```sql
DELETE pelicula
↓
DELETE pelicula_genero
```

gracias al:

```sql
ON DELETE CASCADE
```

por lo que no debes escribir código adicional para borrar géneros asociados.
