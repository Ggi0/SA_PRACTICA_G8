terraform {
  backend "s3" {

    bucket = "filmstars-tfstate-g8-2026"
    key    = "infra/terraform.tfstate"
    region = "us-east-2"

    encrypt = true

    use_lockfile = true
  }
}
