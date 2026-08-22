# Disposable Azure French lab deployment

These manifests run two independent processes from one Node 24 image:

- `french-study-mcp`: internal Streamable HTTP MCP endpoint and status monitor.
- `french-ingestion-worker`: Kafka consumer that embeds and indexes lessons.

The MCP service is intentionally `ClusterIP`; access it through `kubectl
port-forward` instead of exposing an unauthenticated tool server publicly.

## Before applying

1. Build and push the image to your ACR.
2. The checked-in manifests currently target the disposable lab registry
   `acrfrenchivanyu20260821.azurecr.io` and image tag `v1`.
3. Attach the ACR to AKS so no registry password is stored in this repository.
4. Create the runtime secret directly from your local ignored env files or
   terminal. Never write its values into a YAML file.

The required secret keys are:

```text
KAFKA_PRODUCER_CONNECTION_STRING
KAFKA_CONSUMER_CONNECTION_STRING
AZURE_SEARCH_ADMIN_KEY
AZURE_OPENAI_API_KEY
```

Apply the config and workloads only after the secret exists:

```bash
kubectl apply -f deploy/k8s/configmap.yaml
kubectl apply -f deploy/k8s/worker.yaml
kubectl apply -f deploy/k8s/mcp.yaml
```

Inspect the rollout and logs:

```bash
kubectl get pods
kubectl logs deployment/french-ingestion-worker --follow
kubectl logs deployment/french-study-mcp --follow
```

Reach MCP locally without creating a public load balancer:

```bash
kubectl port-forward service/french-study-mcp 3001:3001
curl http://localhost:3001/health
```

This lab deliberately uses one replica for the MCP server because ingestion
status is in memory. Durable status storage is the next production improvement.
