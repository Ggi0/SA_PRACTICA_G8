# Pruebas con Postman

Coleccion:

- `FilmStars_Angel_Usuarios_API_Gateway.postman_collection.json`

## Que prueba

- Health del API Gateway.
- Seguridad de ruta protegida sin token (`401`).
- Login de administrador.
- Guardado automatico del JWT.
- Perfil autenticado.
- Crear cliente.
- Listar clientes.
- Consultar cliente por ID.
- Actualizar cliente.
- Desactivar cliente.
- Probar alias `/api/users`.
- Eliminar logicamente cliente.

## Requisito previo

El proyecto debe estar levantado desde `Fase2/FilmStars`:

```bash
docker compose up --build -d
```

## Importar en Postman

1. Abrir Postman.
2. Click en `Import`.
3. Seleccionar el archivo `FilmStars_Angel_Usuarios_API_Gateway.postman_collection.json`.
4. Confirmar importacion.

## Ejecutar toda la coleccion

1. Abrir la coleccion `FilmStars - Angel - Usuarios y API Gateway`.
2. Click en `Run`.
3. Mantener el orden de las requests.
4. Click en `Run FilmStars - Angel - Usuarios y API Gateway`.

La coleccion genera automaticamente un correo unico para el cliente de prueba usando timestamp y guarda las variables `token` y `clientId` durante la ejecucion.
