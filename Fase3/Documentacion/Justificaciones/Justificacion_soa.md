# Justificación de Arquitectura Orientada a Servicios (SOA) - FilmStars

FilmStars utiliza una Arquitectura Orientada a Servicios (SOA) porque el sistema está compuesto por dominios de negocio con responsabilidades claramente separadas: autenticación y usuarios, cartelera, reservas, pagos, comunicación asíncrona y despliegue. Esta separación permite que cada servicio evolucione, se pruebe, se mantenga y se despliegue de manera independiente.

Desde las fases iniciales, la arquitectura se diseñó para resolver problemas críticos del negocio: consulta de cartelera, selección de funciones, reserva de asientos, procesamiento de pagos y emisión de boletos. Posteriormente, se incorporaron autenticación con JWT, API Gateway, bases de datos separadas por servicio, RabbitMQ y contenedores con Docker Compose.

En la Fase 4, la arquitectura se amplía sin romper la separación original. Se agregan nuevas capacidades relacionadas con la administración de cartelera, la eficiencia en datos y la infraestructura de despliegue: carga masiva de películas desde CSV, paginación del lado del servidor, Docker Hub como registry de imágenes, GitHub Actions como pipeline CI/CD y despliegue inmutable hacia VM/AWS EC2.

---

## 1. Servicios y responsabilidades actualizadas

| Servicio / Componente | Responsabilidad principal | Base de datos / soporte | Cambios incorporados hasta Fase 4 |
|---|---|---|---|
| API Gateway | Punto de entrada único, enrutamiento y validación JWT. | No aplica. | Enruta peticiones del frontend hacia los servicios internos. En Fase 4 también debe enrutar endpoints de carga CSV y consultas paginadas, preservando parámetros como `page`, `limit`, `city`, `category` y `search`. Además, valida JWT y rol `Admin` en rutas administrativas. |
| Users Service | Autenticación, registro, login, emisión de JWT, roles y gestión de usuarios. | `filmstars_users` | Mantiene la responsabilidad de emitir JWT con claims esenciales como id, nombre, correo y rol. |
| Movies Service | Gestión de ciudades, cines, salas, cartelera, películas y funciones. | `filmstars_movies` | En Fase 4 asume la carga masiva de películas desde CSV, validación de registros, control de duplicados y paginación del lado del servidor. |
| Reservations Service | Reservas, bloqueo temporal de asientos, disponibilidad y estado de asientos por función. | `filmstars_reservations` | Se mantiene como servicio crítico para controlar concurrencia y evitar doble asignación de asientos. |
| Payments Service | Pagos simulados, detalle de pagos, boletos, reembolsos y trazabilidad de transacciones. | `filmstars_payments` | Se mantiene separado para aislar transacciones financieras y emisión de boletos. |
| RabbitMQ | Broker de mensajería para procesos críticos. | No aplica. | Desacopla reservas, pagos y emisión de boletos, permitiendo reprocesamiento ante fallos. |
| Docker Compose | Orquestación de contenedores. | Archivos `docker-compose.yml` / `docker-compose.prod.yml` | Permite levantar el entorno local y productivo. En Fase 4, el compose de producción debe usar imágenes precompiladas, no `build: .`. |
| GitHub Actions | Pipeline CI/CD. | Workflow del repositorio. | Ejecuta pruebas, valida cobertura mínima, construye imágenes Docker, publica en Docker Hub y despliega hacia VM. |
| Docker Hub | Registry público de artefactos Docker. | Imágenes versionadas por servicio. | Nuevo componente de soporte DevOps para almacenar imágenes precompiladas e inmutables. |
| VM / AWS EC2 | Entorno de despliegue. | Servidor con Docker y Docker Compose. | Ejecuta el sistema descargando imágenes desde Docker Hub mediante `docker compose pull`. |

---

## 2. ¿Por qué se eligió SOA?

Se eligió SOA porque FilmStars combina procesos con responsabilidades distintas y niveles de criticidad diferentes. La autenticación, la cartelera, las reservas y los pagos no deben mezclarse en un único bloque de código, ya que cada dominio cambia por motivos diferentes.

La separación por servicios permite:

- Modificar la lógica de cartelera sin afectar autenticación.
- Cambiar reglas de reserva sin alterar pagos.
- Escalar el servicio de películas cuando aumenten las consultas.
- Escalar reservas cuando existan picos de selección de asientos.
- Mantener trazabilidad independiente para pagos y boletos.
- Proteger rutas desde un punto central usando API Gateway y JWT.
- Procesar operaciones críticas con RabbitMQ sin bloquear el flujo principal.

