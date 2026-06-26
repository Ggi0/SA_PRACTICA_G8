# Manual de Uso de Docker Compose

## Introducción

La plataforma FilmStars se encuentra completamente contenerizada mediante Docker y Docker Compose. Esta estrategia permite desplegar todos los componentes del sistema utilizando una única configuración centralizada definida en el archivo:

```bash
Fase3/FilmStars/docker-compose.yml
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
Fase3/FilmStars/payments-service/Dockerfile
```

```bash
Fase3/FilmStars/reservas-service/Dockerfile
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

# Orden de Inicio y Dependencias

Responsable: Angel.

Docker Compose administra el orden de inicio mediante `depends_on` y `healthcheck`. En FilmStars no todos los servicios pueden iniciar al mismo tiempo, porque los microservicios dependen de bases de datos, RabbitMQ o servicios internos.

El orden lógico de arranque es:

1. Bases de datos PostgreSQL: `db-users`, `db-movies`, `db-reservations` y `db-payments`.
2. RabbitMQ: `rabbitmq`.
3. Microservicios de dominio: `users-service`, `movies-service`, `reservations-service` y `payments-service`.
4. API Gateway: `api-gateway`.
5. Frontend: `frontend`.

Dependencias principales configuradas:

* `users-service` espera a que `db-users` esté saludable.
* `movies-service` espera a que `db-movies` esté saludable.
* `reservations-service` espera a `db-reservations` y `rabbitmq`.
* `payments-service` espera a `db-payments` y `rabbitmq`.
* `api-gateway` inicia después de `users-service` y `movies-service`.
* `frontend` inicia después de `api-gateway`.

Los `healthcheck` de PostgreSQL utilizan `pg_isready` para confirmar que cada base de datos está lista antes de iniciar el servicio que la consume. RabbitMQ utiliza `rabbitmq-diagnostics ping` para validar su disponibilidad.

---

# Servicios y Módulos del Entorno

El entorno Docker Compose del proyecto está compuesto por servicios de aplicación, infraestructura y persistencia.

| Servicio | Módulo | Puerto | Función |
| --- | --- | --- | --- |
| `frontend` | React/Vite | `5173` | Interfaz web de FilmStars. |
| `api-gateway` | API Gateway | `8080` | Punto de entrada para el frontend y enrutamiento hacia microservicios. |
| `users-service` | Usuarios | `3001` | Registro, autenticación, perfiles y JWT. |
| `movies-service` | Películas/cartelera | `3002` | Gestión y consulta de películas, funciones, cines y ciudades. |
| `reservations-service` | Reservas | `3003` | Disponibilidad, bloqueo y confirmación de asientos. |
| `payments-service` | Pagos | `3004` | Procesamiento de pagos y confirmación de transacciones. |
| `rabbitmq` | Mensajería | `5672`, `15672` | Comunicación asíncrona entre reservas y pagos. |
| `db-users` | PostgreSQL | `${USERS_DB_PORT}` | Base de datos de usuarios. |
| `db-movies` | PostgreSQL | `${MOVIES_DB_PORT}` | Base de datos de películas. |
| `db-reservations` | PostgreSQL | `${RESERVATIONS_DB_PORT}` | Base de datos de reservas. |
| `db-payments` | PostgreSQL | `${PAYMENTS_DB_PORT}` | Base de datos de pagos. |

Todos los contenedores se conectan a la red interna `filmstars-network`, lo que permite que los servicios se comuniquen usando sus nombres de servicio, por ejemplo `db-users`, `rabbitmq` o `users-service`.

---

# Preparar Variables de Entorno

Antes de levantar el entorno de desarrollo debe existir un archivo `.env` dentro de:

```bash
Fase3/FilmStars/.env
```

Si no existe, puede crearse tomando como referencia el archivo de ejemplo disponible en el proyecto:

```bash
Fase2/FilmStars/.env.example
```

Comando sugerido:

```bash
cp ../../Fase2/FilmStars/.env.example .env
```

Las variables mínimas requeridas por `docker-compose.yml` son:

* `NODE_ENV`
* `JWT_SECRET`
* `JWT_EXPIRES_IN`
* `API_GATEWAY_PORT`
* `USERS_SERVICE_PORT`
* `USERS_DB_HOST_INTERNAL`
* `USERS_DB_PORT`
* `USERS_DB_PORT_INTERNAL`
* `USERS_DB_NAME`
* `USERS_DB_USER`
* `USERS_DB_PASS`
* `MOVIES_DB_PORT`
* `MOVIES_DB_NAME`
* `MOVIES_DB_USER`
* `MOVIES_DB_PASS`
* `RESERVATIONS_DB_PORT`
* `RESERVATIONS_DB_NAME`
* `RESERVATIONS_DB_USER`
* `RESERVATIONS_DB_PASS`
* `PAYMENTS_DB_PORT`
* `PAYMENTS_DB_NAME`
* `PAYMENTS_DB_USER`
* `PAYMENTS_DB_PASS`
* `DEFAULT_ADMIN_NAME`
* `DEFAULT_ADMIN_EMAIL`
* `DEFAULT_ADMIN_PASSWORD`

Ejemplo de valores de desarrollo:

```env
NODE_ENV=development
JWT_SECRET=filmstars_jwt_secret_key_2026
JWT_EXPIRES_IN=24h
API_GATEWAY_PORT=8080
USERS_SERVICE_PORT=3001
USERS_DB_HOST_INTERNAL=db-users
USERS_DB_PORT=5433
USERS_DB_PORT_INTERNAL=5432
USERS_DB_NAME=filmstars_users
USERS_DB_USER=postgres
USERS_DB_PASS=postgres123
MOVIES_DB_PORT=5434
MOVIES_DB_NAME=filmstars_movies
MOVIES_DB_USER=postgres
MOVIES_DB_PASS=postgres123
RESERVATIONS_DB_PORT=5435
RESERVATIONS_DB_NAME=filmstars_reservations
RESERVATIONS_DB_USER=postgres
RESERVATIONS_DB_PASS=postgres123
PAYMENTS_DB_PORT=5436
PAYMENTS_DB_NAME=filmstars_payments
PAYMENTS_DB_USER=postgres
PAYMENTS_DB_PASS=postgres123
DEFAULT_ADMIN_NAME=FilmStars Admin
DEFAULT_ADMIN_EMAIL=admin@filmstars.com
DEFAULT_ADMIN_PASSWORD=admin12345
```

En un entorno productivo o cloud, las contraseñas y secretos no deben quedar escritos directamente en `.env`; deben manejarse como secretos o variables protegidas del proveedor de despliegue.

---

# Levantar Todo el Entorno con Docker Compose

Ubicarse en la carpeta donde se encuentra el archivo `docker-compose.yml`:

```bash
cd Fase3/FilmStars
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

