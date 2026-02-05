# Backend Integration Guide for Store Provisioning Platform

This guide outlines how to connect the React-based frontend to a real Kubernetes-native backend.

## 1. API Contract Expectations

The frontend currently uses a mocked state within `StoreDashboard.jsx`. To integrate with a real backend, you should implement an API (Python/FastAPI or Node.js/Express) with the following endpoints:

### GET `/api/stores`

- **Description**: Returns all provisioned stores.
- **Expected Response**:

```json
[
  {
    "id": "uuid",
    "name": "Store Name",
    "type": "WooCommerce" | "MedusaJS",
    "status": "Ready" | "Provisioning" | "Failed",
    "url": "https://store-url.com",
    "adminUrl": "https://store-url.com/admin",
    "createdAt": "ISO-TIMESTAMP"
  }
]
```

### POST `/api/stores`

- **Description**: Triggers a new Helm-based provisioning job.
- **Payload**: `{ "name": "Store Name", "type": "WooCommerce" | "MedusaJS" }`
- **Behavior**: Should return a `202 Accepted` immediately and start the Kubernetes orchestration in the background.

### DELETE `/api/stores/:id`

- **Description**: Tears down all Kubernetes resources for the store.
- **Behavior**: Should delete the store's namespace (which cleans up PVCs, Deployments, and Services).

## 2. Step-by-Step Backend Implementation Flow

To complete the full task, follow these steps:

1.  **Helm Chart Preparation**:
    - Create a base Helm chart for WooCommerce (Wordpress + MariaDB).
    - Create a base Helm chart for MedusaJS (Node + Postgres + Redis).
    - Use `values-local.yaml` for Minikube/Kind and `values-prod.yaml` for VPS (k3s).

2.  **Orchestrator Service**:
    - Implement a service that uses the Kubernetes Python/Client or Go SDK.
    - When a new store request arrives:
      - Create a Namespace: `store-<name>`.
      - Run `helm install store-<name> ./charts/store --namespace store-<name>`.
      - Update the store status in a database (SQLite or Postgres).

3.  **Ingress and DNS**:
    - Use NGINX Ingress Controller.
    - Map local domains (e.g., `*.localhost` or use `etc/hosts`).
    - In production, use `cert-manager` for TLS.

4.  **Frontend Update**:
    - Update `StoreDashboard.jsx` to use `fetch()` or `axios`.
    - Replace the mock state in `useEffect` with real API calls.

## 3. Recommended Tech Stack

- **Backend**: FastAPI (Python) - easy to use with K8s client.
- **Database**: PostgreSQL (for store metadata).
- **Orchestration**: Helm + Python Kubernetes Client.
