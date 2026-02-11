# Urumi Store Orchestrator - Round 1 Submission

A robust, Kubernetes-native platform for provisioning and managing isolated e-commerce stores (WooCommerce/MedusaJS).

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Local Setup (Kind/k3d/Minikube)](#local-setup)
- [Production Setup (k3s/VPS)](#production-setup)
- [Usage Guide](#usage-guide)
- [System Design & Tradeoffs](./docs/SYSTEM_DESIGN.md)

## Architecture Overview

The system follows a modern microservices architecture:

- **Frontend**: React (Vite) + Framer Motion + Lucide Icons.
- **Backend**: FastAPI (Python) + SQLAlchemy (SQLite).
- **Orchestration**: Asynchronous background tasks using `helm` and `kubectl` CLI wrappers.
- **Infrastructure**: Namespace-per-store isolation with Resource Quotas and Network Policies.

## Local Setup

### Prerequisites

- Docker
- k3d (recommended) or Minikube/Kind
- kubectl & helm
- Python 3.9+
- Node.js 18+

### 1. Start Cluster (k3d example)

```bash
k3d cluster create urumi-cluster --port "8080:80@loadbalancer"
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env # Ensure BASE_DOMAIN=127.0.0.1.nip.io
uvicorn main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Production Setup

The project is designed to be "Portable-to-Prod" using Helm:

- **Environment**: Set `ENV=production` in `.env`.
- **Values**: The system will automatically switch from `values-local.yaml` to `values-prod.yaml` in `infra/helm/`.
- **Security (RBAC)**: Apply the least-privilege service account: `kubectl apply -f infra/k8s/templates/provisioner_rbac.yaml`.
- **TLS (Optional)**: Production values include Cert-Manager annotations. To enable, ensure a `ClusterIssuer` named `letsencrypt-prod` exists on your VPS.
- **Storage**: Scaled from 1Gi (local) to 10Gi (prod) via Helm values using the `local-path` provisioner on k3s.
- **Domains**: Uses `nip.io` by default for zero-config DNS (e.g., `store1.IP.nip.io`).

## Usage Guide

1. Open the dashboard at `http://localhost:5173`.
2. Click **Provision Store**.
3. Choose **WooCommerce**.
4. Wait for the status to change from `Provisioning` to `Ready` (the system waits for actual Pod health).
5. Click **Access Admin** or the **Store URL**.
6. **Credentials**: Use the generated password shown on the card (Username: `admin`).

### Placing an Order (End-to-End)

- **WooCommerce**:
  1. Open the storefront.
  2. Add any default item to the cart.
  3. Proceed to Checkout.
  4. Select "Cash on Delivery" or dummy gateway.
  5. Place Order.
  6. Log in to `/wp-admin` with the provided credentials to see your order!