La Fase 4 confirma esta decisión, porque las nuevas funcionalidades se integran al dominio correcto sin afectar el resto de servicios. La carga CSV y la paginación pertenecen al **Movies Service**, por lo que no se colocan en Users, Reservations ni Payments.

---

## 3. Justificación por servicio

### 3.1 API Gateway

| Aspecto | Justificación |
|---|---|
| ¿Qué hace? | Recibe las peticiones del frontend y las redirige hacia los servicios internos. |
| ¿Por qué existe? | Evita que el frontend conozca directamente la ubicación interna de cada servicio. |
| ¿Para qué sirve? | Centraliza CORS, validación JWT, validación de rol y enrutamiento. |
| Ejemplos | `/api/auth/login` se redirige a Users Service; `/api/movies` se redirige a Movies Service; `/api/movies/import-csv` se redirige al motor de carga del Movies Service. |
| Fase 4 | Debe preservar parámetros de paginación y filtros, además de validar rol `Admin` para la carga masiva CSV. |

### 3.2 Users Service

| Aspecto | Justificación |
|---|---|
| ¿Qué hace? | Gestiona registro, login, usuarios, roles y JWT. |
| ¿Por qué está separado? | La autenticación es una responsabilidad transversal y sensible que no debe mezclarse con cartelera, reservas o pagos. |
| ¿Para qué sirve? | Permite proteger rutas, controlar identidad del usuario y diferenciar usuarios comunes de administradores. |
| Base de datos | `filmstars_users` |
| Fase 4 | Mantiene la emisión de JWT con claims de identidad y rol, necesarios para validar que solo administradores puedan cargar archivos CSV. |

### 3.3 Movies Service

| Aspecto | Justificación |
|---|---|
| ¿Qué hace? | Gestiona ciudades, cines, salas, películas, funciones, géneros y cartelera. |
| ¿Por qué está separado? | La cartelera se consulta frecuentemente y puede escalar de forma independiente. |
| ¿Para qué sirve? | Permite que el usuario seleccione ubicación, cine, película y función. |
| Base de datos | `filmstars_movies` |
| Fase 4 | Incorpora carga masiva CSV, validación de estructura y registros, control de duplicados y paginación server-side. |

### 3.4 Reservations Service

| Aspecto | Justificación |
|---|---|
| ¿Qué hace? | Gestiona reservas, bloqueo temporal de asientos y estado de asientos por función. |
| ¿Por qué está separado? | Es el dominio más crítico en concurrencia, porque varios usuarios pueden intentar reservar el mismo asiento. |
| ¿Para qué sirve? | Evita doble asignación de asientos y permite liberar asientos vencidos. |
| Base de datos | `filmstars_reservations` |
| Comunicación | Debe publicar y consumir eventos de RabbitMQ para procesar reservas de forma asíncrona. |
| Fase 4 | No se modifica directamente, lo cual demuestra bajo acoplamiento: la mejora de catálogo no afecta la lógica de reserva. |

### 3.5 Payments Service

| Aspecto | Justificación |
|---|---|
| ¿Qué hace? | Gestiona pagos simulados, detalles de pago, boletos y reembolsos. |
| ¿Por qué está separado? | Las transacciones financieras deben aislarse para mejorar seguridad, trazabilidad y tolerancia a fallos. |
| ¿Para qué sirve? | Permite confirmar compras y emitir boletos después de un pago exitoso. |
| Base de datos | `filmstars_payments` |
| Comunicación | Consume eventos relacionados con reservas y publica resultados de pago o emisión de boleto. |
| Fase 4 | No se modifica directamente; el despliegue inmutable permite publicar también su imagen de forma controlada. |

### 3.6 RabbitMQ

| Aspecto | Justificación |
|---|---|
| ¿Qué hace? | Actúa como middleware de mensajería basado en colas. |
| ¿Por qué se usa? | Desacopla procesos críticos y evita bloquear el hilo principal de la aplicación. |
| ¿Para qué sirve? | Permite procesar reservas, pagos y emisión de boletos de forma asíncrona. |
| Fase 4 | Se mantiene como componente crítico de comunicación asíncrona, aunque CSV y paginación se manejan por HTTP por requerir respuesta inmediata. |

