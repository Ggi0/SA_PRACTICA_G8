# Manifiestos y Configuración de Objetos de K3s — FilmStars

Este documento justifica el uso de los principales objetos de Kubernetes (K3s) en el despliegue *release* de FilmStars, y presenta la **estructura base de cada manifiesto YAML sin credenciales explícitas**. Todos los ejemplos están alineados con los manifiestos reales del repositorio en `Fase3/FilmStars/k3s/` (`apps.yaml`, `databases.yaml`, `configmaps.yaml`, `rabbitmq.yaml`, `ingress.yaml`, `namespace.yaml`).

> **Nota sobre seguridad:** ninguna contraseña, token o cadena de conexión aparece en texto plano en los manifiestos. Los valores sensibles se inyectan en tiempo de despliegue desde **GitHub Secrets** hacia un `Secret` de Kubernetes, y los manifiestos solo contienen **referencias** (`secretKeyRef` / `secretRef`). Las cadenas de conexión se **componen dentro del contenedor** a partir de variables no sensibles (host, puerto, nombre de BD) provenientes de ConfigMaps y de la contraseña proveniente del Secret.

---

## 1. Deployments — Estrategia de Réplicas para Alta Disponibilidad de la Malla

### 1.1 Justificación Teórica

Un **Deployment** es el objeto de Kubernetes que gestiona el ciclo de vida de un conjunto de Pods idénticos mediante un `ReplicaSet` subyacente. Aporta tres garantías clave para una malla de microservicios:

1. **Estado deseado declarativo:** se declara *cuántas* réplicas deben existir y *qué* imagen ejecutan; el controlador reconcilia continuamente la realidad con esa declaración (si un Pod muere, lo recrea).
2. **Actualizaciones controladas:** mediante la `strategy` (`RollingUpdate` o `Recreate`) se define cómo se transita de una versión a otra sin borrar el objeto.
3. **Historial y rollback:** cada cambio genera una revisión, lo que habilita `kubectl rollout undo` para volver a una versión estable previa.

La **alta disponibilidad** ideal de una malla se logra con **múltiples réplicas** distribuidas en varios nodos: si una réplica o un nodo cae, las demás siguen atendiendo tráfico mientras el `Service` balancea entre los Pods sanos (solo los que pasan la *Readiness Probe* reciben tráfico).

### 1.2 Justificación Práctica en FilmStars

FilmStars corre sobre **un nodo único de laboratorio en AWS** con CPU y memoria acotadas. Por ello adopta una postura **deliberadamente conservadora**: `replicas: 1` por servicio y estrategia `RollingUpdate` con `maxSurge: 0` y `maxUnavailable: 1`. Esto prioriza la **eficiencia de recursos** sobre el Zero-Downtime estricto:

- Con `maxSurge: 0`, nunca se crea un Pod adicional durante el despliegue (no se duplica el consumo).
- Con `maxUnavailable: 1`, se retira el Pod viejo antes de levantar el nuevo.
- La continuidad operativa se complementa con **sondas de salud** y **rollback automático** en el pipeline (ver [ZeroDowntime.md](./ZeroDowntime.md)).

> En una infraestructura con varios nodos, la ruta a alta disponibilidad real sería subir `replicas` a ≥2, usar `maxSurge: 1`/`maxUnavailable: 0` y añadir `podAntiAffinity` para repartir las réplicas entre nodos. La malla de FilmStars está estructurada para escalar a ese modelo cambiando solo estos parámetros, sin rediseñar los manifiestos.

### 1.3 Estructura Base del Manifiesto (servicio de aplicación)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: users-service
  namespace: filmstars
spec:
  replicas: 1                      # nº de réplicas (HA real: >= 2 en multinodo)
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 0                  # no crea Pods extra (ahorro de recursos)
      maxUnavailable: 1            # retira el Pod viejo antes de crear el nuevo
  selector:
    matchLabels:
      app: users-service
  template:
    metadata:
      labels:
        app: users-service        # etiqueta que el Service usa como selector
    spec:
      containers:
        - name: users-service
          image: ${ZOT_HOST}/filmstars/users-service:${TAG}   # sustituido por envsubst en el deploy
          envFrom:
            - configMapRef: { name: filmstars-common }   # config compartida
            - configMapRef: { name: users-config }       # config propia del servicio
            - secretRef:    { name: filmstars-secrets }  # credenciales (referencia, no valores)
          ports:
            - containerPort: 3001
          readinessProbe:                                # cuándo recibe tráfico
            tcpSocket: { port: 3001 }
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:                                 # cuándo reiniciar el Pod
            tcpSocket: { port: 3001 }
            initialDelaySeconds: 25
            periodSeconds: 10
          resources:
            requests: { memory: "128Mi" }
            limits:   { memory: "256Mi" }
