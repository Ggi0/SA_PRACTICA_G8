output "k3s_master_public_ip" {
  description = "Public IP of the K3s master node — use as K3S_IP in GitHub secrets"
  value       = aws_instance.k3s_master.public_ip
}

output "k3s_master_public_dns" {
  description = "Public DNS of the K3s master node"
  value       = aws_instance.k3s_master.public_dns
}

output "develop_vm_public_ip" {
  description = "Public IP of the develop VM — use as DEVELOP_HOST in GitHub secrets"
  value       = aws_instance.develop_vm.public_ip
}

output "develop_vm_public_dns" {
  description = "Public DNS of the develop VM"
  value       = aws_instance.develop_vm.public_dns
}

output "vpc_id" {
  description = "ID of the FilmStars VPC"
  value       = aws_vpc.filmstars.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "grafana_url" {
  description = "Grafana dashboard URL (NodePort 30300)"
  value       = "http://${aws_instance.k3s_master.public_ip}:30300"
}