### 3.7 Docker Hub, GitHub Actions y VM/AWS EC2

| Aspecto | Justificación |
|---|---|
| ¿Qué hacen? | Soportan el flujo de CI/CD, construcción de imágenes, publicación de artefactos y despliegue. |
| ¿Por qué se agregan? | La Fase 4 exige infraestructura inmutable: la VM no debe construir imágenes, solo descargarlas. |
| ¿Para qué sirven? | Garantizan que la imagen probada en el pipeline sea la misma que se despliega en la VM. |
| Relación con SOA | Cada servicio SOA se empaqueta como imagen independiente y se publica en Docker Hub. |

---

## 4. Comunicación síncrona, asíncrona y despliegue

| Tipo de comunicación | Uso en el sistema | Justificación |
|---|---|---|
| HTTP/REST síncrono | Login, registro, consulta de cartelera, consulta de ciudades, cines, funciones, carga CSV y catálogo paginado. | Son operaciones que requieren respuesta inmediata al usuario o administrador. |
| RabbitMQ asíncrono | Reserva de asientos, procesamiento de pago y emisión de boleto. | Son operaciones críticas que pueden tardar o requerir reproceso ante fallos. |
| Docker Hub pull | Despliegue de imágenes en VM. | Evita compilar en producción y garantiza que se despliegue un artefacto probado. |

La carga CSV y la paginación no se envían a RabbitMQ porque el administrador y el usuario necesitan una respuesta directa: errores de archivo, filas rechazadas, metadatos de paginación y resultados visibles en pantalla.

---

## 5. Base de datos por servicio

Se mantiene el patrón **Database per Service**. Cada servicio conserva su propio almacenamiento o lógica de acceso a datos.

| Servicio | Base de datos | Motivo |
|---|---|---|
| Users Service | `filmstars_users` | Aísla credenciales, roles, sesiones y datos personales. |
| Movies Service | `filmstars_movies` | Aísla cartelera, ciudades, cines, salas, películas, géneros, funciones, carga CSV y consultas paginadas. |
| Reservations Service | `filmstars_reservations` | Aísla reservas, disponibilidad, bloqueo temporal y estado de asientos por función. |
| Payments Service | `filmstars_payments` | Aísla transacciones, boletos, detalle de pagos y reembolsos. |

Las relaciones entre servicios no se implementan con llaves foráneas físicas entre bases de datos distintas. En su lugar, se usan referencias externas o identificadores lógicos:

| Campo | Significado |
|---|---|
| `usuario_id_ref` | Referencia lógica a un usuario del Users Service. |
| `funcion_id_ref` | Referencia lógica a una función del Movies Service. |
| `asiento_id_ref` | Referencia lógica a un asiento del Movies Service. |
| `reserva_id_ref` | Referencia lógica a una reserva del Reservations Service. |
| `reserva_asiento_id_ref` | Referencia lógica a un asiento reservado. |

Esta decisión mantiene la independencia de datos y evita acoplar físicamente las bases de datos de distintos dominios.

---

## 6. Carga CSV dentro de SOA

La carga masiva de películas se ubica en el **Movies Service** porque pertenece al dominio de cartelera.

### Justificación

1. El archivo contiene información de películas.
2. El Movies Service conoce la estructura de `pelicula`, `genero` y `pelicula_genero`.
3. La validación de tipo de función (`ESTRENO`, `PREVENTA`, `REESTRENO`) pertenece al dominio de cartelera.
4. La base de datos afectada es únicamente `filmstars_movies`.
5. El administrador accede por API Gateway, pero la lógica de negocio queda en el servicio dueño del dominio.
6. El Users Service solo emite el JWT; no procesa películas.
7. Reservations y Payments no se ven afectados por la forma en que se cargan películas.

### Flujo esperado

```txt
Administrador → Frontend Admin → API Gateway → Movies Service → filmstars_movies
```

### Responsabilidades por componente

| Componente | Responsabilidad en carga CSV |
|---|---|
| Frontend Admin | Permite seleccionar y enviar el archivo CSV. |
| API Gateway | Valida JWT y rol `Admin`, y enruta la solicitud. |
| Movies Service | Valida extensión, estructura, columnas, tipos de datos, duplicados y reglas de negocio. |
| `filmstars_movies` | Persiste las películas válidas, géneros y relaciones necesarias. |

---

