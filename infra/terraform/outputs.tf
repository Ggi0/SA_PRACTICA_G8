output "k3s_public_ip" { value = aws_eip.k3s.public_ip }
output "k3s_private_ip" { value = aws_instance.k3s.private_ip }
output "registry_public_ip" { value = aws_eip.registry.public_ip }
output "registry_private_ip" { value = aws_instance.registry.private_ip }
output "develop_public_ip" { value = aws_eip.develop.public_ip }
output "develop_private_ip" { value = aws_instance.develop.private_ip }

# Valores listos para tus GitHub Secrets
output "ZOT_HOST" { value = "${aws_eip.registry.public_ip}:5000" }
output "K3S_IP" { value = aws_eip.k3s.public_ip }
output "DEVELOP_HOST" { value = aws_eip.develop.public_ip }

# Bloque de inventory de Ansible listo para copiar a infra/ansible/inventory.ini
output "ansible_inventory" {
  value = <<-EOT
    [registry]
    ${aws_eip.registry.public_ip} private_ip=${aws_instance.registry.private_ip}

    [develop]
    ${aws_eip.develop.public_ip} private_ip=${aws_instance.develop.private_ip}

    [k3s]
    ${aws_eip.k3s.public_ip} private_ip=${aws_instance.k3s.private_ip}

    [all:vars]
    ansible_user=ubuntu
    ansible_python_interpreter=/usr/bin/python3
  EOT
}
