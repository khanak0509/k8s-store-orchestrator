import subprocess
import logging
import os
import shutil
import time
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if not shutil.which("kubectl") or not shutil.which("helm"):
    logger.critical("kubectl or helm is not installed! provisioning will fail.")

#  Create a dedicated namespace for store isolation
def k8s_create_namespace(name: str) -> bool:
    try:
        cmd = ["kubectl", "create", "namespace", name]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info(f"Namespace '{name}' created.")
            return True
        elif "already exists" in result.stderr:
            logger.info(f"Namespace '{name}' already exists.")
            return True
        else:
            logger.error(f"Namespace creation failed: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"System error creating namespace: {e}")
        return False

#  Apply resource quotas to prevent OOM/CPU starvation
def k8s_apply_resource_quota(namespace: str):
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        template_path = os.path.join(base_dir, "infra", "k8s", "templates", "resource_quota.yaml")
        
        with open(template_path, "r") as f:
            quota_yaml = f.read()
        
        cmd = ["kubectl", "apply", "-n", namespace, "-f", "-"]
        result = subprocess.run(cmd, input=quota_yaml, capture_output=True, text=True)
        if result.returncode == 0:
            logger.info(f"ResourceQuota applied to {namespace}")
            return True
        else:
            logger.error(f"Failed to apply ResourceQuota to {namespace}: {result.stderr}")
            return False
    except Exception as e:
        logger.error(f"Failed to apply ResourceQuota to {namespace}: {e}")
        return False

#  Apply default-deny network policy 
def k8s_apply_network_policy(namespace: str):
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        template_path = os.path.join(base_dir, "infra", "k8s", "templates", "network_policy.yaml")
        
        with open(template_path, "r") as f:
            policy_yaml = f.read()
        
        cmd = ["kubectl", "apply", "-n", namespace, "-f", "-"]
        result = subprocess.run(cmd, input=policy_yaml, capture_output=True, text=True)
        if result.returncode == 0:
            logger.info(f"NetworkPolicy applied to {namespace}")
            return True
        else:
            logger.error(f"Failed to apply NetworkPolicy to {namespace}: {result.stderr}")
            return False
    except Exception as e:
        logger.error(f"Failed to apply NetworkPolicy to {namespace}: {e}")
        return False


#  Poll K8s API for readiness and check for terminal errors
def k8s_wait_for_ready(namespace: str, timeout: int = 300) -> tuple[bool, str]:
    start_time = time.time()
    last_error = "Timed out waiting for pods to be ready"
    
    while time.time() - start_time < timeout:
        try:
            # Check if pods are ready
            cmd_ready = ["kubectl", "get", "pods", "-n", namespace, "-o", "jsonpath={.items[*].status.containerStatuses[*].ready}"]
            result_ready = subprocess.run(cmd_ready, capture_output=True, text=True)
            
            if result_ready.returncode == 0:
                statuses = result_ready.stdout.split()
                if statuses and all(s == "true" for s in statuses):
                    logger.info(f"All pods in {namespace} are Ready.")
                    return True, "Ready"
            
            # If not ready, check for "Terminal Errors"
            # Check for scheduling errors (like Quota Exceeded)
            cmd_events = ["kubectl", "get", "events", "-n", namespace, "--field-selector", "type=Warning", "-o", "jsonpath={.items[-1:].message}"]
            result_events = subprocess.run(cmd_events, capture_output=True, text=True)
            if result_events.stdout:
                last_error = result_events.stdout
                if "exceeded quota" in last_error.lower():
                    return False, f"Resource Quota Exceeded: {last_error}"

            # Check for container errors (like ImagePullBackOff or CrashLoop)
            cmd_pod_status = ["kubectl", "get", "pods", "-n", namespace, "-o", "jsonpath={.items[*].status.containerStatuses[*].state.waiting.reason}"]
            result_status = subprocess.run(cmd_pod_status, capture_output=True, text=True)
            if result_status.stdout:
                reasons = result_status.stdout.split()
                if any(r in ["ImagePullBackOff", "ErrImagePull", "CrashLoopBackOff"] for r in reasons):
                    return False, f"Deployment Error: {reasons[0]}"

            time.sleep(5)
        except Exception as e:
            logger.error(f"Error checking pod status: {e}")
            time.sleep(5)
    
    logger.error(f"Timeout waiting for pods in {namespace} to be ready.")
    return False, last_error

def k8s_deploy_store(name: str, engine_type: str, namespace: str, password: str = None):
    demo_password = password or os.getenv("DEMO_STORE_PASSWORD", "UrumiRound1Secure!")
    base_domain = os.getenv("BASE_DOMAIN", "127.0.0.1.nip.io")
    is_prod = os.getenv("ENV") == "production"
    
    # Path to our local values
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    values_file = "values-prod.yaml" if is_prod else "values-local.yaml"
    values_path = os.path.join(base_dir, "infra", "helm", engine_type, values_file)

    try:
        command = []
        
        if engine_type == "woocommerce":
            hostname = f"{name}.{base_domain}"
            command = [
                "helm", "upgrade", "--install", name, "oci://registry-1.docker.io/bitnamicharts/wordpress",
                "--namespace", namespace,
                "-f", values_path,
                "--set", f"wordpressPassword={demo_password}",
                "--set", f"mariadb.auth.rootPassword={demo_password}",
                "--set", f"ingress.hostname={hostname}",
            ]
            
        elif engine_type == "medusa":
            hostname = f"{name}.medusa.{base_domain}"
            command = [
                "helm", "upgrade", "--install", name, "oci://registry-1.docker.io/bitnamicharts/nginx",
                "--namespace", namespace,
                "-f", values_path,
                "--set", f"ingress.hostname={hostname}",
            ]
        else:
            return False, f"Unknown engine type: {engine_type}"

        logger.info(f"Deploying {name} to {namespace} with hostname {hostname}...")
        
        result = subprocess.run(command, capture_output=True, text=True)
        
        if result.returncode == 0:
            return True, f"http://{hostname}"
        else:
            logger.error(f"Helm failed: {result.stderr}")
            return False, result.stderr

    except Exception as e:
        logger.exception("Deploy function crashed")
        return False, str(e)


"""

#  Post-deployment configuration to convert vanilla WordPress into a Shop
#  DEPRECATED: Bootstrap is now handled by Helm Job (see values-*.yaml extraDeploy)
#  This function is kept as a fallback for backward compatibility and easy rollback
def k8s_configure_store(name: str, namespace: str):
    try:
        logger.info(f"[{name}] Bootstrapping e-commerce features...")
        
        # Get the wordpress pod name
        pod_cmd = ["kubectl", "get", "pods", "-n", namespace, "-l", "app.kubernetes.io/name=wordpress", "-o", "jsonpath={.items[0].metadata.name}"]
        pod_result = subprocess.run(pod_cmd, capture_output=True, text=True)
        if pod_result.returncode != 0 or not pod_result.stdout:
            logger.error(f"Could not find WordPress pod for bootstrapping in {namespace}")
            return False
            
        pod_name = pod_result.stdout.strip()
        
        # Get the store URL for WordPress configuration
        base_domain = os.getenv("BASE_DOMAIN", "127.0.0.1.nip.io")
        store_url = f"http://{name}.{base_domain}"
        
        # Commands to run inside the pod
        commands = [
            # Fix WordPress URL configuration to prevent white screen
            ["wp", "option", "update", "siteurl", store_url, "--allow-root"],
            ["wp", "option", "update", "home", store_url, "--allow-root"],
            # Install WooCommerce and configure the store
            ["wp", "plugin", "install", "woocommerce", "--activate", "--allow-root"],
            ["wp", "theme", "install", "storefront", "--activate", "--allow-root"],
            ["wp", "wc", "tool", "run", "install_pages", "--user=admin", "--allow-root"],
            ["wp", "wc", "product", "create", "--name=Urumi Beanie", "--type=simple", "--regular_price=15", "--user=admin", "--allow-root"],
            ["wp", "wc", "product", "create", "--name=Urumi Hoodie", "--type=simple", "--regular_price=45", "--user=admin", "--allow-root"],
            ["wp", "wc", "product", "create", "--name=Urumi Belt", "--type=simple", "--regular_price=20", "--user=admin", "--allow-root"]
        ]
        
        for cmd in commands:
            full_cmd = ["kubectl", "exec", "-n", namespace, pod_name, "--"] + cmd
            logger.info(f"[{name}] Running: {' '.join(cmd)}")
            subprocess.run(full_cmd, capture_output=True, text=True)
            
        return True
    except Exception as e:
        logger.error(f"Bootstrap failed for {name}: {e}")
        return False
"""


#  delete store completely
def k8s_delete_store(name: str, namespace: str):
    try:
        logger.info(f"Deleting store {name} in namespace {namespace}...")
        
        subprocess.run(
            ["helm", "uninstall", name, "--namespace", namespace], 
            capture_output=True, text=True
        )
        
        subprocess.run(
            ["kubectl", "delete", "namespace", namespace, "--wait=false"],
            capture_output=True, text=True
        )
        return True
    except Exception as e:
        logger.error(f"Failed to delete store {name}: {e}")
        return False


#  Get Cluster-wide health and resource metrics for the monitor
def k8s_get_cluster_status():
    try:
        # Check if Cluster API is Healthy
        health_cmd = ["kubectl", "get", "nodes", "-o", "jsonpath={.items[*].status.conditions[?(@.type=='Ready')].status}"]
        health_result = subprocess.run(health_cmd, capture_output=True, text=True)
        is_healthy = "True" in health_result.stdout if health_result.returncode == 0 else False
        
        # count namespace thare are active to show ui
        ns_cmd = ["kubectl", "get", "namespaces", "--no-headers", "-o", "custom-columns=NAME:.metadata.name,STATUS:.status.phase"]
        ns_result = subprocess.run(ns_cmd, capture_output=True, text=True)
        store_namespaces = []
        if ns_result.returncode == 0:
            for line in ns_result.stdout.strip().split("\n"):
                if not line.strip(): continue
                parts = line.split()
                if len(parts) >= 2:
                    name, status = parts[0], parts[1]
                    if name.startswith("store-") and status == "Active":
                        store_namespaces.append(name)
        
        #count namespace thare are active to show ui
        total_pods = 0
        if store_namespaces:
            # Count pods across all store namespaces
            pod_cmd = ["kubectl", "get", "pods", "--all-namespaces", "--no-headers", "--ignore-not-found"]
            pod_result = subprocess.run(pod_cmd, capture_output=True, text=True)
            
            if pod_result.stdout.strip():
                # Filter pods that belong to our store namespaces
                for line in pod_result.stdout.strip().split("\n"):
                    if line.strip():
                        parts = line.split()
                        # The first part of the line is the namespace name
                        if len(parts) > 0 and parts[0] in store_namespaces:
                            total_pods += 1

        return {
            "healthy": is_healthy,
            "managed_stores": len(store_namespaces),
            "total_pods": total_pods,
            "engine": "k3d/k3s" if is_healthy else "Unknown"
        }
    except Exception as e:
        logger.error(f"Cluster status check failed: {e}")
        return {"healthy": False, "managed_stores": 0, "total_pods": 0, "engine": "Error"}

#  Get Resource Quota usage for a specific namespace
def k8s_get_namespace_quota(namespace: str):
    try:
        # Get the 'store-quota' specifically
        cmd = ["kubectl", "get", "resourcequota", "store-quota", "-n", namespace, "-o", "json"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            status = data.get("status", {})
            hard = status.get("hard", {})
            used = status.get("used", {})
            
            return {
                "cpu_limit": hard.get("limits.cpu"),
                "cpu_used": used.get("limits.cpu"),
                "memory_limit": hard.get("limits.memory"),
                "memory_used": used.get("limits.memory"),
                "pods_limit": hard.get("pods"),
                "pods_used": used.get("pods")
            }
        return None
    except Exception as e:
        logger.error(f"Failed to get quota for {namespace}: {e}")
        return None