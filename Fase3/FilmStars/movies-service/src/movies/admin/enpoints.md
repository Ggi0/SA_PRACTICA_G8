
---> http://localhost:3002/adm/movies/genres/list

---> api 
http://localhost:8080/api/admin/movies/genres/list


```http
GET /api/admin/movies/genres/list
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
POST /api/admin/movies
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
GET /api/admin/movies/:id
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
PUT /api/admin/movies/:id
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
DELETE /api/admin/movies/:id
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


















-----------------> nuevo enpoint para pages

hace lo mismo que el enpoints de el enpoint `http://localhost:8080/api/movies/`

pero se le aplico lo de los filtros y pages
`http://localhost:8080/api/movies/pages`

es un metodo GET

acepta esto:

pagina 1, limite de 10
`GET http://localhost:8080/api/movies/pages?page=1&limit=10`

pagina 2, ilimite de 10
`GET http://localhost:8080/api/movies/pages?page=2&limit=10`

filtrar por categoria por pagaina
`GET http://localhost:8080/api/movies/pages?category=ESTRENO&page=1&limit=10`

`GET http://localhost:8080/api/movies/pages?category=PRE_VENTA&page=1&limit=10`

`GET http://localhost:8080/api/movies/pages?category=RE_ESTRENO&page=1&limit=10`

la page pude cabiar de 1,2,3 las que haya

response

PAGINA 1
```
{
  "data": [
    {
      "id": "b8a639e6-785a-492c-a1fb-76cc7ab2e996",
      "title": "Zootopia 2",
      "synopsis": "Regreso de Judy Hopps y Nick Wilde",
      "posterUrl": "https://example.com/posters/zootopia2.jpg",
      "duration": 108,
      "genre": [
        "Animación",
        "Comedia"
      ],
      "rating": "PG",
      "category": "PRE_VENTA",
      "releaseDate": "2026-12-20"
    },
    {
      "id": "8ed04a20-40c2-4f1f-b7dc-e9bca6113326",
      "title": "Superman 3",
      "synopsis": "Nueva película editadooo",
      "posterUrl": "https://example.com/posters/superman.jpg",
      "duration": 180,
      "genre": [
        "Acción",
        "Aventura"
      ],
      "rating": "PG-13",
      "category": "ESTRENO",
      "releaseDate": "2026-12-15"
    },
    {
      "id": "6fbccdec-be73-4dbc-a823-99e9dd821915",
      "title": "Toy Story 5",
      "synopsis": "Animación familiar",
      "posterUrl": "https://example.com/posters/toystory5.jpg",
      "duration": 110,
      "genre": [
        "Animación",
        "Comedia"
      ],
      "rating": "PG",
      "category": "PRE_VENTA",
      "releaseDate": "2026-11-01"
    },
    {
      "id": "5621f6af-fd78-42fb-8619-d1dfc5121d50",
      "title": "Avatar 3",
      "synopsis": "Nueva entrega épica",
      "posterUrl": "https://example.com/posters/avatar3.jpg",
      "duration": 170,
      "genre": [
        "Acción",
        "Aventura"
      ],
      "rating": "PG-13",
      "category": "ESTRENO",
      "releaseDate": "2026-10-20"
    },
    {
      "id": "14ed0057-2706-4d46-b944-fde63e94af79",
      "title": "Street Fighter",
      "synopsis": "Torneo mundial con Ryu y Ken",
      "posterUrl": "https://example.com/posters/streetfighter.jpg",
      "duration": 125,
      "genre": [
        "Acción",
        "Aventura"
      ],
      "rating": "PG-13",
      "category": "ESTRENO",
      "releaseDate": "2026-10-16"
    },
    {
      "id": "34c79f71-41cf-4ad2-87be-051040472cb3",
      "title": "Titanic Re-Release",
      "synopsis": "Clásico reestrenado",
      "posterUrl": "https://example.com/posters/titanic.jpg",
      "duration": 195,
      "genre": [
        "Drama"
      ],
      "rating": "PG-13",
      "category": "RE_ESTRENO",
      "releaseDate": "2026-09-10"
    },
    {
      "id": "a2261185-e319-4614-86a7-dd592dcf7355",
      "title": "The Fast and the Furious 25th",
      "synopsis": "Reestreno del clásico de carreras",
      "posterUrl": "https://example.com/posters/fastfurious.jpg",
      "duration": 106,
      "genre": [
        "Acción",
        "Aventura"
      ],
      "rating": "PG-13",
      "category": "RE_ESTRENO",
      "releaseDate": "2026-09-01"
    },
    {
      "id": "2898bfda-f51b-4986-a849-7845dbf8bcd4",
      "title": "Coyote vs. Acme",
      "synopsis": "Comedia con personajes Looney Tunes",
      "posterUrl": "https://example.com/posters/coyoteacme.jpg",
      "duration": 100,
      "genre": [
        "Animación",
        "Comedia"
      ],
      "rating": "PG",
      "category": "ESTRENO",
      "releaseDate": "2026-08-28"
    },
    {
      "id": "63ebc724-aac6-4b8b-812b-88c07ebb0f0a",
      "title": "Shrek 5",
      "synopsis": "Regreso de Shrek",
      "posterUrl": "https://example.com/posters/shrek5.jpg",
      "duration": 100,
      "genre": [
        "Animación",
        "Comedia"
      ],
      "rating": "PG",
      "category": "PRE_VENTA",
      "releaseDate": "2026-08-01"
    },
    {
      "id": "b6468509-e6e7-4444-b243-3e6f9ca79278",
      "title": "Spider-Man: Brand New Day",
      "synopsis": "Peter Parker enfrenta un nuevo enemigo",
      "posterUrl": "https://example.com/posters/spiderman.jpg",
      "duration": 150,
      "genre": [
        "Acción",
        "Aventura"
      ],
      "rating": "PG-13",
      "category": "ESTRENO",
      "releaseDate": "2026-07-31"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 23,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}

```



