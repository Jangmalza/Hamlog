#!/bin/bash

# Cloudflare Tunnel Setup Helper for HamLog
# Usage: ./setup-tunnel.sh

set -e

echo "🚀 HamLog Cloudflare Tunnel Setup"
echo "==================================="

# 1. Install cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Installing cloudflared..."
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared.deb
    rm cloudflared.deb
    echo "✅ cloudflared installed successfully."
else
    echo "✅ cloudflared is already installed."
fi

# 2. Instructions for Login
echo ""
echo "🔑 Step 1: Authentication"
echo "We need to authenticate with Cloudflare."
echo "Running 'cloudflared tunnel login'..."
echo "----------------------------------------------------------------"
echo "⚠️  A URL will appear below."
echo "⚠️  Copy and paste it into your browser to authorize this server."
echo "----------------------------------------------------------------"
read -p "Press Enter to continue..."

cloudflared tunnel login

# 3. Create Tunnel
echo ""
echo "🏗️  Step 2: Create Tunnel"
read -p "Enter a name for this tunnel (e.g., hamlog-prod): " TUNNEL_NAME

# Capture output to find UUID, but also show it to user
# running create command directly lets user see output.
# We'll ask for UUID manually to be safe, easier than parsing mixed output safely in bash without jq
cloudflared tunnel create "$TUNNEL_NAME"

echo ""
echo "----------------------------------------------------------------"
echo "Check the output above. You should see an ID like '8e2d...'"
read -p "Paste the Tunnel UUID here: " TUNNEL_ID

CREDENTIALS_FILE="/home/$USER/.cloudflared/$TUNNEL_ID.json"

if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo "❌ Error: Credentials file not found at $CREDENTIALS_FILE"
    echo "Did the tunnel creation succeed?"
    exit 1
fi

# 4. Configure Domain
echo ""
echo "🌐 Step 3: Connect Domain"
read -p "Enter your domain name (e.g., hamlog.dev): " DOMAIN_NAME

echo "Routing DNS..."
cloudflared tunnel route dns "$TUNNEL_NAME" "$DOMAIN_NAME"

# 5. Create Config
echo ""
echo "📝 Step 4: Generating Configuration..."
mkdir -p ~/.cloudflared
CONFIG_PATH="/home/$USER/.cloudflared/config.yml"

cat > "$CONFIG_PATH" <<EOF
tunnel: $TUNNEL_ID
credentials-file: $CREDENTIALS_FILE

ingress:
  - hostname: $DOMAIN_NAME
    service: http://localhost:4000
  - service: http_status:404
EOF

echo "✅ Config file created at $CONFIG_PATH"

# 6. Run as Service
echo ""
echo "🏃 Step 5: Install and Start Service"
echo "This will configure cloudflared to run automatically on boot."
read -p "Run service installation? (y/n): " INSTALL_SVC

if [[ "$INSTALL_SVC" =~ ^[Yy]$ ]]; then
    sudo cloudflared service install
    sudo systemctl start cloudflared
    sudo systemctl enable cloudflared
    echo "✅ Cloudflare Tunnel is now running!"
    echo "🌍 Access your site at https://$DOMAIN_NAME"
else
    echo "Skipping service installation."
    echo "You can run it manually with: cloudflared tunnel run $TUNNEL_NAME"
fi
