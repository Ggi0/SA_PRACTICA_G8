#!/usr/bin/env bash
# Orquesta IaC + configuración de forma reproducible.
# Uso básico:        bash infra/scripts/deploy-infra.sh
# Bucket S3 propio:  TF_STATE_BUCKET=mi-bucket-unico bash infra/scripts/deploy-infra.sh
# Sin confirmación:  AUTO_APPROVE=1 bash infra/scripts/deploy-infra.sh   (CI)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF="$ROOT/terraform"
ANS="$ROOT/ansible"
TF_STATE_BUCKET="${TF_STATE_BUCKET:-filmstars-tfstate-g8}"

echo "==> 1/5 Terraform init (bucket: $TF_STATE_BUCKET)"
terraform -chdir="$TF" init -reconfigure -backend-config="bucket=$TF_STATE_BUCKET"

echo "==> 2/5 Terraform plan (REVISA los cambios antes de aplicar)"
terraform -chdir="$TF" plan -out=tfplan

if [ "${AUTO_APPROVE:-0}" != "1" ]; then
  read -r -p "¿Aplicar este plan? (escribe 'yes' para continuar): " ANS_OK
  [ "$ANS_OK" = "yes" ] || { echo "Cancelado por el usuario."; rm -f "$TF/tfplan"; exit 1; }
fi

echo "==> 3/5 Terraform apply"
terraform -chdir="$TF" apply tfplan
rm -f "$TF/tfplan"

echo "==> 4/5 Generar inventory + Ansible (node_exporter, Zot, Docker, K3s)"
terraform -chdir="$TF" output -raw ansible_inventory > "$ANS/inventory.ini"
cat "$ANS/inventory.ini"
cd "$ANS"
ansible-galaxy collection install community.docker community.general
mkdir -p artifacts
ansible-playbook site.yml

echo "==> 5/5 Listo. Valores para GitHub Secrets:"
echo "ZOT_HOST     = $(terraform -chdir="$TF" output -raw ZOT_HOST)"
echo "K3S_IP       = $(terraform -chdir="$TF" output -raw K3S_IP)"
echo "DEVELOP_HOST = $(terraform -chdir="$TF" output -raw DEVELOP_HOST)"
echo "KUBECONFIG_B64 ="
base64 -w0 "$ANS/artifacts/k3s-kubeconfig.yaml"; echo
