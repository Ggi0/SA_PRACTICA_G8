# Seguridad de la información

- Credenciales (contraseñas, IPs, tokens, URLs) viven en **`.env` / GitHub Secrets**,
  **nunca** en el repositorio.
- Ignorados por Git (`.gitignore`): `secrets.env`, `*.env`, `*.pem`,
  `infra/terraform/terraform.tfvars`, `*.tfstate*`, `infra/ansible/group_vars/all.yml`,
  `infra/ansible/inventory.ini`, `infra/ansible/artifacts/`,
  `infra/observability/values-monitoring.yaml`.
- En el clúster, las contraseñas se inyectan en runtime como el Secret
  `filmstars-secrets`; los ConfigMaps solo llevan datos no sensibles.

## Verificación de que no se suben secretos

```bash
git status
git ls-files secrets.env          # debe devolver VACÍO
git ls-files | grep -E "tfvars$|all.yml$|\.pem$"   # debe devolver VACÍO
```

## Capturas obligatorias

- [ ] `git status` mostrando `secrets.env` / `terraform.tfvars` ignorados
- [ ] GitHub → Settings → Secrets and variables → Actions (lista de secrets, sin valores)
