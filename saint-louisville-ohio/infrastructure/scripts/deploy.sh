#!/bin/bash
# infrastructure/scripts/deploy.sh
# One-time bootstrap script — run this BEFORE the first GitHub Actions deployment.
# Prerequisites: Azure CLI logged in, Bicep CLI installed, appropriate subscription access.
#
# Usage: ./infrastructure/scripts/deploy.sh [environment] [subscription-id]
# Example: ./infrastructure/scripts/deploy.sh prod xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

set -euo pipefail

ENVIRONMENT="${1:-prod}"
SUBSCRIPTION_ID="${2:-}"
LOCATION="eastus2"
RESOURCE_GROUP="rg-saintlouisville-${ENVIRONMENT}"

echo "╔══════════════════════════════════════════════════════╗"
echo "║  Saint Louisville Ohio — Azure Bootstrap Deploy      ║"
echo "║  Environment: ${ENVIRONMENT}                                 ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Login check ──────────────────────────────────────
if ! az account show &>/dev/null; then
  echo "❌ Not logged in to Azure. Run: az login"
  exit 1
fi

if [ -n "$SUBSCRIPTION_ID" ]; then
  az account set --subscription "$SUBSCRIPTION_ID"
  echo "✅ Using subscription: $SUBSCRIPTION_ID"
else
  SUBSCRIPTION_ID=$(az account show --query id -o tsv)
  echo "✅ Using current subscription: $SUBSCRIPTION_ID"
fi

# ── Step 2: Deploy Bicep ─────────────────────────────────────
echo ""
echo "📦 Deploying infrastructure via Bicep..."

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@saintlouisvilleohio.gov}"
CONTACT_EMAIL="${CONTACT_EMAIL:-info@saintlouisvilleohio.gov}"

DEPLOY_OUTPUT=$(az deployment sub create \
  --name "saint-louisville-${ENVIRONMENT}-$(date +%Y%m%d%H%M%S)" \
  --location "$LOCATION" \
  --template-file "infrastructure/main.bicep" \
  --parameters \
    environment="$ENVIRONMENT" \
    location="$LOCATION" \
    adminEmail="$ADMIN_EMAIL" \
    contactEmail="$CONTACT_EMAIL" \
  --output json)

echo "✅ Bicep deployment complete"

# ── Step 3: Extract outputs ──────────────────────────────────
VILLAGE_URL=$(echo "$DEPLOY_OUTPUT" | jq -r '.properties.outputs.villageStaticAppUrl.value // "N/A"')
WATER_URL=$(echo "$DEPLOY_OUTPUT" | jq -r '.properties.outputs.waterStaticAppUrl.value // "N/A"')
KV_NAME=$(echo "$DEPLOY_OUTPUT" | jq -r '.properties.outputs.keyVaultName.value // "N/A"')
COSMOS_NAME=$(echo "$DEPLOY_OUTPUT" | jq -r '.properties.outputs.cosmosAccountName.value // "N/A"')
STORAGE_NAME=$(echo "$DEPLOY_OUTPUT" | jq -r '.properties.outputs.storageAccountName.value // "N/A"')

echo ""
echo "📋 Deployment Outputs:"
echo "   Village Site URL : https://$VILLAGE_URL"
echo "   Water Portal URL : https://$WATER_URL"
echo "   Key Vault Name   : $KV_NAME"
echo "   Cosmos Account   : $COSMOS_NAME"
echo "   Storage Account  : $STORAGE_NAME"

# ── Step 4: Store secrets in Key Vault ──────────────────────
echo ""
echo "🔐 Storing secrets in Key Vault..."

