# Justificaciones técnicas (Qué herramienta · Por qué · Para qué)

## Terraform (proveedor de IaC)

- **Qué:** IaC declarativa multi-nube.
- **Por qué:** estado reproducible y versionable; `plan` previsualiza cambios antes
  de aplicarlos; elimina el aprovisionamiento manual propenso a error en la consola AWS.
- **Para qué:** crear VPC, subnets, Security Groups, Internet Gateway, EC2 y Elastic IP
  de forma idempotente y auditable.

## Ansible (vs scripts Bash tradicionales)

- **Qué:** gestión de configuración agentless por SSH.
- **Por qué:** **idempotencia** (un script Bash repetido puede romper estado; un
  playbook converge al estado deseado), legibilidad declarativa, módulos probados
  (`apt`, `docker_container`, `systemd`) y reuso entre hosts.
- **Para qué:** instalar Docker, el registry Zot, K3s y node_exporter de forma
  consistente en las 3 EC2.

## Prometheus + Grafana (stack de observabilidad)

- **Qué:** Prometheus (recolección por *scraping* de series temporales) + Grafana
  (visualización).
- **Por qué:** estándar de facto en Kubernetes, modelo *pull* sencillo de escalar,
  *exporters* listos (node, kube-state) y dashboards reutilizables.
- **Para qué:** auditar en tiempo real CPU/RAM de los pods, salud del Ingress,
  estado de los targets y métricas de negocio (boletos validados/min).