Para levantar todo el entorno con Docker Compose reconstruyendo imágenes desde el inicio:

```bash
docker compose up --build -d
```

Después de iniciar, verificar el estado con:

```bash
docker compose ps
```

---

# Reconstruir Después de Cambios

Cuando se realizan cambios en el código fuente es recomendable reconstruir las imágenes:

```bash
docker compose up --build -d
```

Este comando vuelve a generar las imágenes utilizando los Dockerfiles actualizados.

Si el cambio afecta dependencias instaladas, archivos Dockerfile o configuración de build, puede forzarse una reconstrucción sin caché:

```bash
docker compose build --no-cache
docker compose up -d
```

Para reconstruir únicamente un servicio específico, por ejemplo `payments-service`:

```bash
docker compose up --build -d payments-service
```

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

# Detener el Entorno

Detener todos los contenedores:

```bash
docker compose down
```

Este comando:

* Detiene los contenedores.
* Elimina la red creada por Docker Compose.

Los datos permanecen almacenados en los volúmenes.

Si se desea detener sin eliminar contenedores ni red, puede utilizarse:

```bash
docker compose stop
```

Para volver a iniciar los contenedores detenidos:

```bash
docker compose start
```

---

# Entorno Cloud

En la versión actual del proyecto existen dos destinos cloud diferenciados en el pipeline CI/CD:

