#!/usr/bin/env bash
# Deploys the vision worker and the API to Cloud Run so the APK can reach them from anywhere.
#   deploy/gcp.sh            deploy both
#   deploy/gcp.sh api        deploy only the API
# Reads MODEL_API_KEY from .env into Secret Manager; nothing secret goes into the image.
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT=${GCP_PROJECT:-genai-hack-project-nexus}
REGION=${GCP_REGION:-asia-south1}
REPO=$REGION-docker.pkg.dev/$PROJECT/nomi
SECRET=nomi-model-api-key
only=${1:-all}
g() { gcloud --project "$PROJECT" --quiet "$@"; }

g artifacts repositories describe nomi --location "$REGION" >/dev/null 2>&1 ||
  g artifacts repositories create nomi --location "$REGION" --repository-format docker

key=$(grep -E '^MODEL_API_KEY=' .env | cut -d= -f2-)
[ -n "$key" ] || { echo "MODEL_API_KEY is empty in .env"; exit 1; }
if g secrets describe "$SECRET" >/dev/null 2>&1; then
  current=$(g secrets versions access latest --secret "$SECRET")
  [ "$current" = "$key" ] || printf %s "$key" | g secrets versions add "$SECRET" --data-file=-
else
  printf %s "$key" | g secrets create "$SECRET" --data-file=- --replication-policy automatic
fi
runner="$(g projects describe "$PROJECT" --format='value(projectNumber)')-compute@developer.gserviceaccount.com"
g secrets add-iam-policy-binding "$SECRET" --member "serviceAccount:$runner" --role roles/secretmanager.secretAccessor >/dev/null

# Both stay warm (one instance each) so a judge never waits on a cold start. The API keeps tap-to-fix
# sessions in memory, so it runs as a single instance.
if [ "$only" != api ]; then
  g builds submit services/vision-worker --tag "$REPO/vision-worker"
  # Private: only the API's service account may call it.
  g run deploy nomi-vision --image "$REPO/vision-worker" --region "$REGION" --no-allow-unauthenticated \
    --memory 2Gi --cpu 2 --min-instances 1 --max-instances 3
  g run services add-iam-policy-binding nomi-vision --region "$REGION" --member "serviceAccount:$runner" --role roles/run.invoker >/dev/null
fi
worker=$(g run services describe nomi-vision --region "$REGION" --format 'value(status.url)')

g builds submit . --config deploy/cloudbuild-api.yaml --substitutions "_IMAGE=$REPO/api"
# Public, because the app calls it with no sign-in; the routes rate limit per device.
g run deploy nomi-api --image "$REPO/api" --region "$REGION" --allow-unauthenticated \
  --memory 1Gi --cpu 1 --min-instances 1 --max-instances 1 --concurrency 80 --timeout 300 \
  --set-env-vars "VISION_WORKER_URL=$worker,MODEL_BASE_URL=https://api.meta.ai/v1" \
  --set-secrets "MODEL_API_KEY=$SECRET:latest"

echo "API: $(g run services describe nomi-api --region "$REGION" --format 'value(status.url)')"
