# Latest Ubuntu 22.04 LTS AMI (Canonical)
data "aws_ami" "ubuntu_22" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ─── K3s Master (Production) ──────────────────────────────────────────────────

resource "aws_instance" "k3s_master" {
  ami                    = data.aws_ami.ubuntu_22.id
  instance_type          = var.k3s_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.k3s.id]
  key_name               = var.key_pair_name

  root_block_device {
    volume_size           = var.k3s_volume_size_gb
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name    = "${var.project_name}-k3s-master"
    Project = var.project_name
    Role    = "k3s-master"
    Env     = "production"
  }
}

# ─── Develop VM (Staging / Docker Compose) ────────────────────────────────────

resource "aws_instance" "develop_vm" {
  ami                    = data.aws_ami.ubuntu_22.id
  instance_type          = var.develop_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.develop.id]
  key_name               = var.key_pair_name

  root_block_device {
    volume_size           = var.develop_volume_size_gb
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name    = "${var.project_name}-develop-vm"
    Project = var.project_name
    Role    = "develop"
    Env     = "staging"
  }
}
