# Kubernetes Store Orchestrator

Provision WooCommerce stores on Kubernetes with one click.

Each store is deployed in an isolated namespace with its own resources, database, and networking rules.

## Highlights

- One-click WooCommerce provisioning from a React dashboard
- Async provisioning flow with live status updates
- Store isolation using `Namespace`, `ResourceQuota`, `LimitRange`, and `NetworkPolicy`
- Helm-based deployment for repeatable installs and clean teardown
- FastAPI backend with background orchestration tasks

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** FastAPI + SQLAlchemy
- **Database:** SQLite (dev)
- **Infra:** Kubernetes (k3s/k3d), Helm, kubectl

## Project Structure

```text
backend/    FastAPI API + orchestration logic
frontend/   React dashboard
infra/      Helm chart config + Kubernetes templates
```

## Quick Start

### Prerequisites

- Docker
- k3d
- kubectl
- Helm
- Python 3.9+
- Node.js 18+

### 1) Create local cluster

```bash
k3d cluster create k8s-store --port "8080:80@loadbalancer"
```

### 2) Run backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

### 3) Run frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Environment

### Backend (`backend/.env`)

- `BASE_DOMAIN=127.0.0.1.nip.io`
- `ENV=local` (or `production`)

### Frontend (`frontend/.env`)

- `VITE_API_URL=http://localhost:8000`

## API (Core Endpoints)

- `POST /stores` - create a new store
- `GET /stores` - list stores and statuses
- `DELETE /stores/{id}` - delete a store

## Production Notes

- Works on k3s (tested on AWS EC2)
- Set `BASE_DOMAIN=<your-ip>.nip.io` for wildcard host routing
- Apply RBAC before provisioning:

```bash
kubectl apply -f infra/k8s/templates/provisioner_rbac.yaml
```

## License

MIT