```

> Las bases de datos (`databases.yaml`) usan la misma estrategia, pero añaden un `PersistentVolumeClaim` y, gracias a `maxSurge: 0`, evitan el conflicto `Multi-Attach` sobre el volumen `ReadWriteOnce` (el Pod viejo se termina antes de montar el nuevo). RabbitMQ sigue el mismo patrón sin volumen persistente.

---

## 2. Services — Descubrimiento de Servicios Internos (ClusterIP vs. NodePort vs. LoadBalancer)

### 2.1 Justificación Teórica

Los Pods son **efímeros**: su IP cambia en cada recreación. Un **Service** resuelve este problema dando una **identidad de red estable** (nombre DNS + IP virtual) a un conjunto de Pods seleccionados por etiquetas, y **balancea** el tráfico entre las réplicas sanas. Kubernetes ofrece tres tipos según el alcance de exposición:

| Tipo | Alcance | Mecanismo | Cuándo usarlo |
|------|---------|-----------|---------------|
| **ClusterIP** (por defecto) | **Solo interno** al clúster | IP virtual estable + DNS interno (`<svc>.<ns>.svc.cluster.local`) resuelto por CoreDNS | Comunicación servicio-a-servicio dentro de la malla. |
| **NodePort** | Externo por IP del nodo | Abre un puerto fijo (30000–32767) en **cada nodo** | Exposición simple sin balanceador; frágil (depende de IPs de nodo y puertos altos). |
| **LoadBalancer** | Externo gestionado | Provisiona un balanceador del proveedor cloud con IP pública | Exposición productiva en cloud; consume un balanceador (coste) por servicio. |

El **descubrimiento de servicios interno** se basa en `ClusterIP` + DNS: un servicio llama a otro por su **nombre** (`http://movies-service:3002`), y CoreDNS lo resuelve a la ClusterIP correspondiente, mientras `kube-proxy` balancea hacia los Pods. Así los servicios son **agnósticos a las IPs**, que el plano de control asigna dinámicamente.

### 2.2 Justificación Práctica en FilmStars

FilmStars usa **`ClusterIP` para absolutamente todos los Services** (los seis de aplicación, las cuatro bases de datos y RabbitMQ). Las razones:

- **Aislamiento:** ningún servicio interno es alcanzable desde fuera por su IP; la única puerta de entrada externa es el **Ingress** (Traefik), lo que reduce la superficie de ataque.
- **Descubrimiento por nombre:** el ConfigMap `filmstars-common` declara las URLs internas como nombres de servicio (`http://users-service:3001`, `http://reservations-service:3003`, etc.), por lo que el api-gateway y los microservicios se localizan por DNS de Kubernetes, no por IP.
- **No se usa `NodePort`** porque expondría puertos altos en el nodo sin balanceo ni TLS, y complicaría la operación.
- **No se usa `LoadBalancer`** porque en un nodo único de laboratorio cada balanceador implicaría coste e infraestructura adicional; el Ingress de Traefik (incluido en K3s) cubre la exposición HTTP de forma centralizada.

> **Resumen del modelo de red:** *Internet → Ingress (Traefik, `nip.io`) → Services `ClusterIP` → Pods*. El Ingress enruta `/api` al Service `api-gateway:8080` y `/` al Service `frontend:80`; el resto de Services solo existe para tráfico interno.

### 2.3 Estructura Base del Manifiesto

**Service `ClusterIP`** (descubrimiento interno — el usado en FilmStars):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: users-service        # nombre DNS interno: users-service.filmstars.svc.cluster.local
  namespace: filmstars
spec:
  type: ClusterIP            # valor por defecto; solo accesible dentro del clúster
  selector:
    app: users-service       # selecciona los Pods con esta etiqueta
  ports:
    - port: 3001             # puerto del Service
      targetPort: 3001       # puerto del contenedor
```

**Service con varios puertos** (caso RabbitMQ — AMQP + panel de administración):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: rabbitmq
  namespace: filmstars
spec:
  selector:
    app: rabbitmq
  ports:
    - name: amqp            # mensajería reservations → payments
      port: 5672
      targetPort: 5672
    - name: management      # consola de administración
      port: 15672
      targetPort: 15672
```

**Comparativa (NO usados en FilmStars, a modo ilustrativo):**

