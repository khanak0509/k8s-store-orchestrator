# Urumi — Kubernetes Store Orchestrator

A platform that provisions fully functional, isolated WooCommerce stores on Kubernetes with one click.

## Architecture

```
User → React Dashboard → FastAPI Backend → Helm + kubectl → Isolated K8s Namespace
```

- **Frontend**: React (Vite) + Framer Motion
- **Backend**: FastAPI + SQLAlchemy (SQLite)
- **Orchestration**: Helm charts + kubectl via subprocess
- **Infra**: Namespace-per-store with ResourceQuota, NetworkPolicy, LimitRange

## Project Structure

```
├── backend/              # FastAPI orchestrator
│   ├── main.py           # API endpoints + background tasks
│   ├── k8s_service.py    # Helm/kubectl wrapper functions
│   ├── models.py         # SQLAlchemy store model
│   ├── schemas.py        # Pydantic validation (K8s-safe names)
│   └── database.py       # DB session management
├── frontend/             # React dashboard
│   └── src/components/
│       ├── StoreDashboard.jsx      # Store list + polling
│       ├── StoreCard.jsx           # Store card with live quota view
│       ├── CreateStoreModal.jsx    # Store creation form
│       └── InfrastructureMonitor.jsx # Live cluster health
├── infra/
│   ├── helm/woocommerce/
│   │   ├── Chart.yaml              # Bitnami WordPress dependency
│   │   ├── values-local.yaml       # Local dev config (1Gi, low CPU)
│   │   └── values-prod.yaml        # Production config (10Gi, TLS)
│   └── k8s/templates/
│       ├── resource_quota.yaml     # CPU/Memory/Pod caps per store
│       ├── network_policy.yaml     # Deny-by-default isolation
│       ├── limit_range.yaml        # Default container limits
│       └── provisioner_rbac.yaml   # Least-privilege ServiceAccount
└── docs/
    └── SYSTEM_DESIGN.md            # Architecture & tradeoffs
```

## Local Setup

### Prerequisites

- Docker
- k3d / Minikube / Kind
- kubectl & helm
- Python 3.9+
- Node.js 18+

### 1. Start a Cluster

```bash
k3d cluster create urumi --port "8080:80@loadbalancer"
```

### 2. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Set BASE_DOMAIN=127.0.0.1.nip.io
uvicorn main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to access the dashboard.

## Production Setup (VPS / AWS)

The same code runs in production — only the Helm values change.

1. Set `ENV=production` and `BASE_DOMAIN=<your-ip>.nip.io` in `backend/.env`
2. The backend auto-selects `values-prod.yaml` instead of `values-local.yaml`
3. Apply RBAC: `kubectl apply -f infra/k8s/templates/provisioner_rbac.yaml`

### What changes via Helm values (Local → Prod)

| Setting    | Local   | Production               |
| ---------- | ------- | ------------------------ |
| Storage    | 1Gi     | 10Gi                     |
| CPU limits | 500m    | 300m (optimized)         |
| TLS        | None    | Cert-Manager annotations |
| Ingress    | traefik | traefik                  |

## How to Create a Store and Place an Order

1. Open the dashboard at `http://localhost:5173`
2. Click **Create Store** → name it → select WooCommerce → Deploy
3. Wait for status to change from **Provisioning** → **Ready**
4. Click the store URL to open the storefront
5. Add a product to cart → Checkout → select **Cash on Delivery** → Place Order
6. Open `/wp-admin` (credentials shown on the store card) → WooCommerce → Orders → verify the order

## System Design & Tradeoffs

See [docs/SYSTEM_DESIGN.md](./docs/SYSTEM_DESIGN.md) for details on:

- Architecture choice & async provisioning
- Isolation strategy (Namespace + Quota + NetworkPolicy + LimitRange)
- Idempotency & failure handling
- Security posture & RBAC
- Horizontal scaling plan
- Upgrade & rollback strategy
