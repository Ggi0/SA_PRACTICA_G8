terraform {
  backend "s3" {
    # ┌──────────────────────────────────────────────────────────────────────┐
    # │ ⚠️  CAMBIA ESTO ANTES DE 'terraform init'                             │
    # │ El nombre del bucket S3 es GLOBAL. Pon AQUÍ el bucket único que       │
    # │ creaste en el bootstrap (paso 3), p.ej. filmstars-tfstate-g8-2026.    │
    # │ Alternativa sin editar este archivo:                                  │
    # │   terraform init -backend-config="bucket=TU_BUCKET_UNICO"             │
    # │ (deploy-infra.sh ya hace esto con la variable TF_STATE_BUCKET)        │
    # └──────────────────────────────────────────────────────────────────────┘
    bucket = "filmstars-tfstate-g8-2026"
    key    = "infra/terraform.tfstate"
    region = "us-east-2"

    encrypt = true

    # Bloqueo nativo de S3: requiere Terraform >= 1.11.
    # Si usas una versión MENOR, comenta la línea siguiente (o actualiza Terraform).
    use_lockfile = true
  }
}
