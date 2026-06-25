# Arquitectura del Clúster Kubernetes — FilmStars (K3s sobre AWS)

## 1. Visión General

FilmStars despliega su entorno de **release** sobre un clúster de **K3s** (distribución ligera de Kubernetes certificada por la CNCF) ejecutándose en una instancia de **Amazon Web Services (AWS)** identificada como `vm-filmstars-k3s-server` en la zona `us-east-2c`. La elección de K3s responde al requisito de operar Kubernetes real sobre infraestructura limitada: empaqueta el Control Plane, el datastore y el runtime en un único binario liviano, ideal para un nodo único de laboratorio, conservando la compatibilidad total con la API de Kubernetes y con `kubectl`.

Toda la infraestructura del clúster se gestiona de forma **declarativa** mediante Terraform, Ansible y manifiestos YAML versionados en `Fase3/FilmStars/k3s/`, aplicados exclusivamente a través del pipeline de CD. El acceso al clúster se realiza con el kubeconfig generado por Ansible y transferido como artifact interno del workflow; no existen credenciales estáticas embebidas en los manifiestos.

![Vista de Despliegue Release (K3s sobre AWS)](./image/Vista%20de%20Despliegue(Física)-release.png)

---

## 2. Distribución Física del Clúster

### 2.1 Nodo Worker

En su configuración actual, el clúster opera con **un único nodo** (server K3s que cumple simultáneamente el rol de Control Plane y Worker), sobre una instancia EC2 de recursos acotados. Todos los Pods de la plataforma —microservicios, bases de datos, broker de mensajería y frontend— corren sobre este nodo.

La concentración en un único nodo es una decisión de diseño propia de la escala del proyecto académico; en un entorno empresarial real se distribuiría entre múltiples nodos en zonas de disponibilidad distintas. Esta limitación de recursos motiva varias decisiones operativas del pipeline (escalar a 0 los Deployments antiguos antes de actualizar, y la estrategia `RollingUpdate` con `maxSurge: 0`), descritas en [flujoPipeline.md](./flujoPipeline.md) y [ZeroDowntime.md](./ZeroDowntime.md).

### 2.2 Namespace de Aislamiento

La totalidad de los recursos de la aplicación está aislada dentro del Namespace **`filmstars`**, declarado en `k3s/namespace.yaml`. El uso de un Namespace dedicado aísla lógicamente los recursos de FilmStars del espacio por defecto y de los namespaces del sistema de K3s (`kube-system`), evitando colisiones de nombres y permitiendo aplicar operaciones por lote a nivel de Namespace de forma uniforme (`kubectl -n filmstars ...`).

### 2.3 Componentes Gestionados por K3s

Además del Namespace de aplicación, K3s provee de fábrica varios componentes que FilmStars aprovecha sin instalarlos manualmente:

- **Traefik:** Ingress Controller incluido por defecto en K3s, usado por el `Ingress` de FilmStars (`ingressClassName: traefik`).
- **CoreDNS:** resolución DNS interna que permite a los servicios encontrarse por nombre (`db-users`, `rabbitmq`, `api-gateway`, etc.).
- **Local Path Provisioner:** aprovisiona automáticamente los `PersistentVolume` locales que respaldan los PVC de las bases de datos.

---

## 3. Recursos de Configuración del Clúster

### 3.1 ConfigMaps

La configuración **no sensible** se centraliza en ConfigMaps (`k3s/configmaps.yaml`):

- **`filmstars-common`:** valores compartidos por todos los servicios — `NODE_ENV`, `DB_USER`, `DB_PORT`, `JWT_EXPIRES_IN`, parámetros de RabbitMQ (`RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USER`) y las URLs internas de descubrimiento de servicios basadas en nombres DNS de Kubernetes (`http://users-service:3001`, `http://movies-service:3002`, `http://reservations-service:3003`, `http://payments-service:3004`). Al declarar estas URLs como nombres de servicio, los microservicios son agnósticos a las IPs internas, que el plano de control asigna dinámicamente.
- **ConfigMaps por servicio:** `users-config`, `movies-config`, `reservations-config`, `payments-config` y `gateway-config`, que aportan el `PORT`, el `DB_HOST`, el `DB_NAME` y parámetros específicos (p. ej. `RESERVATION_TIMEOUT_MINUTES: "10"` en reservas, o el `DEFAULT_ADMIN_*` en users).
- **ConfigMaps de inicialización:** `*-initsql` (scripts `init.sql`/`seed.sql` montados en `/docker-entrypoint-initdb.d` de cada PostgreSQL) y `rabbitmq-definitions` / `rabbitmq-config`, creados por el pipeline a partir de archivos.

Los pods consumen estos ConfigMaps mediante `envFrom.configMapRef`, combinando el común con el específico de cada servicio.

### 3.2 Secret