pagina 2:
```
{
  "data": [
    {
      "id": "50dc529b-f83b-44b8-bd10-e83e43a49acd",
      "title": "The Odyssey",
      "synopsis": "Adaptación épica de Homero por Nolan",
      "posterUrl": "https://example.com/posters/odyssey.jpg",
      "duration": 172,
      "genre": [
        "Aventura",
        "Drama"
      ],
      "rating": "R",
      "category": "ESTRENO",
      "releaseDate": "2026-07-17"
    },
    {
      "id": "ff35f0f1-e180-4836-8ad4-21c50d068b7a",
      "title": "Moana Live Action",
      "synopsis": "Versión real del clásico animado",
      "posterUrl": "https://example.com/posters/moana.jpg",
      "duration": 120,
      "genre": [
        "Aventura",
        "Comedia"
      ],
      "rating": "PG",
      "category": "ESTRENO",
      "releaseDate": "2026-07-10"
    },
    {
      "id": "7d0445b3-8910-49e0-bbc5-2d826bb9eafa",
      "title": "Citizen Kane 85th Anniversary",
      "synopsis": "Reestreno del clásico de Orson Welles",
      "posterUrl": "https://example.com/posters/citizenkane.jpg",
      "duration": 119,
      "genre": [
        "Drama"
      ],
      "rating": "PG",
      "category": "RE_ESTRENO",
      "releaseDate": "2026-07-05"
    },
    {
      "id": "8498d4ae-0586-4b4e-9846-e7a1b5edd036",
      "title": "Supergirl",
      "synopsis": "Kara Zor-El busca justicia intergaláctica",
      "posterUrl": "https://example.com/posters/supergirl.jpg",
      "duration": 107,
      "genre": [
        "Acción",
        "Aventura"
      ],
      "rating": "PG-13",
      "category": "ESTRENO",
      "releaseDate": "2026-06-26"
    },
    {
      "id": "42cce460-5997-4dcd-ab0e-432eda950400",
      "title": "Inside Out 2",
      "synopsis": "Secuela de Pixar sobre emociones",
      "posterUrl": "https://example.com/posters/insideout2.jpg",
      "duration": 100,
      "genre": [
        "Animación",
        "Comedia"
      ],
      "rating": "PG",
      "category": "PRE_VENTA",
      "releaseDate": "2026-06-14"
    },
    {
      "id": "88f5ab1a-1109-4ece-a4ea-3df7b306658c",
      "title": "Amores Perros",
      "synopsis": "Reestreno del clásico mexicano",
      "posterUrl": "https://example.com/posters/amoresperros.jpg",
      "duration": 154,
      "genre": [
        "Drama"
      ],
      "rating": "R",
      "category": "RE_ESTRENO",
      "releaseDate": "2026-06-12"
    },
    {
      "id": "66666666-6666-6666-6666-666666666662",
      "title": "La Última Función",
      "synopsis": "Una historia de drama y misterio dentro de un antiguo cine.",
      "posterUrl": "https://m.media-amazon.com/images/M/MV5BNzE4MTcyN2QtMGUyOS00ZDEwLWEwNzUtZTk0ZjQzNDk2MWIyXkEyXkFqcGc@._V1_.jpg",
      "duration": 110,
      "genre": [
        "Drama"
      ],
      "rating": "PG-13",
      "category": "PRE_VENTA",
      "releaseDate": "2026-06-10"
    },
    {
      "id": "66335e6a-9331-4237-bff9-7fe13b4fd89d",
      "title": "Trainspotting 30th Anniversary",
      "synopsis": "Reestreno del clásico de Danny Boyle",
      "posterUrl": "https://example.com/posters/trainspotting.jpg",
      "duration": 94,
      "genre": [
        "Drama"
      ],
      "rating": "R",
      "category": "RE_ESTRENO",
      "releaseDate": "2026-06-05"
    },
    {
      "id": "66666666-6666-6666-6666-666666666661",
      "title": "Guardianes del Cine",
      "synopsis": "Un grupo de héroes debe proteger la última sala de cine de la ciudad.",
      "posterUrl": "https://es.web.img3.acsta.net/medias/nmedia/18/91/56/29/20282576.jpg",
      "duration": 125,
      "genre": [
        "Acción",
        "Aventura"
      ],
      "rating": "PG-13",
      "category": "ESTRENO",
      "releaseDate": "2026-06-01"
    },
    {
      "id": "6949e1ee-1b37-4e9c-bf3c-e9235494fe11",
      "title": "Deadpool 3",
      "synopsis": "Regreso del antihéroe irreverente",
      "posterUrl": "https://example.com/posters/deadpool3.jpg",
      "duration": 125,
      "genre": [
        "Acción",
        "Comedia"
      ],
      "rating": "R",
      "category": "PRE_VENTA",
      "releaseDate": "2026-05-03"
    }
  ],
  "pagination": {
    "page": 2,
    "limit": 10,
    "totalItems": 23,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}


```


