# Documentación — Ansible (gestión de configuración)

## Qué es y cómo funciona

Ansible automatiza la configuración de servidores de forma **agentless**: se
conecta por SSH y ejecuta **Playbooks** (YAML) con tareas **idempotentes** (correr
N veces deja el mismo resultado). No instala ningún agente permanente.

## Playbooks (`infra/ansible/`)

| Playbook | Hace |
|----------|------|
| `playbooks/common.yml`   | Instala `node_exporter` (systemd) en las 3 EC2 |
| `playbooks/registry.yml` | Despliega el registry privado **Zot** (Docker + htpasswd) |
| `playbooks/develop.yml`  | Instala Docker + Compose plugin en la VM develop |
| `playbooks/k3s.yml`      | Instala **K3s server**, configura `registries.yaml` (Zot inseguro) y extrae el kubeconfig |
| `site.yml`               | Orquesta los anteriores en orden |

## Configuración paso a paso

```bash
ansible-galaxy collection install community.docker community.general
cp infra/ansible/group_vars/all.example.yml infra/ansible/group_vars/all.yml
terraform -chdir=infra/terraform output -raw ansible_inventory > infra/ansible/inventory.ini
cd infra/ansible && mkdir -p artifacts && ansible-playbook site.yml
```

## Capturas obligatorias

- [ ] `ansible all -m ping` (pong de las 3 EC2)
- [ ] Logs de `ansible-playbook site.yml` (recap final `ok=`/`changed=`)
- [ ] Nodo K3s `Ready` (`kubectl get nodes`)
