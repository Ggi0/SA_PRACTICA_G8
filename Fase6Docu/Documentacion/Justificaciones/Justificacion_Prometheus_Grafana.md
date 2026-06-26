# Documentación: Prometheus y Grafana — FilmStars

**Práctica 6 — Software Avanzado, USAC**  
**Grupo 8**

---

## Índice

1. [¿Qué es Prometheus?](#1-qué-es-prometheus)
2. [¿Qué es Grafana?](#2-qué-es-grafana)
3. [Modelo de monitoreo: series temporales y scraping activo](#3-modelo-de-monitoreo-series-temporales-y-scraping-activo)
4. [Arquitectura de observabilidad en FilmStars](#4-arquitectura-de-observabilidad-en-filmstars)
5. [Configuración paso a paso](#5-configuración-paso-a-paso)
   - [Paso 1: Infraestructura AWS con Terraform](#paso-1-infraestructura-aws-con-terraform)
   - [Paso 2: Instrumentación de la app (API Gateway)](#paso-2-instrumentación-de-la-app-api-gateway)
   - [Paso 3: Despliegue de Prometheus y Grafana con Ansible + Helm](#paso-3-despliegue-de-prometheus-y-grafana-con-ansible--helm)
   - [Paso 4: Exporters en servidores externos (node_exporter)](#paso-4-exporters-en-servidores-externos-node_exporter)
   - [Paso 5: Importación del dashboard personalizado](#paso-5-importación-del-dashboard-personalizado)
6. [Dashboards de Grafana](#6-dashboards-de-grafana)
7. [Capturas de pantalla del sistema en vivo](#7-capturas-de-pantalla-del-sistema-en-vivo)

---

## 1. ¿Qué es Prometheus?

**Prometheus** es un sistema de monitoreo y base de datos de series temporales (TSDB — *Time Series Database*) de código abierto, desarrollado originalmente por SoundCloud y actualmente mantenido por la Cloud Native Computing Foundation (CNCF).

### Características principales

| Característica | Descripción |
|---|---|
| **Modelo de datos** | Series temporales: cada métrica tiene un nombre + etiquetas (labels) + valor numérico + timestamp |
| **Recolección** | Activa (scraping): Prometheus va a buscar los datos, no los recibe |
| **Almacenamiento** | Base de datos propia optimizada para datos numéricos con marca de tiempo |
| **Lenguaje de consulta** | PromQL (Prometheus Query Language) |
| **Retención** | Configurable; en FilmStars: 7 días |
| **Alertas** | Soporte para reglas de alerta (AlertManager, no usado en esta práctica) |

### Tipos de métricas que maneja

```
Counter   → valor que solo sube (ej: total de requests, total de boletos)
Gauge     → valor que sube y baja (ej: temperatura, RAM usada)
Histogram → distribución de valores (ej: duración de requests por rangos)
Summary   → similar a histogram pero calcula percentiles en el cliente
```

---

## 2. ¿Qué es Grafana?

**Grafana** es una plataforma de visualización y análisis de datos de código abierto. **No almacena datos propios**: se conecta a fuentes de datos externas (como Prometheus) y construye dashboards interactivos sobre ellas.

### Características principales

| Característica | Descripción |
|---|---|
| **Rol** | Visualización exclusivamente — no recolecta ni almacena métricas |
| **Datasources** | Se conecta a Prometheus, InfluxDB, MySQL, Elasticsearch, entre otros |
| **Dashboards** | Paneles configurables con gráficas, estadísticas, tablas y alertas visuales |
| **Aprovisionamiento** | Permite importar dashboards como JSON o vía ConfigMaps de Kubernetes |
| **Acceso en FilmStars** | `http://<k3s_public_ip>:30030` |

### Relación Prometheus ↔ Grafana

```
Prometheus = quien recolecta y guarda los datos
Grafana    = quien los visualiza en dashboards

Sin Prometheus, Grafana no tiene qué mostrar.
Sin Grafana, Prometheus solo expone datos en texto plano.
```

---

## 3. Modelo de monitoreo: series temporales y scraping activo

### 3.1 Series temporales

Una **serie temporal** es una secuencia de valores numéricos asociados a una marca de tiempo. Prometheus organiza cada métrica como:

```
<nombre_métrica>{label1="valor1", label2="valor2"} <valor> <timestamp>
```

**Ejemplo real del sistema FilmStars:**

```
filmstars_http_requests_total{method="GET", route="/api/movies", status="200"} 47 1750906800
filmstars_http_requests_total{method="POST", route="/api/auth", status="201"} 12 1750906800
filmstars_tickets_validated_total 3 1750906800
```

Cada vez que Prometheus scrapeó el sistema, almacenó una nueva fila con el valor actual y el timestamp. Con el tiempo se construye una secuencia:

```
Timestamp    filmstars_tickets_validated_total
─────────────────────────────────────────────
00:30:00     1
00:50:00     2
01:05:00     3
01:20:00     3   ← no hubo más validaciones
```

Esta secuencia es una **serie temporal** que Grafana puede graficar.

### 3.2 Scraping activo (modelo pull)

A diferencia de otros sistemas donde las aplicaciones *envían* métricas (modelo push), **Prometheus las va a buscar** (modelo pull). Esto se llama **scraping**.

```
┌──────────────────────────────────────────────────────────────────┐
│                    CICLO DE SCRAPING                             │
│                                                                  │
│  cada ~15 segundos:                                              │
│                                                                  │
│  Prometheus ──── GET /metrics ────► API Gateway :8080            │
│                                                                  │
│  API Gateway responde con texto plano:                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ # HELP filmstars_http_requests_total Total requests HTTP   │  │
│  │ # TYPE filmstars_http_requests_total counter               │  │
│  │ filmstars_http_requests_total{method="GET",...} 47         │  │
│  │ filmstars_tickets_validated_total 3                        │  │
│  │ process_cpu_seconds_total 0.38                             │  │
│  │ nodejs_heap_used_bytes 45231104                            │  │
│  │ ...                                                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Prometheus guarda cada valor con su timestamp en TSDB           │
└──────────────────────────────────────────────────────────────────┘
```

### Ventajas del modelo pull

| Ventaja | Explicación |
|---|---|
| **Descubrimiento centralizado** | Prometheus sabe qué scrapeó y cuándo. Si un servicio cae, lo detecta |
| **Control de carga** | Prometheus decide el intervalo; la app no necesita enviar datos constantemente |
| **Simplicidad en la app** | La app solo necesita exponer un endpoint HTTP `/metrics` |
| **Diagnóstico fácil** | Se puede verificar el estado de los targets desde la UI de Prometheus |

### 3.3 Aprovisionamiento de métricas en dashboards (Grafana)

Una vez que Prometheus tiene los datos almacenados, Grafana los consulta usando **PromQL** para construir visualizaciones:

```
Grafana (panel)  ──── query PromQL ────►  Prometheus
                 ◄─── resultado JSON ────  Prometheus
                 
Grafana dibuja el gráfico con los datos recibidos
```

El aprovisionamiento puede ser:

- **Manual**: el administrador diseña paneles en la UI de Grafana
- **Automático vía JSON**: se importa un archivo `.json` con la definición completa del dashboard
- **Automático vía Kubernetes ConfigMap**: Grafana detecta ConfigMaps con el label `grafana_dashboard=1` y los carga sin intervención manual (método usado en FilmStars)

---

## 4. Arquitectura de observabilidad en FilmStars

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    ARQUITECTURA DE OBSERVABILIDAD                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │              EC2: develop  (Docker Compose)                     │  ║
║  │                                                                 │  ║
║  │  API Gateway (NestJS :8080)                                     │  ║
║  │  ├─ metrics.ts → genera métricas con prom-client               │  ║
║  │  └─ GET /metrics → expone texto Prometheus                     │  ║
║  │                                                                 │  ║
║  │  node_exporter :9100 → métricas del SO (CPU, RAM, disco, red)  │  ║
║  └───────────────────┬─────────────────────────────────────────────┘  ║
║                      │ scrape                                         ║
║  ┌─────────────────┐ │                                                ║
║  │  EC2: registry  │ │ scrape                                         ║
║  │  node_exporter  │─┤                                                ║
║  │  :9100          │ │                                                ║
║  └─────────────────┘ │                                                ║
║                      │                                                ║
║  ┌───────────────────▼─────────────────────────────────────────────┐  ║
║  │              EC2: k3s  (Kubernetes K3s)                         │  ║
║  │                                                                 │  ║
║  │  namespace: monitoring                                          │  ║
║  │  ┌─────────────────────┐  ┌──────────────────────────────────┐ │  ║
║  │  │  Prometheus          │  │  Grafana                         │ │  ║
║  │  │  NodePort: 30090    │  │  NodePort: 30030                 │ │  ║
║  │  │                     │  │                                  │ │  ║
║  │  │  Scrape targets:    │  │  Datasource: Prometheus          │ │  ║
║  │  │  - api-gateway:8080 │◄─│  Dashboard: FilmStars + K8s      │ │  ║
║  │  │  - develop:9100     │  │                                  │ │  ║
║  │  │  - registry:9100    │  └──────────────────────────────────┘ │  ║
║  │  │  - k3s:9100         │                                       │  ║
║  │  └─────────────────────┘                                       │  ║
║  │                                                                 │  ║
║  │  namespace: filmstars                                           │  ║
║  │  (api-gateway, movies, users, reservas, payments pods)          │  ║
║  │  → cAdvisor (built-in K3s) → métricas de pods                  │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Componentes y su función

| Componente | Dónde corre | Función |
|---|---|---|
| **prom-client** (Node.js) | API Gateway | Genera y expone métricas de la app en `/metrics` |
| **node_exporter** | Las 3 EC2 | Expone métricas del SO: CPU, RAM, disco, red |
| **cAdvisor** | K3s (built-in) | Expone métricas de contenedores/pods |
| **Prometheus** | EC2 k3s (pod K8s) | Scrapeó y almacena todas las métricas |
| **Grafana** | EC2 k3s (pod K8s) | Visualiza las métricas en dashboards |
| **kube-state-metrics** | EC2 k3s (pod K8s) | Expone el estado de recursos de Kubernetes |

---

## 5. Configuración paso a paso

### Paso 1: Infraestructura AWS con Terraform

Terraform crea las 3 máquinas EC2 y abre los puertos necesarios para observabilidad:

**Archivo:** `infra/terraform/security.tf`

```hcl
# Puerto para Grafana (acceso desde el navegador)
ingress {
  description = "Grafana publico"
  from_port   = 30030
  to_port     = 30030
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}

# Puerto para Prometheus
ingress {
  description = "Prometheus publico"
  from_port   = 30090
  to_port     = 30090
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}

# Tráfico interno de la VPC (node_exporter :9100 entre EC2)
ingress {
  description = "Trafico interno de la VPC"
  from_port   = 0
  to_port     = 0
  protocol    = "-1"
  cidr_blocks = [var.vpc_cidr]  # 10.0.0.0/16
}
```

**Comandos para crear la infraestructura:**

```bash
cd infra/terraform

# 1. Inicializar providers y backend S3
terraform init

# 2. Previsualizar los cambios
terraform plan

# 3. Crear las EC2, VPC, Security Groups y Elastic IPs
terraform apply

# 4. Obtener las IPs generadas (se necesitan para Ansible)
terraform output
```

**Output de ejemplo:**
```
k3s_public_ip      = "3.22.115.47"
registry_public_ip = "18.191.200.13"
develop_public_ip  = "3.15.88.201"

ansible_inventory = <<EOT
  [registry]
  18.191.200.13 private_ip=10.0.1.10

  [develop]
  3.15.88.201 private_ip=10.0.1.11

  [k3s]
  3.22.115.47 private_ip=10.0.1.12
EOT
```

---

### Paso 2: Instrumentación de la app (API Gateway)

La aplicación expone métricas usando la librería `prom-client` para Node.js.

**Archivo:** `Fase3/FilmStars/api-gateway/src/metrics.ts`

```typescript
import client from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

// Registro propio + métricas por defecto del proceso Node.js
// (CPU, memoria, event loop, garbage collector)
export const register = new client.Registry();
client.collectDefaultMetrics({ register });

// ── MÉTRICA TÉCNICA ──────────────────────────────────────────
// Cuenta cada request HTTP que pasa por el API Gateway
export const httpRequests = new client.Counter({
  name: 'filmstars_http_requests_total',
  help: 'Total de requests HTTP procesadas por el API Gateway',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// ── MÉTRICA DE NEGOCIO ───────────────────────────────────────
// Cuenta cada boleto validado correctamente
export const ticketsValidated = new client.Counter({
  name: 'filmstars_tickets_validated_total',
  help: 'Total de boletos validados correctamente',
  registers: [register],
});

// Rutas que Prometheus considera "validación de boleto"
const VALIDATION_RE = /\/(scan|forzar|validar|validate|escanear|check-?in)/i;

// Middleware: se ejecuta al finalizar CADA request
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    // Incrementa el counter con los datos del request
    httpRequests.inc({
      method: req.method,
      route: req.baseUrl || req.path || 'unknown',
      status: String(res.statusCode),
    });
    
    // Si fue una validación exitosa, incrementa el counter de boletos
    if (res.statusCode >= 200 && res.statusCode < 300
        && VALIDATION_RE.test(req.originalUrl)) {
      ticketsValidated.inc();
    }
  });
  next();
}

// Handler del endpoint /metrics: serializa todas las métricas
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
```

**Archivo:** `Fase3/FilmStars/api-gateway/src/main.ts`

```typescript
import { metricsMiddleware, metricsHandler } from './metrics';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Observabilidad: Prometheus scrapeará http://api-gateway:8080/metrics
  app.use(metricsMiddleware);       // ← intercepta todos los requests
  app.use('/metrics', metricsHandler); // ← expone el endpoint de métricas
  
  // ... resto de rutas de la app
}
```

**Verificación manual del endpoint:**
```bash
curl http://<develop_public_ip>:8080/metrics
```

Respuesta esperada (texto plano):
```
# HELP filmstars_http_requests_total Total de requests HTTP procesadas por el API Gateway
# TYPE filmstars_http_requests_total counter
filmstars_http_requests_total{method="GET",route="/api/movies",status="200"} 47
filmstars_http_requests_total{method="POST",route="/api/auth/login",status="201"} 8

# HELP filmstars_tickets_validated_total Total de boletos validados correctamente
# TYPE filmstars_tickets_validated_total counter
filmstars_tickets_validated_total 3

# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total 0.38

# HELP nodejs_heap_used_bytes Process heap space used from Node.js in bytes.
nodejs_heap_used_bytes 45231104
```

---

### Paso 3: Despliegue de Prometheus y Grafana con Ansible + Helm

**Archivo:** `infra/ansible/playbooks/monitoring.yml`

El playbook automatiza la instalación del stack completo de monitoreo en la EC2 k3s:

```bash
# Copiar el inventory generado por terraform output
cp inventory.ini infra/ansible/inventory.ini

# Ejecutar el playbook de monitoreo
cd infra/ansible
ansible-playbook -i inventory.ini playbooks/monitoring.yml
```

**¿Qué hace el playbook internamente?**

```
1. Instala Helm (gestor de paquetes de Kubernetes)
   └─ curl get-helm-3.sh

2. Agrega el repositorio prometheus-community
   └─ helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

3. Genera el archivo values-monitoring.yaml con:
   ├─ Grafana: NodePort 30030, password configurado
   ├─ Prometheus: NodePort 30090, retención 7 días
   ├─ Scrape de node_exporter en las 3 EC2 (IPs privadas de Terraform)
   └─ Scrape del api-gateway en api-gateway.filmstars.svc.cluster.local:8080

4. Instala kube-prometheus-stack
   └─ helm upgrade --install kps prometheus-community/kube-prometheus-stack
      --namespace monitoring -f values-monitoring.yaml

5. Importa el dashboard FilmStars como ConfigMap de Kubernetes
   └─ kubectl create configmap filmstars-grafana-dashboard
      --from-file=filmstars.json=grafana-filmstars-dashboard.json
      con label grafana_dashboard=1 (Grafana lo detecta automáticamente)

6. Espera a que todos los pods de monitoring estén Ready
```

**Configuración de scraping** (generada automáticamente en el playbook):

```yaml
prometheus:
  prometheusSpec:
    additionalScrapeConfigs:
      # Métricas de hardware de las 3 EC2
      - job_name: "ec2-node-exporter"
        static_configs:
          - targets:
              - "10.0.1.10:9100"   # registry (IP privada)
              - "10.0.1.11:9100"   # develop  (IP privada)
              - "10.0.1.12:9100"   # k3s      (IP privada)
            labels: { group: "aws-ec2" }

      # Métricas de la aplicación FilmStars
      - job_name: "filmstars-api"
        metrics_path: /metrics
        static_configs:
          - targets: ["api-gateway.filmstars.svc.cluster.local:8080"]
            labels: { group: "filmstars-app" }
```

---

### Paso 4: Exporters en servidores externos (node_exporter)

El **node_exporter** es un proceso que corre en cada servidor (EC2) y expone métricas del sistema operativo en el puerto `9100`. Lo instala automáticamente el playbook de Ansible.

**¿Qué métricas expone node_exporter?**

| Métrica | Qué mide |
|---|---|
| `node_cpu_seconds_total` | Tiempo de CPU por modo (idle, user, system, iowait) |
| `node_memory_MemAvailable_bytes` | RAM disponible |
| `node_filesystem_avail_bytes` | Espacio disponible en disco |
| `node_network_receive_bytes_total` | Bytes recibidos por interfaz de red |
| `node_load1` | Carga del sistema (promedio 1 minuto) |

**Verificación en cada EC2:**
```bash
curl http://<ip_privada_ec2>:9100/metrics | head -20
```

**¿Por qué se usan IPs privadas y no públicas para node_exporter?**

El puerto `9100` solo está abierto dentro de la VPC (`10.0.0.0/16`). Prometheus, que corre en la misma VPC, puede acceder por red interna. Esto es una práctica de seguridad: las métricas de hardware no se exponen a internet.

---

### Paso 5: Importación del dashboard personalizado

El dashboard de FilmStars (`grafana-filmstars-dashboard.json`) se importa de dos formas:

#### Automática (vía Ansible — método usado en FilmStars)

El playbook crea un ConfigMap en Kubernetes con el label `grafana_dashboard=1`. El sidecar de Grafana escanea los ConfigMaps con ese label y los carga automáticamente:

```bash
kubectl -n monitoring create configmap filmstars-grafana-dashboard \
  --from-file=filmstars.json=grafana-filmstars-dashboard.json \
  --dry-run=client -o yaml | \
kubectl label --local -f - grafana_dashboard=1 -o yaml | \
kubectl apply -f -
```

#### Manual (desde la UI de Grafana)

1. Abrir `http://<k3s_public_ip>:30030`
2. Ingresar con `admin / grafana123`
3. Ir a **Dashboards → Import**
4. Subir el archivo `grafana-filmstars-dashboard.json`
5. Seleccionar el datasource **Prometheus**
6. Hacer clic en **Import**

---

## 6. Dashboards de Grafana

### Dashboard propio: FilmStars — Observabilidad Práctica 6

Este dashboard fue construido por el equipo y está definido en `infra/observability/grafana-filmstars-dashboard.json`.

#### Panel 1 — CPU por pod (namespace filmstars)

Muestra el consumo de CPU de cada microservicio corriendo en Kubernetes.

```promql
sum by (pod) (
  rate(container_cpu_usage_seconds_total{namespace="filmstars",container!=""}[5m])
)
```

- **Tipo:** timeseries
- **Fuente:** cAdvisor (integrado en K3s)
- **Unidad:** cores de CPU

#### Panel 2 — Memoria por pod (namespace filmstars)

Muestra el consumo de RAM activa de cada microservicio.

```promql
sum by (pod) (
  container_memory_working_set_bytes{namespace="filmstars",container!=""}
)
```

- **Tipo:** timeseries
- **Fuente:** cAdvisor
- **Unidad:** bytes (Grafana convierte a MB/GB)

#### Panel 3 — Targets UP/DOWN

Indicador de salud de todos los servicios monitoreados.

```promql
up{job=~"ec2-node-exporter|filmstars-api"}
```

- **Tipo:** stat (con colores: verde = UP, rojo = DOWN)
- **Fuente:** Prometheus (`up` es una métrica interna)
- Muestra un indicador por cada target configurado

#### Panel 4 — Boletos validados por minuto *(métrica de negocio)*

Muestra la velocidad de validación de boletos en tiempo real.

```promql
sum(rate(filmstars_tickets_validated_total[1m])) * 60
```

- **Tipo:** timeseries
- **Fuente:** `metrics.ts` del API Gateway
- **Interpretación:** velocidad instantánea de validaciones, no total acumulado
- Un pico indica que se están validando boletos en ese momento

#### Panel 5 — Requests del API Gateway *(métrica técnica)*

Muestra el tráfico total del API Gateway desglosado por código HTTP.

```promql
sum by (status) (rate(filmstars_http_requests_total[1m]))
```

- **Tipo:** timeseries
- **Fuente:** `metrics.ts` del API Gateway
- Cada línea = un código de respuesta (200, 201, 401, 500, etc.)
- Permite detectar errores en tiempo real

#### Panel 6 — CPU de las EC2 (node_exporter)

Muestra el % de CPU utilizado en cada una de las 3 máquinas virtuales de AWS.

```promql
100 - (avg by (instance) (
  rate(node_cpu_seconds_total{mode="idle",group="aws-ec2"}[5m])
) * 100)
```

- **Tipo:** timeseries (ancho completo)
- **Fuente:** node_exporter en cada EC2
- **Unidad:** porcentaje (0–100%)
- Una línea por cada EC2 (registry, develop, k3s)

---

### Dashboards automáticos (provistos por kube-prometheus-stack)

Estos dashboards se instalan automáticamente con el chart de Helm y monitorizan la infraestructura de Kubernetes:

| Dashboard | Qué monitorea |
|---|---|
| **Kubernetes / API server** | Estado del servidor de K3s: latencias y errores de la API |
| **Kubernetes / Compute Resources / Cluster** | CPU y RAM total del clúster |
| **Kubernetes / Compute Resources / Namespace (Pods)** | Recursos por pod dentro de un namespace |
| **Kubernetes / Compute Resources / Pod** | Detalle de un pod específico |
| **Kubernetes / Compute Resources / Workload** | Recursos por Deployment o StatefulSet |
| **Kubernetes / Controller Manager** | Estado del controlador de K8s |
| **CoreDNS** | DNS interno de Kubernetes |
| **etcd** | Base de datos interna de K8s |
| **Grafana Overview** | Métricas del propio Grafana |

---

## 7. Capturas de pantalla del sistema en vivo

### 7.1 Dashboard FilmStars — Vista general

![Dashboard FilmStars — Vista general](imgs/Panel%20Completo.jpeg)

---

### 7.2 Panel: Boletos validados por minuto

![Panel: Boletos validados por minuto](imgs/Boletos%20Validados%20por%20minuto.jpeg)

---

### 7.3 Panel: Requests del API Gateway

![Panel: Requests del API Gateway](imgs/Request%20del%20API%20Gateway%20(rate%201m).jpeg)

---

### 7.4 Panel: CPU y Memoria por pod

![Panel: CPU y Memoria por pod](imgs/CPU%20por%20servicio%20-%20millicores%20(ns%20filmstarts).jpeg)

---

### 7.5 Panel: Targets UP/DOWN

![Panel: Targets UP/DOWN](imgs/Targets%20Prometheus%20.jpeg)

---

### 7.6 Panel: CPU de las EC2

![Panel: CPU de las EC2](imgs/CPU%20de%20las%20EC2(node_exporter).jpeg)
