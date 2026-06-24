# Grafana — Guía de conexión y uso

Grafana corre como pod dentro del clúster K3s de AWS. No requiere instalación local.

---

## 1. Requisitos previos

- El pipeline de release ya se ejecutó exitosamente (el job despliega `monitoring.yaml` automáticamente).
- Tienes la IP pública del servidor K3s (`K3S_IP`). La encuentras en los outputs de Terraform o en los secrets de GitHub.

---

## 2. Acceder a Grafana

Abre en tu navegador:

```
http://<K3S_IP>:30300
```

> Ejemplo: si K3S_IP es `54.123.45.67` → `http://54.123.45.67:30300`

**Credenciales por defecto:**
| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | El valor del secret `GRAFANA_ADMIN_PASSWORD` en GitHub. Si no está configurado, el default es `filmstars2026` |

---

## 3. Ver el dashboard de FilmStars

1. En el menú lateral izquierdo, click en **Dashboards** (ícono de cuadritos).
2. Busca o selecciona **"FilmStars — Cluster Health"**.
3. El dashboard se auto-refresca cada 30 segundos.

### Qué muestra el dashboard

| Panel | Métrica | Fuente |
|-------|---------|--------|
| Pod CPU Usage | Consumo de CPU por pod del namespace `filmstars` | cAdvisor (K3s) |
| Pod Memory Usage | RAM usada por pod (en bytes) | cAdvisor (K3s) |
| Container Restarts | Número de reinicios por contenedor | kube-state-metrics |
| Running Pods | Cantidad de pods en estado Running | kube-state-metrics |
| Node CPU Usage | % de CPU del nodo EC2 | node-exporter |
| Ingress Request Rate | Requests/segundo por código HTTP | Traefik |
| Node Memory Available | RAM libre en el nodo | node-exporter |

---

## 4. Componentes del stack de monitoreo

El archivo `monitoring.yaml` despliega los siguientes pods en el namespace `monitoring`:

| Pod | Función |
|-----|---------|
| `prometheus` | Recolecta y almacena métricas (puerto interno 9090) |
| `kube-state-metrics` | Expone métricas de objetos Kubernetes (pods, deployments, etc.) |
| `node-exporter` | Expone métricas del nodo EC2 (CPU, RAM, disco, red) |
| `grafana` | Visualización — accesible en NodePort 30300 |

Verificar que todos estén corriendo:

```bash
kubectl -n monitoring get pods
```

Salida esperada (todos en `Running`):

```
NAME                                  READY   STATUS    RESTARTS
grafana-xxxx                          1/1     Running   0
kube-state-metrics-xxxx               1/1     Running   0
node-exporter-xxxx                    1/1     Running   0
prometheus-xxxx                       1/1     Running   0
```

---

## 5. Ver métricas en Prometheus directamente (opcional)

El puerto de Prometheus **no está expuesto** a internet directamente (solo ClusterIP interno). Para acceder:

```bash
kubectl -n monitoring port-forward svc/prometheus 9090:9090
```

Luego en el navegador: `http://localhost:9090`

Desde ahí puedes ir a **Status → Targets** para ver si Prometheus está scrapeando todos los endpoints correctamente.

---

## 6. Crear un dashboard personalizado

1. En Grafana, click **Dashboards → New → New Dashboard**.
2. Click **Add visualization**.
3. Selecciona la fuente de datos **Prometheus** (ya está configurada).
4. Escribe una query PromQL, por ejemplo:

```promql
# Memoria usada por el pod de payments-service
container_memory_working_set_bytes{namespace="filmstars", pod=~"payments-service.*"}
```

```promql
# CPU del pod de reservations-service (últimos 2 min)
rate(container_cpu_usage_seconds_total{namespace="filmstars", pod=~"reservations.*"}[2m])
```

---

## 7. Solución de problemas

### Verificar estado general

```bash
kubectl -n monitoring get pods,svc
```

### Grafana no carga / timeout

```bash
# Ver si el pod está corriendo
kubectl -n monitoring get pods

# Ver logs del pod
kubectl -n monitoring logs deployment/grafana

# Ver si el NodePort está abierto
kubectl -n monitoring get svc grafana
```

Si el pod no arranca, verificar que el secret de la contraseña exista:

```bash
kubectl -n monitoring get secret grafana-secret
```

Si no existe, crearlo manualmente:

```bash
kubectl -n monitoring create secret generic grafana-secret \
  --from-literal=admin_password="filmstars2026"
```

### Paneles "Container Restarts" o "Running Pods" sin datos

Estos paneles dependen de **kube-state-metrics**. Verificar:

```bash
kubectl -n monitoring get pods -l app=kube-state-metrics
kubectl -n monitoring logs deployment/kube-state-metrics
```

### Paneles "Node CPU" o "Node Memory" sin datos

Estos paneles dependen de **node-exporter**. Verificar:

```bash
kubectl -n monitoring get pods -l app=node-exporter
kubectl -n monitoring logs daemonset/node-exporter
```

### Panel "Ingress Request Rate" sin datos

Este panel depende de las métricas de **Traefik**. Si K3s no tiene Traefik configurado con métricas en el puerto 9100, el panel permanecerá vacío — los demás paneles no se ven afectados.

### El dashboard muestra "No data" en todos los paneles

Espera 1-2 minutos después del despliegue para que Prometheus acumule los primeros datos de scraping.

Si persiste, verificar que Prometheus está scrapeando:

```bash
kubectl -n monitoring logs deployment/prometheus | grep -E "error|Error"
```

Y verificar los targets en Prometheus vía port-forward:

```bash
kubectl -n monitoring port-forward svc/prometheus 9090:9090
# Luego abre: http://localhost:9090/targets
```

---

## 8. Agregar la password en GitHub Secrets (recomendado)

Para que el CI/CD inyecte una contraseña segura en lugar del default:

1. Ve a tu repositorio en GitHub → **Settings → Secrets and variables → Actions**.
2. Crea un nuevo secret llamado `GRAFANA_ADMIN_PASSWORD` con la contraseña que quieras.
3. El próximo deploy de la rama `release` la usará automáticamente.