```yaml
# NodePort: abre un puerto fijo en cada nodo (30000-32767)
spec:
  type: NodePort
  selector: { app: users-service }
  ports:
    - port: 3001
      targetPort: 3001
      nodePort: 31001        # accesible en http://<IP-del-nodo>:31001
---
# LoadBalancer: provisiona un balanceador externo del cloud con IP pública
spec:
  type: LoadBalancer
  selector: { app: api-gateway }
  ports:
    - port: 80
      targetPort: 8080
```

---

## 3. ConfigMaps y Secrets — Inyección de Variables de Entorno y Cadenas de Conexión

### 3.1 Justificación Teórica

Una buena arquitectura **separa la configuración del código** (factor III de los *Twelve-Factor App*): la misma imagen debe poder desplegarse en cualquier entorno cambiando solo su configuración externa. Kubernetes provee dos objetos para esto:

- **ConfigMap:** almacena configuración **no sensible** en pares clave-valor (hosts, puertos, nombres de base de datos, URLs internas, *flags*). Se inyecta a los Pods como variables de entorno (`envFrom`/`valueFrom`) o como archivos montados.
- **Secret:** almacena información **sensible** (contraseñas, tokens, llaves). Kubernetes lo guarda en `etcd` y lo entrega a los Pods de la misma forma que un ConfigMap, pero con un manejo más cuidadoso (puede cifrarse en reposo, no se imprime en `kubectl describe`, etc.).

El patrón clave para las **cadenas de conexión** es **no almacenarlas completas**, sino **componerlas en el contenedor**: las piezas no sensibles (host, puerto, nombre de BD) vienen de un ConfigMap y la contraseña de un Secret. Así, la cadena `postgresql://usuario:contraseña@host:puerto/bd` nunca existe escrita en el repositorio; se ensambla en memoria al arrancar el proceso.

### 3.2 Justificación Práctica en FilmStars

FilmStars aplica esta separación de forma estricta:

- **ConfigMaps (`configmaps.yaml`):**
  - `filmstars-common`: configuración compartida — `NODE_ENV`, `DB_USER`, `DB_PORT`, `JWT_EXPIRES_IN`, parámetros de RabbitMQ y las **URLs internas de descubrimiento** de cada servicio.
  - `users-config`, `movies-config`, `reservations-config`, `payments-config`, `gateway-config`: el `PORT`, `DB_HOST`, `DB_NAME` y parámetros propios (p. ej. `RESERVATION_TIMEOUT_MINUTES`).
  - ConfigMaps de inicialización (`*-initsql`, `rabbitmq-definitions`, `rabbitmq-config`): scripts y configuración montados como **archivos** dentro del contenedor.
- **Secret (`filmstars-secrets`):** contiene `DB_PASS`, `JWT_SECRET`, `RABBITMQ_PASS` y `DEFAULT_ADMIN_PASSWORD`. **No existe como archivo en el repositorio**: el pipeline lo crea/actualiza de forma **idempotente** desde GitHub Secrets:

  ```bash
  kubectl -n filmstars create secret generic filmstars-secrets \
    --from-literal=DB_PASS="$DB_PASS" \
    --from-literal=JWT_SECRET="$JWT_SECRET" \
    --from-literal=RABBITMQ_PASS="$RABBITMQ_PASS" \
    --from-literal=DEFAULT_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    --dry-run=client -o yaml | kubectl apply -f -
  ```

**Composición de la cadena de conexión a la base de datos relacional:** cada microservicio recibe `DB_HOST` y `DB_NAME` (ConfigMap), `DB_USER` y `DB_PORT` (ConfigMap común) y `DB_PASS` (Secret), y arma internamente su conexión a PostgreSQL. La base de datos misma recibe su contraseña por `secretKeyRef` en `POSTGRES_PASSWORD`. De este modo, la cadena de conexión cifrada se mantiene fuera de los manifiestos.

