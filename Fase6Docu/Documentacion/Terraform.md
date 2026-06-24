# Documentación — Terraform (IaC en AWS)

## Qué es y cómo funciona

Terraform es una herramienta de **Infraestructura como Código (IaC)** declarativa.
Se describe el estado final deseado en archivos `.tf` y Terraform calcula y aplica
los cambios. El **archivo de estado** (`terraform.tfstate`) es el mapa de lo que
administra; aquí se guarda **remoto en S3** (`infra/terraform/backend.tf`) con
versionado y bloqueo, para evitar corrupción y permitir trabajo en equipo.

## Recursos declarados (`infra/terraform/`)

| Archivo | Recursos |
|---------|----------|
| `network.tf`  | VPC `10.0.0.0/16`, subnet pública, Internet Gateway, route table |
| `security.tf` | Security Groups: k3s, registry, develop |
| `compute.tf`  | 3 EC2 Ubuntu 22.04 + key pair + 3 Elastic IP |
| `outputs.tf`  | IPs públicas/privadas + valores para GitHub Secrets + inventory Ansible |

## Configuración paso a paso

Ver guía HTML (pasos 3–9). Resumen:

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars   # edita admin_cidr
terraform -chdir=infra/terraform init
terraform -chdir=infra/terraform plan
terraform -chdir=infra/terraform apply
```

## Capturas obligatorias

- [ ] `terraform plan` / `terraform apply` (salida en terminal)
- [ ] Consola AWS: **VPC**
- [ ] Consola AWS: **Subnets**
- [ ] Consola AWS: **Security Groups**
- [ ] Consola AWS: **EC2 Instances** (las 3)
- [ ] Consola AWS: **Elastic IPs**
