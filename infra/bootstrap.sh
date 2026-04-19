#!/bin/bash
# EC2 bootstrap — runs once at first boot via user-data.
# Installs Docker, Bun, cloudflared, and prepares app directory.
set -euxo pipefail
exec > >(tee /var/log/bootstrap.log) 2>&1

# ---- base packages ----
dnf update -y
dnf install -y git docker amazon-ssm-agent

systemctl enable --now docker
systemctl enable --now amazon-ssm-agent
usermod -aG docker ec2-user

# ---- Bun (installed system-wide to /usr/local/bun) ----
export BUN_INSTALL=/usr/local/bun
curl -fsSL https://bun.sh/install | bash
ln -sf "$BUN_INSTALL/bin/bun" /usr/local/bin/bun
ln -sf "$BUN_INSTALL/bin/bun" /usr/local/bin/bunx

# ---- cloudflared ----
curl -L --output /usr/local/bin/cloudflared \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x /usr/local/bin/cloudflared

# ---- app dir ----
mkdir -p /opt/beefasso
chown ec2-user:ec2-user /opt/beefasso

echo "bootstrap complete $(date)" >> /var/log/bootstrap.log
