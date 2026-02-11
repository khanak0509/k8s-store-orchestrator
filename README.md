# Kubernetes Store Orchestrator

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
k3d cluster create k8s-store --port "8080:80@loadbalancer"
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
cp .env.example .env   # Set VITE_API_URL=http://localhost:8000
npm run dev
```

Open `http://localhost:5173` to access the dashboard.

### Production Setup (VPS / AWS)

The same code runs in production — only the Helm values change.

1. **Fix Kubeconfig Permissions** (Crucial on AWS/k3s):

   ```bash
   mkdir -p ~/.kube
   sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
   sudo chown $(whoami) ~/.kube/config
   chmod 600 ~/.kube/config
   export KUBECONFIG=~/.kube/config
   ```

2. Set `ENV=production` and `BASE_DOMAIN=<your-ip>.nip.io` in `backend/.env`
3. Set the frontend API URL: `echo "VITE_API_URL=http://<your-ip>:8000" > frontend/.env`
4. The backend auto-selects `values-prod.yaml` instead of `values-local.yaml`
5. Apply RBAC: `kubectl apply -f infra/k8s/templates/provisioner_rbac.yaml`

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

### Why I built it this way

Provisioning a store takes 30-60 seconds (WordPress + MariaDB + WooCommerce install). I can't make the user stare at a loading screen that long, so the API returns right away with `status: Provisioning` and the actual work runs in a background task. The frontend polls every few seconds to check if it's ready yet.

I went with FastAPI's `BackgroundTasks` instead of something like Celery because given the time constraint, setting up a Redis queue felt like overkill. The tradeoff is that if the backend process dies, in-flight provisions are lost — but for a complete production setup we can easily switch to Celery later.

### How stores stay isolated

Every store goes into its own Kubernetes namespace. On top of that, each namespace gets:

- A **ResourceQuota** so one store can't eat all the cluster's CPU and RAM
- A **NetworkPolicy** set to deny-all, so stores can't talk to each other
- A **LimitRange** that puts default limits on any container, so nothing runs without bounds

Each store also has its own MariaDB with its own PVC — zero data sharing between stores.

### Handling failures

I use `helm upgrade --install` instead of plain `helm install`. If something crashes mid-provision and I retry, Helm picks up where it left off instead of failing with "already exists."

The readiness watcher checks for known bad states (ImagePullBackOff, quota exceeded) so it can fail fast instead of waiting the full 5-minute timeout.

For cleanup, I just delete the entire namespace. Kubernetes garbage-collects all the pods, services, secrets, and storage inside it automatically.

### Provisioning flow

```
POST /stores
  → Create DB record (status: Provisioning)
  → BackgroundTask:
      1. kubectl create namespace store-<name>
      2. kubectl apply ResourceQuota, NetworkPolicy, LimitRange
      3. helm upgrade --install <name> bitnami/wordpress -f values-<env>.yaml
      4. postStart hook inside the pod installs WooCommerce + products
      5. Backend polls k8s API until all containers are Ready (5-min timeout)
      6. Update DB → status: Ready, url: http://<name>.<domain>
```

### Abuse prevention

- ResourceQuota per namespace — hard caps prevent one store from eating all cluster resources
- Store names are validated on both frontend and backend (lowercase, alphanumeric, hyphens only)
- Database enforces unique store names, so duplicates are rejected
- 5-minute provisioning timeout prevents tasks from hanging forever
- `created_at` and `updated_at` timestamps on every store record for auditing

### Security

- Passwords are generated using Python's `secrets` module (cryptographically secure) and passed to Helm via `--set` flags. They're never stored in source code.
- I wrote an RBAC manifest (`provisioner_rbac.yaml`) that defines a least-privilege service account. In dev I use my kubeconfig, but in production I'd bind the backend to this service account so it can only do what it needs — create namespaces, deployments, services, and quotas. Not cluster-admin.
- Only WordPress is exposed via Ingress. MariaDB runs as ClusterIP — inaccessible from outside.
- Bitnami images run as non-root (UID 1001) by default, which reduces the risk of container breakouts.

### Scaling plan

| Component    | Current                      | Production                    |
| ------------ | ---------------------------- | ----------------------------- |
| Dashboard    | Vite dev server              | Static build behind CDN/Nginx |
| API          | Single uvicorn process       | K8s Deployment with HPA       |
| Provisioning | BackgroundTasks (in-process) | Celery + Redis worker pool    |
| Database     | SQLite                       | PostgreSQL (RDS) + PgBouncer  |

The API is stateless so scaling it horizontally is straightforward. The main bottleneck right now is SQLite — for production I'd swap it for PostgreSQL for concurrent write safety.

### Upgrades & rollbacks

- To upgrade a store: update the chart version or image tag, run `helm upgrade <name>`
- To rollback: `helm rollback <name> 1` — instant revert to last working state, PVCs are preserved
- For the platform itself: just update backend code and restart uvicorn. Stores run independently in their own namespaces, so there's no downtime.

### What's different in production

|                | Local               | Production                                    |
| -------------- | ------------------- | --------------------------------------------- |
| Helm values    | `values-local.yaml` | `values-prod.yaml` (auto-picked by `ENV` var) |
| Storage        | 1Gi                 | 10Gi                                          |
| DNS            | `127.0.0.1.nip.io`  | `<public-ip>.nip.io`                          |
| TLS            | off                 | Cert-Manager + Let's Encrypt                  |
| Secrets        | `.env` file         | generated at runtime, stored in k8s secrets   |
| Access control | personal kubeconfig | dedicated RBAC service account                |
