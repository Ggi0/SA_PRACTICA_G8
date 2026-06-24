# Documentación — Prometheus + Grafana (observabilidad)

## Qué es y cómo funciona

Modelo de monitoreo basado en **series temporales** por recolección activa
(*scraping*): Prometheus consulta periódicamente los `/metrics` de cada *target*
y los almacena. **Grafana** consulta a Prometheus (datasource) y dibuja
*dashboards*. Todo corre **dentro del clúster K3s** (namespace `monitoring`),
desplegado con el chart `kube-prometheus-stack`.

## Orígenes de métricas (los 3 que pide el PDF)

| Origen | Cómo se obtiene |
|--------|-----------------|
| Clúster K3s | kubelet/cAdvisor + kube-state-metrics (automático del chart) |
| Instancias AWS (EC2) | `node_exporter` en cada EC2 → job `ec2-node-exporter` |
| Métricas internas de la app | `api-gateway` expone `/metrics` con `prom-client` → job `filmstars-api` |

## Métrica de negocio

`filmstars_tickets_validated_total` — boletos validados (escáner QR / validación
forzada del admin), instrumentada en `Fase3/FilmStars/api-gateway/src/metrics.ts`.
En Grafana: `sum(rate(filmstars_tickets_validated_total[1m])) * 60` = boletos/min.

## Configuración paso a paso

Ver guía HTML (pasos 20–21). Archivos: `infra/observability/values-monitoring.yaml`
y `infra/observability/grafana-filmstars-dashboard.json`.

## Capturas obligatorias

- [ ] Prometheus → **Status → Targets** (clúster + ec2-node-exporter + filmstars-api en UP)
- [ ] Grafana → dashboard "FilmStars — Observabilidad" con telemetría viva
- [ ] Grafana → panel de CPU/RAM de los pods de `filmstars`
- [ ] Grafana → panel de boletos validados por minuto (si instrumentado)
