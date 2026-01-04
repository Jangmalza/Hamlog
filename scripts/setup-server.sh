#!/bin/bash

# HamLog Server Setup & Deploy Script
# Usage: ./setup-server.sh

set -e

APP_NAME="hamlog"
IMAGE_NAME="ghcr.io/jangmalza/hamlog:latest"
DATA_DIR="$HOME/hamlog-data"

echo "🐹 HamLog Server Setup Starting..."

# 1. Install Docker if not exists
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed successfully."
    echo "⚠️  Please logout and login again to apply Docker group changes, then run this script again."
    exit 1
fi

# 2. Setup Data Directories
echo "b  Setting up data directories at $DATA_DIR..."
mkdir -p "$DATA_DIR/data"
mkdir -p "$DATA_DIR/uploads"

# 3. Authentication
echo "🔐 Authenticating with GitHub Container Registry..."
read -p "Enter GitHub Username: " GH_USER
echo "Please enter your GitHub Personal Access Token (PAT) with 'read:packages' scope."
read -sp "GitHub Token: " CR_PAT
echo ""
echo "$CR_PAT" | docker login ghcr.io -u "$GH_USER" --password-stdin
# Note: User needs to provide their GitHub username, or we can prompt for it.
# Let's prompt for username to be safe.

# 4. Environment Variables
echo "⚙️  Configuring Environment..."
read -sp "Enter Admin Password for the Blog: " ADMIN_PWD
echo ""
read -sp "Enter JWT Secret (random string recommended): " JWT_SEC
echo ""
PORT=4000

# 5. Deploy
echo "🚀 Pulling latest image..."
docker pull $IMAGE_NAME

echo "🛑 Stopping existing container..."
docker stop $APP_NAME || true
docker rm $APP_NAME || true

echo "▶️  Starting new container..."
docker run -d \
  --name $APP_NAME \
  --restart unless-stopped \
  -p $PORT:4000 \
  -v "$DATA_DIR/data":/app/server/data \
  -v "$DATA_DIR/uploads":/app/server/uploads \
  -e PORT=4000 \
  -e JWT_SECRET="$JWT_SEC" \
  -e ADMIN_PASSWORD="$ADMIN_PWD" \
  $IMAGE_NAME

echo "✅ Deployment Complete!"
echo "🌍 Blog is running at http://localhost:$PORT"
