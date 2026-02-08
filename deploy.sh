#!/bin/bash

# Configuration - Update these or pass as environment variables
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="personal-execution-mcp"
REGION="us-central1"
REPOSITORY="mcp-servers"
IMAGE_TAG="latest"

IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE_NAME}:${IMAGE_TAG}"

echo "🚀 Starting deployment for ${SERVICE_NAME}..."

# 1. Ensure Artifact Registry repository exists
gcloud artifacts repositories describe ${REPOSITORY} --location=${REGION} > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "📦 Creating Artifact Registry repository..."
    gcloud artifacts repositories create ${REPOSITORY} --repository-format=docker --location=${REGION}
fi

# 2. Build and Push using Cloud Build (No local Docker needed)
echo "🔨 Building image with Cloud Build..."
gcloud builds submit --tag ${IMAGE_URL} .

# 3. Deploy to Cloud Run
echo "🧹 Preparing environment variables..."
ENV_FILE="env.yaml"
# Create a clean YAML file for gcloud
> $ENV_FILE
grep -v '^#' .env | grep '=' | while read -r line; do
    key=$(echo "$line" | cut -d '=' -f 1)
    value=$(echo "$line" | cut -d '=' -f 2-)
    # Properly escape and wrap value in quotes for YAML
    echo "$key: \"$(echo "$value" | sed 's/"/\\"/g')\"" >> $ENV_FILE
done

echo "☁️ Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_URL} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 1 \
    --cpu 1 \
    --memory 512Mi \
    --env-vars-file $ENV_FILE

# Clean up temp file
rm $ENV_FILE

echo "✅ Deployment complete!"
gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format='value(status.url)'