# Cosmos DB connection string
COSMOS_CONN=$(az cosmosdb keys list \
  --name "$COSMOS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --type connection-strings \
  --query 'connectionStrings[0].connectionString' -o tsv)

az keyvault secret set --vault-name "$KV_NAME" --name "cosmos-connection-string" --value "$COSMOS_CONN" --output none
echo "   ✅ cosmos-connection-string stored"

# Communication Services connection string
COMM_NAME=$(az communication list --resource-group "$RESOURCE_GROUP" --query '[0].name' -o tsv)
COMM_CONN=$(az communication list-key --name "$COMM_NAME" --resource-group "$RESOURCE_GROUP" --query 'primaryConnectionString' -o tsv)
az keyvault secret set --vault-name "$KV_NAME" --name "communication-connection-string" --value "$COMM_CONN" --output none
echo "   ✅ communication-connection-string stored"

# Generate SSN encryption key (32 bytes = 256 bits, stored as hex)
SSN_KEY=$(openssl rand -hex 32)
az keyvault secret set --vault-name "$KV_NAME" --name "ssn-encryption-key" --value "$SSN_KEY" --output none
echo "   ✅ ssn-encryption-key generated and stored"

# Generate admin API key for serverless admin operations
ADMIN_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)
az keyvault secret set --vault-name "$KV_NAME" --name "admin-api-key" --value "$ADMIN_KEY" --output none
echo "   ✅ admin-api-key generated and stored"
echo ""
echo "   ⚠️  IMPORTANT: Copy the admin API key below for GitHub Secrets:"
echo "   ADMIN_API_KEY=$ADMIN_KEY"

# ── Step 5: Get Static Web App deployment tokens ─────────────
echo ""
echo "🔑 Retrieving Static Web App deployment tokens..."

VILLAGE_SWA_NAME="stapp-village-${ENVIRONMENT}-$(echo $SUBSCRIPTION_ID | cut -c1-8)"
WATER_SWA_NAME="stapp-water-${ENVIRONMENT}-$(echo $SUBSCRIPTION_ID | cut -c1-8)"

VILLAGE_TOKEN=$(az staticwebapp secrets list --name "$VILLAGE_SWA_NAME" --resource-group "$RESOURCE_GROUP" --query 'properties.apiKey' -o tsv 2>/dev/null || echo "Run 'az staticwebapp secrets list' manually")
WATER_TOKEN=$(az staticwebapp secrets list --name "$WATER_SWA_NAME" --resource-group "$RESOURCE_GROUP" --query 'properties.apiKey' -o tsv 2>/dev/null || echo "Run 'az staticwebapp secrets list' manually")

# ── Step 6: Print GitHub Secrets setup ──────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  GitHub Secrets — Add these to your repository Settings:    ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  AZURE_CREDENTIALS          → Service principal JSON        ║"
echo "║  UNIQUE_SUFFIX              → $(echo $SUBSCRIPTION_ID | tr -dc 'a-z0-9' | head -c 8)                     ║"
echo "║  ADMIN_EMAIL                → $ADMIN_EMAIL        ║"
echo "║  CONTACT_EMAIL              → $CONTACT_EMAIL        ║"
echo "║  VILLAGE_STATIC_WEB_APP_TOKEN → $VILLAGE_TOKEN"
echo "║  WATER_STATIC_WEB_APP_TOKEN   → $WATER_TOKEN"
echo "║  VILLAGE_HOSTNAME           → $VILLAGE_URL           ║"
echo "║  WATER_HOSTNAME             → $WATER_URL           ║"
echo "║  VILLAGE_API_BASE_URL       → https://func-village-${ENVIRONMENT}-*.azurewebsites.net ║"
echo "║  WATER_API_BASE_URL         → https://func-water-${ENVIRONMENT}-*.azurewebsites.net   ║"
echo "║  AZURE_STORAGE_URL          → https://${STORAGE_NAME}.blob.core.windows.net  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "To generate AZURE_CREDENTIALS, run:"
echo "  az ad sp create-for-rbac --name 'saint-louisville-github' \\"
echo "    --role contributor \\"
echo "    --scopes /subscriptions/$SUBSCRIPTION_ID \\"
echo "    --sdk-auth"
echo ""
echo "✅ Bootstrap complete! Proceed to GitHub Secrets setup."
