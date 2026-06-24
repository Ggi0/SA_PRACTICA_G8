# Infraestructura — Práctica 6 (FilmStars en AWS)

IaC (Terraform) + configuración (Ansible) + observabilidad (Prometheus/Grafana)
para desplegar FilmStars en AWS con un clúster K3s autogestionado.

> Guía paso a paso completa (copiar/pegar): `../Fase3/Documentacion/guia-despliegue-aws-practica6.html`

## Estructura

```
infra/
├── terraform/      # VPC, subnet, IGW, Security Groups, 3 EC2, Elastic IPs
├── ansible/        # node_exporter, Zot, Docker, K3s + kubeconfig
├── observability/  # values del kube-prometheus-stack + dashboard Grafana
└── scripts/        # deploy-infra.sh (orquesta terraform + ansible)
```

## Bootstrap (una sola vez, manual por diseño)

```bash
# 1) Llave SSH que Terraform inyecta en las EC2
ssh-keygen -t ed25519 -C "filmstars-deploy" -f ~/.ssh/filmstars_deploy -N ""

# 2) Bucket S3 del estado (nombre GLOBAL único; cámbialo si está tomado y
#    refléjalo en terraform/backend.tf)
aws s3api create-bucket --bucket filmstars-tfstate-g8 --region us-east-2 \
  --create-bucket-configuration LocationConstraint=us-east-2
aws s3api put-bucket-versioning --bucket filmstars-tfstate-g8 \
  --versioning-configuration Status=Enabled
```

## Despliegue reproducible

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars   # edita admin_cidr
cp ansible/group_vars/all.example.yml  ansible/group_vars/all.yml  # edita credenciales Zot

# Pasa tu bucket S3 único (paso 3) sin editar backend.tf:
TF_STATE_BUCKET=mi-bucket-unico bash scripts/deploy-infra.sh
```

El script: `init` (con tu bucket) → **`plan` (lo revisas)** → te pide escribir `yes`
→ `apply` → genera `ansible/inventory.ini` desde los outputs → corre los playbooks →
imprime los valores para los **GitHub Secrets** (`ZOT_HOST`, `K3S_IP`, `DEVELOP_HOST`,
`KUBECONFIG_B64`). Para CI no interactivo: `AUTO_APPROVE=1`.

> El PDF exige despliegue de la app **sin clics manuales**: eso lo cubre el pipeline
> `.github/workflows/ci-cd.yml`. La infraestructura es reproducible vía estos archivos
> versionados y el script; opcionalmente puede ejecutarse desde
> `.github/workflows/infra.yml` (disparo manual `workflow_dispatch`).

## Observabilidad

```bash
export KUBECONFIG=$PWD/ansible/artifacts/k3s-kubeconfig.yaml
cp observability/values-monitoring.yaml.example observability/values-monitoring.yaml  # edita IPs privadas
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace monitoring
helm install kps prometheus-community/kube-prometheus-stack -n monitoring \
  -f observability/values-monitoring.yaml
# Grafana: http://K3S_IP:30030   ·   Prometheus: http://K3S_IP:30090
# Importa observability/grafana-filmstars-dashboard.json en Grafana.
```

## Limpieza (SOLO después de la calificación)

```bash
terraform -chdir=terraform destroy
```