El Secret **`filmstars-secrets`** (tipo `Opaque`) almacena la información sensible de runtime: `DB_PASS`, `JWT_SECRET`, `RABBITMQ_PASS` y `DEFAULT_ADMIN_PASSWORD`. Kubernetes lo almacena cifrado en `etcd`, y los Pods lo consumen mediante `envFrom.secretRef` (y, en el caso de las bases de datos y RabbitMQ, mediante `secretKeyRef` para claves puntuales como `POSTGRES_PASSWORD` y `RABBITMQ_DEFAULT_PASS`). Ningún valor sensible aparece en texto plano en los manifiestos del repositorio; el Secret se crea/actualiza de forma idempotente desde GitHub Secrets en cada release.

---

## 4. Punto de Acceso Externo: Ingress

El recurso `Ingress` denominado **`filmstars-ingress`** es el **único punto de entrada externo** al clúster. Opera con la clase **Traefik** y publica el dominio `filmstars.${K3S_IP}.nip.io`, donde `${K3S_IP}` se sustituye con `envsubst` durante el despliegue. El uso de **`nip.io`** —un DNS comodín que resuelve `filmstars.<IP>.nip.io` directamente a esa IP— evita tener que configurar un dominio o registros DNS propios, un recurso valioso en entornos de laboratorio.

Ningún servicio de la plataforma se expone con tipo `LoadBalancer` o `NodePort`; todos son de tipo `ClusterIP`, accesibles únicamente dentro del clúster o a través del Ingress. Las reglas de enrutamiento son:

- **Path `/api`** → Service `api-gateway` en puerto `8080`: dirige todas las llamadas de API hacia el Gateway, punto de entrada unificado del backend.
- **Path `/`** → Service `frontend` en puerto `80`: dirige el tráfico del navegador hacia la aplicación React + Vite.

---

## 5. Pods de Microservicios

Los seis servicios de aplicación están escritos en **Node.js + TypeScript (Express)** y comparten un patrón homogéneo: estrategia `RollingUpdate` (`maxSurge: 0`, `maxUnavailable: 1`), `replicas: 1`, configuración inyectada por `envFrom` (ConfigMap común + ConfigMap propio + Secret), y un `Service` `ClusterIP` que les da nombre estable.

### 5.1 API Gateway

**api-gateway** (puerto `8080/TCP HTTP`) es la única interfaz entre el Ingress y los microservicios internos. Valida los tokens **JWT** y enruta las peticiones HTTP/REST hacia el servicio correspondiente, cuyas URLs conoce a través del ConfigMap `filmstars-common`. Sus Readiness y Liveness Probes son de tipo `tcpSocket` sobre el puerto `8080`.

### 5.2 Microservicios de Dominio

| Servicio | Puerto | Base de datos | Mensajería | Responsabilidad |
|----------|--------|---------------|------------|-----------------|
| `users-service` | 3001 | `db-users` | — | Registro, autenticación y emisión de JWT; siembra el usuario admin inicial. |
| `movies-service` | 3002 | `db-movies` | — | Catálogo de películas, funciones y cartelera. |
| `reservations-service` | 3003 | `db-reservations` | RabbitMQ (productor) | Reserva y compra de boletos; publica eventos de reserva. |
| `payments-service` | 3004 | `db-payments` | RabbitMQ (consumidor) | Procesa pagos de forma asíncrona consumiendo la cola. |

Cada microservicio tiene **su propia base de datos** (patrón *database-per-service*), de modo que no comparten esquema ni estado. Las Probes de estos servicios son `tcpSocket` sobre su puerto. El **frontend** (puerto `80`) usa Probes `httpGet` sobre `/`.

### 5.3 Comunicación Interna

La comunicación entre el api-gateway y los microservicios se realiza por **HTTP/REST** usando los nombres de servicio de Kubernetes como DNS de descubrimiento (`http://users-service:3001`, etc.). Adicionalmente, **reservations-service** publica mensajes en **RabbitMQ** (AMQP, puerto `5672`) que **payments-service** consume, desacoplando el cobro del flujo de reserva. Ningún servicio interno es accesible desde fuera por su ClusterIP; el único punto de entrada externo es el Ingress.

### 5.4 Asignación de Recursos por Pod de Microservicio

| Componente | Lenguaje | Puerto | Mem Request | Mem Limit | Probes |
|------------|----------|--------|-------------|-----------|--------|
| api-gateway | TypeScript | 8080 (HTTP) | 128Mi | 256Mi | tcpSocket |
| users-service | TypeScript | 3001 | 128Mi | 256Mi | tcpSocket |
| movies-service | TypeScript | 3002 | 128Mi | 256Mi | tcpSocket |
| reservations-service | TypeScript | 3003 | 128Mi | 256Mi | tcpSocket |
| payments-service | TypeScript | 3004 | 128Mi | 256Mi | tcpSocket |
| frontend | React/Nginx | 80 (HTTP) | 64Mi | 128Mi | httpGet `/` |