> **Sobre Cloud Storage:** en la arquitectura actual, FilmStars **no integra un servicio de almacenamiento de objetos** (los datos persisten en PostgreSQL sobre PVC y RabbitMQ es efímero). Si se incorporara (p. ej. AWS S3 para pósters/comprobantes), el patrón sería idéntico: el *endpoint*/bucket y la región irían en un ConfigMap, y la *access key*/*secret key* en `filmstars-secrets`, inyectadas por `secretKeyRef` — nunca en texto plano en el repositorio. Se incluye un ejemplo ilustrativo más abajo.

### 3.3 Estructura Base de los Manifiestos

**ConfigMap común** (configuración no sensible compartida):

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: filmstars-common
  namespace: filmstars
data:
  NODE_ENV: "production"
  DB_USER: "postgres"
  DB_PORT: "5432"
  JWT_EXPIRES_IN: "7d"
  RABBITMQ_HOST: "rabbitmq"
  RABBITMQ_PORT: "5672"
  RABBITMQ_USER: "admin"
  USERS_SERVICE_URL: "http://users-service:3001"     # descubrimiento por nombre DNS
  MOVIES_SERVICE_URL: "http://movies-service:3002"
  RESERVAS_SERVICE_URL: "http://reservations-service:3003"
  PAYMENTS_SERVICE_URL: "http://payments-service:3004"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: users-config
  namespace: filmstars
data:
  PORT: "3001"
  DB_HOST: "db-users"               # host de la BD = nombre del Service ClusterIP
  DB_NAME: "filmstars_users"
```

**Secret** (estructura — valores marcados como marcadores de posición, **sin credenciales reales**):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: filmstars-secrets
  namespace: filmstars
type: Opaque
stringData:                          # el pipeline lo genera desde GitHub Secrets, NO se versiona
  DB_PASS: "<inyectado-desde-GitHub-Secrets>"
  JWT_SECRET: "<inyectado-desde-GitHub-Secrets>"
  RABBITMQ_PASS: "<inyectado-desde-GitHub-Secrets>"
  DEFAULT_ADMIN_PASSWORD: "<inyectado-desde-GitHub-Secrets>"
```

**Consumo combinado en un servicio** (ConfigMaps + Secret como variables de entorno):

```yaml
# dentro de spec.template.spec.containers[]
envFrom:
  - configMapRef: { name: filmstars-common }   # config compartida
  - configMapRef: { name: users-config }       # config propia
  - secretRef:    { name: filmstars-secrets }  # credenciales por referencia
```

**Consumo de una clave puntual del Secret** (base de datos PostgreSQL — sin exponer la cadena):

```yaml
env:
  - name: POSTGRES_DB
    valueFrom:
      configMapKeyRef: { name: users-config,      key: DB_NAME }
  - name: POSTGRES_USER
    valueFrom:
      configMapKeyRef: { name: filmstars-common,  key: DB_USER }
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef:    { name: filmstars-secrets, key: DB_PASS }   # contraseña por referencia
```

**ConfigMap montado como archivos** (inicialización SQL):

```yaml
# volumen del Pod de base de datos
volumes:
  - name: initsql
    configMap:
      name: users-initsql
# montaje en el contenedor PostgreSQL
volumeMounts:
  - name: initsql
    mountPath: /docker-entrypoint-initdb.d   # PostgreSQL ejecuta estos scripts al inicializar
```

**Ejemplo ilustrativo — Cloud Storage (patrón aplicable, no presente hoy):**

```yaml
# ConfigMap: datos NO sensibles del bucket
apiVersion: v1
kind: ConfigMap
metadata: { name: storage-config, namespace: filmstars }
data:
  S3_BUCKET: "filmstars-assets"
  S3_REGION: "us-east-2"
---
# Las llaves de acceso irían en filmstars-secrets y se inyectarían por secretKeyRef:
env:
  - name: S3_ACCESS_KEY
    valueFrom: { secretKeyRef: { name: filmstars-secrets, key: S3_ACCESS_KEY } }
  - name: S3_SECRET_KEY
    valueFrom: { secretKeyRef: { name: filmstars-secrets, key: S3_SECRET_KEY } }
```

---

## 4. Síntesis

| Objeto | Rol en FilmStars | Decisión de diseño |
|--------|------------------|--------------------|
| **Deployment** | Gestiona los Pods de cada servicio, BD y RabbitMQ | `replicas: 1` + `RollingUpdate (maxSurge: 0, maxUnavailable: 1)`: eficiencia de recursos sobre nodo único; rollback automático y probes como red de seguridad. |
| **Service** | Identidad de red e interconexión interna | **`ClusterIP` en todos**; exposición externa centralizada solo vía Ingress (Traefik). Sin NodePort ni LoadBalancer. |
| **ConfigMap** | Configuración no sensible y URLs de descubrimiento | Común + por-servicio + de inicialización; habilita descubrimiento por nombre DNS. |
| **Secret** | Credenciales y composición de cadenas de conexión | `filmstars-secrets` (Opaque), creado idempotente desde GitHub Secrets; los manifiestos solo guardan referencias (`secretKeyRef`/`secretRef`). |

En conjunto, estos objetos materializan los principios de **configuración externa**, **descubrimiento de servicios por DNS**, **aislamiento de red** y **gestión segura de credenciales**, adaptados a las restricciones reales de la infraestructura de laboratorio de FilmStars.