pagina 1 con filtro de categoria

```
{
  "data": [
    {
      "id": "34c79f71-41cf-4ad2-87be-051040472cb3",
      "title": "Titanic Re-Release",
      "synopsis": "Clásico reestrenado",
      "posterUrl": "https://example.com/posters/titanic.jpg",
      "duration": 195,
      "genre": [
        "Drama"
      ],
      "rating": "PG-13",
      "category": "RE_ESTRENO",
      "releaseDate": "2026-09-10"
    },
    {
      "id": "a2261185-e319-4614-86a7-dd592dcf7355",
      "title": "The Fast and the Furious 25th",
      "synopsis": "Reestreno del clásico de carreras",
      "posterUrl": "https://example.com/posters/fastfurious.jpg",
      "duration": 106,
      "genre": [
        "Acción",
        "Aventura"
      ],
      "rating": "PG-13",
      "category": "RE_ESTRENO",
      "releaseDate": "2026-09-01"
    },
    {
      "id": "7d0445b3-8910-49e0-bbc5-2d826bb9eafa",
      "title": "Citizen Kane 85th Anniversary",
      "synopsis": "Reestreno del clásico de Orson Welles",
      "posterUrl": "https://example.com/posters/citizenkane.jpg",
      "duration": 119,
      "genre": [
        "Drama"
      ],
      "rating": "PG",
      "category": "RE_ESTRENO",
      "releaseDate": "2026-07-05"
    },
    {
      "id": "88f5ab1a-1109-4ece-a4ea-3df7b306658c",
      "title": "Amores Perros",
      "synopsis": "Reestreno del clásico mexicano",
      "posterUrl": "https://example.com/posters/amoresperros.jpg",
      "duration": 154,
      "genre": [
        "Drama"
      ],
      "rating": "R",
      "category": "RE_ESTRENO",
      "releaseDate": "2026-06-12"
    },
    {
      "id": "66335e6a-9331-4237-bff9-7fe13b4fd89d",
      "title": "Trainspotting 30th Anniversary",
      "synopsis": "Reestreno del clásico de Danny Boyle",
      "posterUrl": "https://example.com/posters/trainspotting.jpg",
      "duration": 94,
      "genre": [
        "Drama"
      ],
      "rating": "R",
      "category": "RE_ESTRENO",
      "releaseDate": "2026-06-05"
    },
    {
      "id": "66666666-6666-6666-6666-666666666663",
      "title": "Risas de Medianoche",
      "synopsis": "Una comedia familiar llena de situaciones inesperadas.",
      "posterUrl": "https://m.media-amazon.com/images/M/MV5BZTRiOGMxYzctMTk3Ny00ODBkLWIyNTMtOGZhMWY0MjZiYzAxXkEyXkFqcGc@._V1_.jpg",
      "duration": 95,
      "genre": [
        "Comedia"
      ],
      "rating": "PG",
      "category": "RE_ESTRENO",
      "releaseDate": "2025-12-20"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 6,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}


```