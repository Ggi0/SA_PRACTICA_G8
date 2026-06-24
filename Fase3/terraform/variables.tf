variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix applied to all resource names"
  type        = string
  default     = "filmstars"
}

variable "key_pair_name" {
  description = "Name of the existing EC2 Key Pair used for SSH access"
  type        = string
}

variable "k3s_instance_type" {
  description = "EC2 instance type for the K3s master node (production)"
  type        = string
  default     = "t3.medium"
}

variable "develop_instance_type" {
  description = "EC2 instance type for the develop VM (Docker Compose staging)"
  type        = string
  default     = "t3.small"
}

variable "k3s_volume_size_gb" {
  description = "Root volume size in GB for K3s master"
  type        = number
  default     = 20
}

variable "develop_volume_size_gb" {
  description = "Root volume size in GB for develop VM"
  type        = number
  default     = 15
}
