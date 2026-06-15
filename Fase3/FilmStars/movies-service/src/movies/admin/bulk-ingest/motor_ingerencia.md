

# Reglas del formato

Separador principal: ,
Encoding recomendado: UTF-8
La primera fila debe ser la cabecera
La columna generos debe venir como lista separada por |
tipo solo puede ser:

ESTRENO
PREVENTA
REESTRENO


activa acepta:

true, false
1, 0
si, sí, no


fecha_estreno debe ir en formato:

YYYY-MM-DD


Si un texto tiene comas, debe ir entre comillas dobles "


```csv

titulo,sinopsis,duracion_min,clasificacion,poster_url,fecha_estreno,tipo,activa,generos

```


## csv.parser.ts
Este archivo:

parsea el CSV sin depender de llamar al endpoint individual
valida columnas
valida formato
transforma los géneros de texto → IDs UUID reales
devuelve:

filas válidas
filas inválidas
errores detallados



# 5) Documentación del nuevo endpoint

## Endpoint propuesto

### `POST /api/admin/movies/bulk/upload`

### Tipo de request

`multipart/form-data`

### Campo esperado

* `file`: archivo `.csv`

***

## Ejemplo de respuesta exitosa parcial

```json
{
  "summary": {
    "totalFilas": 123,
    "procesadasCorrectamente": 120,
    "rechazadas": 3
  },
  "message": "Se cargaron 120 películas correctamente. 3 filas tuvieron errores.",
  "errors": [
    {
      "rowNumber": 5,
      "raw": {
        "titulo": "Película X",
        "sinopsis": "Texto",
        "duracion_min": "abc",
        "clasificacion": "PG",
        "poster_url": "https://example.com/x.jpg",
        "fecha_estreno": "2026-13-50",
        "tipo": "ESTRENOO",
        "activa": "true",
        "generos": "Acción|FakeGenre"
      },
      "errors": [
        {
          "field": "duracion_min",
          "message": "El campo duracion_min debe ser un número entero mayor que 0"
        },
        {
          "field": "fecha_estreno",
          "message": "El campo fecha_estreno debe tener el formato YYYY-MM-DD y ser una fecha válida"
        },
        {
          "field": "tipo",
          "message": "El campo tipo debe ser uno de: ESTRENO, PREVENTA, REESTRENO"
        },
        {
          "field": "generos",
          "message": "Los siguientes géneros no existen en catálogo: FakeGenre"
        }
      ]
    }
  ]
}
```

***

## Errores posibles del endpoint

### `400 Bad Request`

Cuando:

* no se envía archivo
* el archivo está vacío
* el CSV no tiene cabecera correcta
* el archivo no es `.csv`

Ejemplo:

```json
{
  "statusCode": 400,
  "message": "Debes subir un archivo CSV válido",
  "error": "BAD_CSV_FILE"
}
```
