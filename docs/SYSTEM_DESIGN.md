# System Design & Tradeoffs

## Architecture Choice

I chose a **Level 3 Orchestrator** pattern:

- **Level 1**: Static manifests (too rigid).
- **Level 2**: Basic API wrappers (unreliable).
- **Level 3 (This project)**: Asynchronous lifecycle management with state persistence.

### Why FastAPI + BackgroundTasks?

A store provisioning request is slow (30-60s). Using `BackgroundTasks` ensures the API remains responsive while the heavy lifting happens in the background. The database tracks the lifecycle (Provisioning -> Ready/Failed).

## Isolation Strategy

1. **Namespace isolation**: Each store gets its own namespace (`store-[name]`).
2. **Resource Quotas**: Limits total CPU/Memory/Pods per namespace to prevent "noisy neighbor" issues.
3. **LimitRange**: Enforces default resource requests/limits for every container, ensuring no "naked" pods can bypass our management policies.
4. **Network Policies**: Deny-by-default logic ensures stores cannot communicate with each other or the system core.
5. **Persistent Objects**: Dedicated PVCs for database storage.

## Idempotency & Failure Handling

- **Helm `upgrade --install`**: Used for all deployments. If a provisioning task is retried, Helm will resume or fix the existing state instead of creating duplicates.
- **Readiness Watcher**: The backend doesn't just "fire and forget." It polls the Kubernetes API until all containers are `Ready=True` before signaling success to the user.
- **Clean Cleanup**: Deleting a store triggers a full namespace deletion, which Kubernetes handles by garbage-collecting all nested resources (Pods, SVCs, Secrets, PVCs).

## Abuse Prevention

- **Namespace Quotas**: Hard limits on CPU (2.0) and Memory (2Gi) per store.
- **Naming Validation**: Frontend and Backend validate store names for Kubernetes compatibility (lowercase, alphanumeric, hyphens).
- **Timeouts**: The readiness watcher has a 5-minute timeout to prevent hanging tasks.
- **Audit Logs**: The database tracks `created_at` and `updated_at` for every store. All system actions (Creation, Deletion, Failures) are logged with high-cardinality metadata for easy troubleshooting.

## Scalability Plan (Video Script Reference)

### 1. Horizontal Scaling (Stateless Components)

- **API & Orchestrator**: The FastAPI backend is stateless. We can deploy it as a `Deployment` with HPA (Horizontal Pod Autoscaler) enabled, scaling from 1 to 10 replicas based on CPU/Request load.
- **Dashboard**: Served as static assets (Vite build) via CDN or Nginx, allowing infinite read scalability.

### 2. Scaling Provisioning Throughput

- **Current Architecture**: Uses `BackgroundTasks` (AsyncIO). Capable of handling ~50 concurrent provisions per pod before CPU saturation.
- **Next Stage**: Decouple provisioning logic into a dedicated **Celery Worker Pool** with Redis. This allows us to scale the "Worker Tier" independently of the "API Tier".

### 3. Stateful Constraints & Data

- **Database (The Bottleneck)**: SQLite is the current limiter.
- **Migration Plan**:
  1. Switch to **PostgreSQL** (Managed RDS) for the Orchestrator DB.
  2. Implement **Read Replicas** for high-traffic read operations (e.g., `GET /stores`).
  3. Use **Connection Pooling** (PgBouncer) to handle thousands of concurrent backend connections.

## Security Posture

- **Secret Handling**: Sensitive data (DB passwords, user credentials) are never stored in plain text. They are managed via **Kubernetes Secrets** and injected into pods as environment variables at runtime.
- **Least Privilege (RBAC)**: The orchestrator connects to the cluster using a dedicated ServiceAccount. We have provided `infra/k8s/templates/provisioner_rbac.yaml` which defines the exact `ClusterRole` permissions required (Namespaces, Pods, Deployments, Ingresses, etc.) to eliminate the need for cluster-admin access.
- **Exposure**: Only the WordPress frontend is exposed via Ingress. The database and other support services are internal-only and inaccessible from the public internet.
- **Container Hardening**: We use Bitnami-based images which are configured to run as **non-root users** by default (UID 1001), significantly reducing the risk of container breakout.

## Upgrades & Rollbacks

- **Version Management**: We use Helm's versioning system. To upgrade a store, we update the image tag or chart version and perform a `helm upgrade`.
- **Safe Rollback**: If a new version fails health checks, we can execute `helm rollback [name] 1` to instantly return to the last known stable state, preserving the persistent database.

## Production Differences

Controlled via `infra/helm/*/values-*.yaml`:

- **Storage**: Local (hostPath) vs Prod (Cloud Provisioner).
- **Networking**: Local (`nip.io`) vs Prod (Custom domains + Cert-Manager TLS).
- **Resources**: Development-grade vs Production-grade CPU/Memory requests.