* `develop`: se despliega en una instancia EC2 de AWS usando Docker Compose.
* `release`: se despliega en un clúster K3s sobre AWS usando manifiestos Kubernetes.

Por lo tanto, Docker Compose se utiliza como mecanismo cloud para el entorno `develop`, mientras que el entorno `release` ya no depende de Docker Compose para ejecutar la aplicación.

## Cloud Develop: EC2 con Docker Compose

El entorno `develop` se ejecuta en la instancia EC2 generada por Terraform y configurada por Ansible. El pipeline copia a la VM los archivos necesarios y levanta el stack con:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

El archivo utilizado es:

```bash
Fase3/FilmStars/docker-compose.prod.yml
```

En este entorno las imágenes no se construyen dentro de la VM. El pipeline las construye previamente y las publica en Docker Hub con etiquetas como `latest` y `develop-<numero-ejecucion>`. Luego la VM solo descarga y reinicia los contenedores.

Variables y secretos usados por el despliegue `develop`:

| Variable o secreto | Uso |
| --- | --- |
| `DOCKERHUB_USERNAME` | Prefijo de las imágenes publicadas en Docker Hub. |
| `DEVELOP_SSH_KEY` | Llave SSH usada por GitHub Actions para conectarse a la EC2. |
| `DB_PASS` | Contraseña común para las bases PostgreSQL. |
| `JWT_SECRET` | Secreto usado para firmar y validar tokens JWT. |
| `RABBITMQ_PASS` | Contraseña del usuario `admin` de RabbitMQ. |
| `ADMIN_PASSWORD` | Contraseña inicial del administrador de FilmStars. |

Durante el despliegue, el pipeline crea en la VM un `.env` mínimo con:

```env
DOCKERHUB_USERNAME=<usuario-dockerhub>
RABBITMQ_PASS=<password-rabbitmq>
```

También crea archivos locales bajo `~/filmstars/secrets/` para que `docker-compose.prod.yml` los monte como Docker secrets:

```text
secrets/db_password.txt
secrets/jwt_secret.txt
secrets/rabbitmq_password.txt
secrets/admin_password.txt
```

Estos archivos no forman parte del repositorio; se generan dinámicamente desde GitHub Secrets durante el despliegue.

Servicios levantados en `develop` con Docker Compose:

* `frontend`
* `api-gateway`
* `users-service`
* `movies-service`
* `reservations-service`
* `payments-service`
* `rabbitmq`
* `db-users`
* `db-movies`
* `db-reservations`
* `db-payments`

Para detener manualmente el entorno `develop` dentro de la VM:

```bash
cd ~/filmstars
docker compose -f docker-compose.prod.yml down
```

Para reconstruir después de cambios, el flujo correcto no es construir en la VM. Se realiza un nuevo push a `develop`, el pipeline reconstruye las imágenes, las publica en Docker Hub y ejecuta nuevamente `pull` + `up -d --remove-orphans` en la EC2.

## Cloud Release: K3s sobre AWS

El entorno `release` usa Kubernetes mediante K3s, no Docker Compose. Los manifiestos se encuentran en:

```bash
Fase3/FilmStars/k3s/
```

Componentes principales del entorno `release`:

| Componente | Archivo | Función |
| --- | --- | --- |
| Namespace `filmstars` | `namespace.yaml` | Aísla los recursos de la aplicación. |
| Namespace `monitoring` | `infra/ansible/playbooks/monitoring.yml` | Aísla Prometheus, Grafana y recursos de observabilidad. |
| ConfigMaps | `configmaps.yaml` | Configuración no sensible de servicios, puertos, hosts internos y nombres de bases. |
| Secret | creado por pipeline | Guarda `DB_PASS`, `JWT_SECRET`, `RABBITMQ_PASS` y `DEFAULT_ADMIN_PASSWORD`. |
| Bases PostgreSQL | `databases.yaml` | Despliega cuatro PostgreSQL con PVC de 1Gi. |
| RabbitMQ | `rabbitmq.yaml` | Broker AMQP para comunicación entre reservas y pagos. |
| Aplicaciones | `apps.yaml` | Despliega frontend, API Gateway y microservicios. |
| Ingress | `ingress.yaml` | Expone frontend y API Gateway mediante Traefik. |
| Observabilidad | `infra/ansible/playbooks/monitoring.yml` | Instala `kube-prometheus-stack` con Helm. |

Namespaces usados en cloud:

| Namespace | Contenido |
| --- | --- |
| `filmstars` | Frontend, API Gateway, microservicios, PostgreSQL, RabbitMQ, ConfigMaps, Secret e Ingress. |
| `monitoring` | Prometheus, Grafana, servicios del chart `kube-prometheus-stack` y dashboard de FilmStars. |

Orden de despliegue en `release`:

1. Terraform aprovisiona infraestructura AWS.
2. Ansible configura las instancias EC2, instala K3s y prepara componentes comunes como `node_exporter`.
3. Ansible crea el namespace `monitoring` e instala `kube-prometheus-stack` con Helm.
4. El pipeline construye imágenes y las publica en Zot, el registry privado del proyecto.
5. Se aplica el Namespace `filmstars`.
6. Se crea o actualiza el Secret `filmstars-secrets` desde GitHub Secrets.
7. Se crean ConfigMaps de scripts SQL y RabbitMQ.
8. Se aplican ConfigMaps generales.
9. Se despliegan bases de datos PostgreSQL y se espera su rollout.
10. Se despliega RabbitMQ y se reconcilian credenciales.
11. Se aplican aplicaciones e Ingress usando `envsubst` para `ZOT_HOST`, `TAG` y `K3S_IP`.
12. Se espera el rollout de los servicios y se ejecuta rollback automático si falla un Deployment.

El acceso externo en `release` no expone cada microservicio por separado. El Ingress de Traefik publica:

* `/`: frontend.
* `/api`: API Gateway.

Los demás servicios son internos de Kubernetes y se comunican por DNS del clúster, por ejemplo `users-service`, `db-users` y `rabbitmq`.

La observabilidad queda separada de la aplicación. Ansible instala Helm, agrega el repositorio `prometheus-community` y despliega el release `kps` del chart `kube-prometheus-stack` en el namespace `monitoring`. En la configuración actual:

* Grafana se expone como `NodePort` en el puerto `30030`.
* Prometheus se expone como `NodePort` en el puerto `30090`.
* Alertmanager está deshabilitado.
* `prometheus-node-exporter` del chart está deshabilitado para evitar duplicidad.
* `node_exporter` se instala como servicio systemd en las instancias EC2 desde el playbook común.
* Prometheus recolecta métricas de las instancias `registry`, `develop` y `k3s` por el puerto `9100`.
* Prometheus también consulta métricas del API Gateway en `api-gateway.filmstars.svc.cluster.local:8080/metrics`.
* Grafana importa el dashboard de FilmStars desde `infra/observability/grafana-filmstars-dashboard.json`.

Para revisar el estado del entorno `release`:

```bash
kubectl -n filmstars get pods,svc,ingress
```

Para revisar el estado de observabilidad:

```bash
kubectl -n monitoring get pods,svc
```

Para detener la aplicación en `release` sin destruir infraestructura:

```bash
kubectl -n filmstars scale deployment --all --replicas=0
```

Para aplicar cambios en `release`, el flujo correcto es hacer push a la rama `release`. El pipeline publica nuevas imágenes en Zot, actualiza los manifiestos con la etiqueta `release-<numero-ejecucion>` y deja a Kubernetes ejecutar el rollout.

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
cd Fase3/FilmStars
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