> Los manifiestos definen únicamente límites de **memoria** (no de CPU), una decisión consciente para no estrangular los servicios en un nodo con CPU escasa, dejando que el `scheduler` gestione la contención de CPU de forma compartida.

---

## 6. Pods de Bases de Datos

### 6.1 Patrón de Despliegue

Las cuatro bases de datos **PostgreSQL 15 (`postgres:15-alpine`)** —`db-users`, `db-movies`, `db-reservations`, `db-payments`— siguen un patrón homogéneo:

- **PersistentVolumeClaim de 1Gi en modo `ReadWriteOnce`:** cada base tiene su propio PVC montado en `/var/lib/postgresql/data`, aprovisionado por el Local Path Provisioner de K3s. Esto garantiza la persistencia de los datos entre reinicios del Pod.
- **Inicialización por ConfigMap:** el ConfigMap `*-initsql` se monta en `/docker-entrypoint-initdb.d`, de modo que PostgreSQL ejecuta el esquema y los datos semilla en el primer arranque, sin reconstruir imágenes.
- **Configuración por referencia:** `POSTGRES_DB` y `POSTGRES_USER` provienen de ConfigMaps, y `POSTGRES_PASSWORD` del Secret `filmstars-secrets` vía `secretKeyRef`.
- **Readiness Probe específica de PostgreSQL:** ejecuta `pg_isready -U postgres -d <db>` como comando directo dentro del contenedor (`exec`), con `initialDelaySeconds: 10` y `periodSeconds: 5`, en lugar de un endpoint HTTP.

> **Nota sobre la estrategia:** a diferencia de otros diseños que usan `Recreate` para bases de datos, en FilmStars las cuatro PostgreSQL también utilizan `RollingUpdate` con `maxSurge: 0`/`maxUnavailable: 1`. Como `maxSurge` es 0, Kubernetes igualmente termina el Pod antiguo antes de crear el nuevo, evitando el conflicto de `Multi-Attach` sobre el PVC `ReadWriteOnce`. Es decir, con `maxSurge: 0` el comportamiento efectivo es equivalente al de `Recreate` para el montaje del volumen.

### 6.2 Asignación de Recursos por Pod de Base de Datos

| Base de datos | Imagen | Puerto | PVC | Mem Request | Mem Limit |
|---------------|--------|--------|-----|-------------|-----------|
| db-users | postgres:15-alpine | 5432 | 1Gi | 192Mi | 512Mi |
| db-movies | postgres:15-alpine | 5432 | 1Gi | 192Mi | 512Mi |
| db-reservations | postgres:15-alpine | 5432 | 1Gi | 192Mi | 512Mi |
| db-payments | postgres:15-alpine | 5432 | 1Gi | 192Mi | 512Mi |

---

## 7. RabbitMQ (Broker de Mensajería)

El Pod **`rabbitmq`** ejecuta la imagen `rabbitmq:3-management`, exponiendo el puerto `5672` (AMQP) para la mensajería entre `reservations-service` y `payments-service`, y el `15672` (interfaz de administración). Su usuario `admin` y contraseña se obtienen del ConfigMap común y del Secret respectivamente; un paso del pipeline ejecuta `rabbitmqctl` para reconciliar esas credenciales tras el despliegue. Su Readiness Probe ejecuta `rabbitmq-diagnostics ping`. A diferencia de las bases de datos, **RabbitMQ no tiene PVC** en el clúster: su rol como broker de tránsito hace innecesaria la persistencia a disco en este entorno. Recursos: Request `128Mi` / Limit `384Mi` de memoria.

---

## 8. Orden de Despliegue Aplicado por el Pipeline

El job `deploy-k3s-release` aplica los recursos en un orden que respeta las dependencias de arranque:

1. **Namespace** `filmstars`.
2. **Secret** `filmstars-secrets` (idempotente desde GitHub Secrets).
3. **ConfigMaps** de inicialización SQL y de RabbitMQ.
4. **ConfigMaps** generales (`configmaps.yaml`).
5. **Escala a 0** los Deployments existentes y borra sus pods (liberar CPU del nodo).
6. **Bases de datos** (`databases.yaml`) + espera de `rollout status`.
7. **RabbitMQ** (`rabbitmq.yaml`) + reconciliación de credenciales con `rabbitmqctl`.
8. **Aplicaciones** (`apps.yaml`, con `envsubst` de `ZOT_HOST`/`TAG`) e **Ingress** (`ingress.yaml`, con `envsubst` de `K3S_IP`).
9. **Verificación de rollout** con **rollback automático** ante fallos.
10. **Reporte de estado** del clúster (`if: always()`).

Este orden garantiza que la capa de datos y el broker estén disponibles antes de que los servicios de aplicación intenten conectarse, previniendo fallos de arranque.
