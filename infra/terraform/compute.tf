# AMI Ubuntu 22.04 más reciente (Canonical)
data "aws_ami" "ubuntu" {
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

# Key pair: sube tu llave pública (generada en el bootstrap)
resource "aws_key_pair" "deploy" {
  key_name   = "${var.project}-key"
  public_key = file(var.ssh_pub_key_path)
}

# ---------- EC2: K3s (release) ----------
resource "aws_instance" "k3s" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.k3s_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.k3s.id]
  key_name               = aws_key_pair.deploy.key_name
  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }
  tags = { Name = "${var.project}-k3s" }
}

# ---------- EC2: registry Zot ----------
resource "aws_instance" "registry" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.registry_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.registry.id]
  key_name               = aws_key_pair.deploy.key_name
  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }
  tags = { Name = "${var.project}-registry" }
}

# ---------- EC2: develop (Docker Compose) ----------
resource "aws_instance" "develop" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.develop_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.develop.id]
  key_name               = aws_key_pair.deploy.key_name
  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }
  tags = { Name = "${var.project}-develop" }
}

# ---------- Elastic IPs (IPs publicas fijas) ----------
resource "aws_eip" "k3s" {
  domain = "vpc"
  tags   = { Name = "${var.project}-k3s-eip" }
}
resource "aws_eip" "registry" {
  domain = "vpc"
  tags   = { Name = "${var.project}-registry-eip" }
}
resource "aws_eip" "develop" {
  domain = "vpc"
  tags   = { Name = "${var.project}-develop-eip" }
}

resource "aws_eip_association" "k3s" {
  instance_id   = aws_instance.k3s.id
  allocation_id = aws_eip.k3s.id
}

resource "aws_eip_association" "registry" {
  instance_id   = aws_instance.registry.id
  allocation_id = aws_eip.registry.id
}

resource "aws_eip_association" "develop" {
  instance_id   = aws_instance.develop.id
  allocation_id = aws_eip.develop.id
}
