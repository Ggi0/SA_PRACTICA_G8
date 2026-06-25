# Estrategia Operativa de Despliegue y Recuperación ante Fallos — FilmStars

## 1. Estrategia de Despliegue RollingUpdate

La plataforma FilmStars utiliza **K3s (Kubernetes)** como orquestador de contenedores en el entorno *release* y adopta la estrategia de despliegue **RollingUpdate** para realizar actualizaciones controladas. Esta estrategia sustituye gradualmente una versión existente por una nueva sin eliminar el Deployment ni recrear la infraestructura asociada.

Todos los Deployments de la solución —servicios de aplicación, bases de datos y RabbitMQ— utilizan la siguiente configuración (definida en `k3s/apps.yaml`, `k3s/databases.yaml` y `k3s/rabbitmq.yaml`):

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 0
    maxUnavailable: 1
```

Se aplica en:

* frontend
* api-gateway
* users-service
* movies-service
* reservations-service
* payments-service
* db-users, db-movies, db-reservations, db-payments
* rabbitmq

La estrategia RollingUpdate se controla mediante dos parámetros fundamentales.

### maxSurge

El parámetro `maxSurge` define la cantidad máxima de Pods adicionales que Kubernetes puede crear temporalmente durante una actualización.

```text
Pods máximos durante despliegue = Réplicas configuradas + maxSurge
```

En FilmStars, con `replicas: 1` y `maxSurge: 0`:

```text
Pods máximos = 1 + 0 = 1
```

Esto significa que Kubernetes **nunca crea una instancia adicional** durante la actualización. La razón principal es la **optimización de recursos**: el entorno release corre sobre un nodo único de AWS con CPU y memoria limitadas, y se busca minimizar el consumo simultáneo durante los procesos de actualización. Al evitar Pods adicionales, la utilización de recursos permanece constante con independencia de la versión desplegada.

### maxUnavailable

El parámetro `maxUnavailable` define la cantidad máxima de Pods que pueden estar indisponibles simultáneamente durante la actualización.

```text
Pods disponibles mínimos = Réplicas configuradas - maxUnavailable
```

Para FilmStars, con `maxUnavailable: 1`:

```text
Pods disponibles mínimos = 1 - 1 = 0
```

Esto autoriza a Kubernetes a retirar completamente el Pod existente antes de iniciar la nueva versión. El flujo resultante es:

1. Kubernetes detiene el Pod de la versión anterior.
2. Libera los recursos asociados (incluido el montaje del PVC en las bases de datos).
3. Crea el nuevo Pod con la nueva imagen del registro Zot (`${ZOT_HOST}/filmstars/<servicio>:release-N`).
4. Espera que la aplicación arranque.
5. Verifica las sondas de salud (Readiness Probe).
6. Marca el Pod como disponible.

Esta estrategia minimiza el consumo de infraestructura porque **nunca existen dos instancias del mismo servicio ejecutándose simultáneamente**.

### Justificación Arquitectónica

Desde una perspectiva teórica, un despliegue completamente **Zero-Downtime** requiere al menos dos réplicas activas o valores positivos de `maxSurge`, de modo que la nueva versión entre en funcionamiento antes de retirar la anterior.

Sin embargo, FilmStars fue diseñado para ejecutarse dentro de las limitaciones de un nodo único de laboratorio en AWS. Mantener réplicas adicionales o picos de `maxSurge` habría incrementado el consumo de CPU, memoria y direcciones IP internas. Por esta razón se adoptó una estrategia **conservadora orientada a la eficiencia**. Aunque puede existir una breve ventana de indisponibilidad durante la sustitución de Pods, esa ventana se acota mediante las sondas de salud y el rollback automático del pipeline.

Un beneficio adicional de `maxSurge: 0` aparece en las **bases de datos**: como su PVC es `ReadWriteOnce` (solo montable por un Pod a la vez), garantizar que el Pod antiguo termine antes de crear el nuevo evita el error de `Multi-Attach`. Con `maxSurge: 0`, el comportamiento efectivo de RollingUpdate equivale al de `Recreate` para el montaje del volumen.

---

## 2. Rollback Automatizado

La estrategia de despliegue se complementa con un mecanismo de **recuperación automática ante fallos**, cuyo objetivo es evitar que una versión defectuosa permanezca activa cuando no logra iniciar correctamente.

Durante cada despliegue, el job `deploy-k3s-release` aplica los manifiestos con `kubectl apply` y luego **vigila el rollout de cada servicio de aplicación**:

```bash
set -e
for d in users-service movies-service reservations-service payments-service api-gateway frontend; do
  if ! kubectl -n $NS rollout status deployment/$d --timeout=180s; then
    echo "::error::deployment/$d failed, rolling back"
    kubectl -n $NS rollout undo deployment/$d || true
    kubectl -n $NS rollout status deployment/$d --timeout=120s || true
    exit 1
  fi
done
```

La nueva versión debe superar satisfactoriamente:

* Inicialización del contenedor.
* Carga de configuración (ConfigMaps y Secret).
* Conexión a su base de datos y, en su caso, a RabbitMQ.
* Verificación de las sondas de salud (Readiness Probe en el puerto del servicio).

Si alguna de estas etapas falla —casos comunes como `CrashLoopBackOff`, `OOMKilled`, error de conexión a base de datos, error de configuración o timeout de la Readiness Probe—, el Deployment no alcanza el estado `Ready` dentro del `--timeout=180s`. El pipeline detecta el error y activa de inmediato el flujo de recuperación:

```bash
kubectl rollout undo deployment/<servicio>
```

Esto restaura la **última versión estable previa** registrada en el historial de revisiones del Deployment, sin intervención manual del equipo operativo, y el job termina con `exit 1` para reflejar el fallo del despliegue.

Tras la verificación, un paso final con `if: always()` recolecta diagnóstico completo:

```bash
kubectl -n $NS get pods,svc,ingress
kubectl -n $NS describe pods | sed -n '/Events:/,$p' | tail -120
kubectl -n $NS logs deployment/reservations-service --tail=80
kubectl -n $NS logs deployment/payments-service --tail=80
```

Este mecanismo asegura que, ante un fallo en la nueva versión, el sistema regrese de inmediato a un estado confiable y operativo, dejando además trazas para el análisis posterior.

---