## 7. Paginación dentro de SOA

La paginación del catálogo pertenece al **Movies Service** porque este servicio consulta y administra la cartelera.

### Justificación

1. El frontend no debe traer todo el catálogo.
2. El Movies Service es dueño de la información de películas y funciones.
3. Los filtros deben aplicarse antes de paginar.
4. El backend debe retornar máximo 10 películas por página.
5. La respuesta debe incluir metadatos: página actual, límite, total de registros y total de páginas.
6. La paginación mejora rendimiento sin modificar reservas ni pagos.

### Flujo esperado

```txt
Usuario → Frontend → API Gateway → Movies Service → filmstars_movies
```

### Ejemplo de consulta

```http
GET /api/movies?page=1&limit=10&category=ESTRENO&city=guatemala&search=guardianes
```

### Ejemplo de respuesta esperada

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 36,
    "totalPages": 4
  }
}
```

---

## 8. Infraestructura inmutable como soporte de SOA

En Fase 4, Docker Hub y GitHub Actions no son servicios de negocio, pero sí componentes de soporte para la arquitectura.

El pipeline garantiza que cada servicio SOA tenga una imagen construida, probada y publicada:

| Imagen esperada | Componente |
|---|---|
| `filmstars-api-gateway:latest` | API Gateway |
| `filmstars-users-service:latest` | Users Service |
| `filmstars-movies-service:latest` | Movies Service |
| `filmstars-reservas-service:latest` | Reservations Service |
| `filmstars-payments-service:latest` | Payments Service |
| `filmstars-frontend:latest` | Frontend |

La VM no construye imágenes. Solo descarga versiones publicadas desde Docker Hub:

```yaml
movies-service:
  image: dockerhub_usuario/filmstars-movies-service:latest
```

El despliegue esperado en VM es:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

Esto evita inconsistencias entre ambientes y cumple con la restricción de no hacer builds en producción.

---

## 9. Beneficios de la arquitectura

| Beneficio | Explicación |
|---|---|
| Bajo acoplamiento | Cada servicio puede modificarse sin afectar directamente a los demás. |
| Escalabilidad | Servicios con mayor carga, como cartelera o reservas, pueden escalarse por separado. |
| Mantenibilidad | La lógica está separada por dominio de negocio. |
| Seguridad | El acceso está centralizado en el API Gateway y se protege con JWT y roles. |
| Tolerancia a fallos | RabbitMQ permite mantener mensajes en cola y reprocesar eventos críticos. |
| Trazabilidad | Las tablas de mensajería y eventos permiten registrar operaciones importantes. |
| Rendimiento | La paginación evita enviar todo el catálogo al frontend. |
| Administración eficiente | La carga CSV permite registrar catálogos masivos sin hacerlo manualmente. |
| Despliegue estable | Docker Hub permite desplegar artefactos precompilados. |
| Consistencia operativa | La misma imagen probada en CI/CD es la que se despliega en la VM. |

---

## 10. Resultados esperados

Con esta arquitectura, FilmStars logra:

1. Separar responsabilidades por dominio.
2. Mantener independencia de datos por servicio.
3. Controlar concurrencia en reservas mediante mensajería asíncrona.
4. Proteger rutas con JWT y roles.
5. Optimizar consultas de cartelera mediante paginación server-side.
6. Facilitar administración de películas mediante CSV.
7. Construir y publicar imágenes desde CI/CD.
8. Desplegar en VM mediante imágenes precompiladas.
9. Evitar builds en producción.
10. Mantener una arquitectura preparada para crecer.

---

## Conclusión

SOA sigue siendo adecuada para FilmStars porque el sistema combina autenticación, cartelera, reservas concurrentes, pagos, administración y despliegue por servicios. Estos dominios tienen necesidades distintas y pueden evolucionar de forma independiente.

La Fase 4 confirma la utilidad de esta arquitectura: la carga CSV y la paginación se agregan al Movies Service sin afectar Users, Reservations ni Payments. Además, Docker Hub y GitHub Actions fortalecen la arquitectura desde la parte operativa, permitiendo empaquetar cada servicio de forma independiente y desplegar imágenes precompiladas en la VM.

En conclusión, la combinación de API Gateway, servicios separados, bases de datos independientes, RabbitMQ, Docker Hub y CI/CD permite construir una solución más mantenible, escalable, segura y alineada con los requerimientos actuales de FilmStars.
