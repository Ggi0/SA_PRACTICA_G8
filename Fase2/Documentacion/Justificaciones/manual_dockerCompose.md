# Manual de Uso de Docker Compose

## Introducción

La plataforma FilmStars se encuentra completamente contenerizada mediante Docker y Docker Compose. Esta estrategia permite desplegar todos los componentes del sistema utilizando una única configuración centralizada definida en el archivo:

```bash
Fase2/FilmStars/docker-compose.yml
```

A través de Docker Compose se gestionan los siguientes componentes:

* Frontend React
* API Gateway
* Servicio de Usuarios
* Servicio de Películas y Cartelera
* Servicio de Reservas
* Servicio de Pagos
* RabbitMQ
* Bases de datos PostgreSQL

El objetivo es simplificar el despliegue, la administración y la ejecución del entorno completo de desarrollo.

---

# Estructura Principal

Los servicios backend se construyen a partir de sus respectivos Dockerfiles.

Ejemplos:

```bash
Fase2/FilmStars/payments-service/Dockerfile
```

```bash
Fase2/FilmStars/reservas-service/Dockerfile
```

Docker Compose utiliza estos archivos para generar las imágenes necesarias antes de iniciar los contenedores.

---

# Requisitos Previos

Antes de ejecutar el proyecto es necesario contar con:

* Docker instalado.
* Docker Compose instalado.
* Archivo `.env` configurado correctamente.
* Puertos requeridos disponibles.

Verificar instalación:

```bash
docker --version
```

```bash
docker compose version
```

---

# Levantar Todo el Proyecto

Ubicarse en la carpeta raíz:

```bash
cd Fase2/FilmStars
```

Ejecutar:

```bash
docker compose up -d
```

Este comando realiza automáticamente las siguientes acciones:

1. Construye las imágenes necesarias.
2. Crea la red interna.
3. Crea los volúmenes persistentes.
4. Inicia las bases de datos.
5. Inicia RabbitMQ.
6. Inicia los microservicios.
7. Inicia el API Gateway.
8. Inicia el Frontend.

La opción `-d` ejecuta los contenedores en segundo plano.

---

# Reconstruir Imágenes

Cuando se realizan cambios en el código fuente es recomendable reconstruir las imágenes:

```bash
docker compose up --build -d
```

Este comando vuelve a generar las imágenes utilizando los Dockerfiles actualizados.

---

# Ver Contenedores Activos

Para visualizar los servicios en ejecución:

```bash
docker ps
```

También puede utilizarse:

```bash
docker compose ps
```

Ejemplo esperado:

```text
filmstars-api-gateway
filmstars-users-service
filmstars-movies-service
filmstars-reservations-service
filmstars-payments-service
filmstars-rabbitmq
filmstars-frontend
filmstars-db-users
filmstars-db-movies
filmstars-db-reservations
filmstars-db-payments
```

---

# Ver Logs del Sistema

Visualizar logs de todos los servicios:

```bash
docker compose logs
```

Seguir logs en tiempo real:

```bash
docker compose logs -f
```

---

# Ver Logs de un Servicio Específico

API Gateway:

```bash
docker compose logs -f api-gateway
```

Reservas:

```bash
docker compose logs -f reservations-service
```

Pagos:

```bash
docker compose logs -f payments-service
```

RabbitMQ:

```bash
docker compose logs -f rabbitmq
```

---

# Reiniciar un Servicio

Reiniciar únicamente un contenedor:

```bash
docker compose restart reservations-service
```

Ejemplo:

```bash
docker compose restart payments-service
```

---

# Detener Todo el Proyecto

Detener todos los contenedores:

```bash
docker compose down
```

Este comando:

* Detiene los contenedores.
* Elimina la red creada por Docker Compose.

Los datos permanecen almacenados en los volúmenes.

---

# Eliminar Todo Incluyendo Datos

Si se desea eliminar completamente el entorno:

```bash
docker compose down -v
```

La opción `-v` elimina también:

* Bases de datos.
* Volúmenes persistentes.
* Datos de RabbitMQ.

Este comando debe utilizarse únicamente cuando se desea reiniciar completamente el entorno.

---

# Acceder a un Contenedor

Ingresar a un contenedor en ejecución:

```bash
docker exec -it filmstars-reservations-service sh
```

Ejemplo para PostgreSQL:

```bash
docker exec -it filmstars-db-reservations sh
```

---

# Acceder a PostgreSQL

Ingresar al contenedor:

```bash
docker exec -it filmstars-db-reservations sh
```

Conectarse a PostgreSQL:

```bash
psql -U postgres -d filmstars_reservations
```

Ejemplo:

```sql
SELECT * FROM reservations;
```

Listar tablas:

```sql
\dt
```

Salir:

```sql
\q
```

---

# Verificar Estado de RabbitMQ

RabbitMQ expone una interfaz web de administración.

Acceder desde el navegador:

```text
http://localhost:15672
```

Credenciales:

```text
Usuario: admin
Contraseña: admin123
```

Desde esta interfaz es posible:

* Ver colas.
* Ver exchanges.
* Ver mensajes.
* Monitorear consumidores.
* Revisar conexiones activas.

---

# Ver Redes Docker

Listar redes:

```bash
docker network ls
```

Inspeccionar la red del proyecto:

```bash
docker network inspect filmstars-network
```

Esto permite visualizar todos los contenedores conectados a la arquitectura.

---

# Ver Volúmenes Persistentes

Listar volúmenes:

```bash
docker volume ls
```

Entre ellos:

```text
db_users_data
db_movies_data
db_reservations_data
db_payments_data
rabbitmq_data
```

Estos volúmenes almacenan la información de forma permanente.

---

# Ver Uso de Espacio

Consultar consumo de recursos:

```bash
docker system df
```

Consultar estadísticas en tiempo real:

```bash
docker stats
```

Permite monitorear:

* CPU
* Memoria RAM
* Red
* Almacenamiento

de cada servicio desplegado.

---

# Flujo Recomendado de Trabajo

Para iniciar el proyecto:

```bash
cd Fase2/FilmStars
docker compose up --build -d
```

Verificar estado:

```bash
docker compose ps
```

Revisar logs:

```bash
docker compose logs -f
```

Realizar pruebas sobre la plataforma.

Al finalizar:

```bash
docker compose down
```

Este procedimiento garantiza una ejecución consistente y reproducible de toda la arquitectura FilmStars.
