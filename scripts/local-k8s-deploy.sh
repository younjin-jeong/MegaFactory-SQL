#!/usr/bin/env bash
set -euo pipefail

# Local K8s deployment script for MegaFactory SQL using Colima
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== MegaFactory SQL — Local K8s Deploy ==="
echo "Project: $PROJECT_DIR"

# 1. Check Colima
if ! command -v colima &>/dev/null; then
  echo "ERROR: colima not found. Install with: brew install colima"
  exit 1
fi

if ! colima status &>/dev/null; then
  echo "Starting Colima with K8s (4 CPU, 8GB RAM, 60GB disk)..."
  colima start --kubernetes --cpu 4 --memory 8 --disk 60
fi

# 2. Ensure docker context
docker context use colima 2>/dev/null || true

# 3. Build Docker image
echo "Building Docker image..."
cd "$PROJECT_DIR"
docker buildx build -f docker/Dockerfile -t megafactory-sql:latest --load .

# 4. Deploy to K8s
echo "Deploying to K8s..."
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# 5. Wait for rollout
echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/megafactory-sql --timeout=120s

# 6. Print access info
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo ""
echo "=== MegaFactory SQL is ready ==="
echo "URL: http://localhost:30000"
echo "K8s NodePort: 30000"
echo "Pod status:"
kubectl get pods -l app=megafactory-sql
echo ""
