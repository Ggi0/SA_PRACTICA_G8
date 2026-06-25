variable "region" {
  type    = string
  default = "us-east-2"
}

variable "az" {
  type    = string
  default = "us-east-2a"
}

variable "project" {
  type    = string
  default = "filmstars"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}

# Tu IP pública /32 para SSH y para los paneles (Grafana/Prometheus/RabbitMQ).
# Obtén la tuya con:  curl ifconfig.me
variable "admin_cidr" {
  type        = string
  description = "Tu IP pública /32 para acceso administrativo"
  # default     = "181.209.152.179/32"
  default     = "0.0.0.0/0"
}

variable "ssh_pub_key_path" {
  type    = string
  default = "~/.ssh/filmstars_deploy.pub"
}

# Tipos de instancia (ajusta según presupuesto del lab).
# K3s aloja app + 4 PostgreSQL + RabbitMQ + Prometheus + Grafana + kube-state-metrics
# + node-exporter: usa t3.large COMO MÍNIMO; sube a t3.xlarge si ves pods OOMKilled/Pending.
variable "k3s_instance_type" {
  type    = string
  default = "c7i-flex.large"
}
variable "registry_instance_type" {
  type    = string
  default = "t3.small"
}
variable "develop_instance_type" {
  type    = string
  default = "c7i-flex.large"
}
