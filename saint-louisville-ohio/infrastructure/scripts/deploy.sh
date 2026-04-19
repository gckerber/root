#!/bin/bash
# infrastructure/scripts/deploy.sh
# Bootstrap script for Saint Louisville Ohio Azure infrastructure.
# Uses SWA Standard tier with managed functions — NO App Service quota needed.
#
# Usage: ./infrastructure/scripts/deploy.sh prod YOUR-SUBSCRIPTION-ID

set -euo pipefail

ENVIRONMENT="${1:-prod}"
SUBSCRIPTION_ID="${2:-}"
LOCATION="eastus2"
RESOURCE_GROUP="rg-saintlouisville-${ENVIRONMENT}"

echo "╔══════════════════════════════════════════════════════╗"
echo "║  Saint Louisville Ohio — Azure Bootstrap             ║"
echo "║  Architecture: SWA + Managed Functions (no quota)   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Login check ──────────────────────────────────────────────
if ! az account show &>/dev/null; then
  echo "❌ Not logged in. Run: az login"
  exit 1
fi

if [ -n "$SUBSCRIPTION_ID" ]; then
  az account set --subscription "$SUBSCRIPTION_ID"
fi
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "✅ Subscription: $SUBSCRIPTION_ID"

# ── Register required providers ──────────────────────────────
echo ""
echo "📋 Registering resource providers (skipping if already registered)..."
for ns in Microsoft.Web Microsoft.DocumentDB Microsoft.KeyVault \
           Microsoft.Storage Microsoft.Communication Microsoft.Insights; do
  STATE=$(az provider show --namespace "$ns" --query registrationState -o tsv 2>/dev/null || echo "NotRegistered")
  if [ "$STATE" != "Registered" ]; then
    echo "   Registering $ns..."
    az provider register --namespace "$ns" --wait
  else
    echo "   ✅ $ns already registered"
  fi
done

# ── Deploy Bicep ─────────────────────────────────────────────
echo ""
echo "📦 Deploying infrastructure (SWA Standard + Cosmos + Key Vault + Storage)..."
echo "   This takes 3-5 minutes..."

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

echo "✅ Infrastructure deployed"

# ── Extract outputs ──────────────────────────────────────────
VILLAGE_URL=$(echo "$DEPLOY_OUTPUT" | jq -r '.properties.outputs.villageStaticAppUrl.value // "N/A"')
WATER_URL=$(echo "$DEPLOY_OUTPUT"   | jq -r '.properties.outputs.waterStaticAppUrl.value // "N/A"')
KV_NAME=$(echo "$DEPLOY_OUTPUT"     | jq -r '.properties.outputs.keyVaultName.value // "N/A"')
COSMOS_NAME=$(echo "$DEPLOY_OUTPUT" | jq -r '.properties.outputs.cosmosAccountName.value // "N/A"')
STORAGE_NAME=$(echo "$DEPLOY_OUTPUT"| jq -r '.properties.outputs.storageAccountName.value // "N/A"')

echo ""
echo "📋 Outputs:"
echo "   Village Site: https://$VILLAGE_URL"
echo "   Water Portal: https://$WATER_URL"
echo "   Key Vault:    $KV_NAME"
echo "   Cosmos:       $COSMOS_NAME"
echo "   Storage:      $STORAGE_NAME"

# ── Store secrets in Key Vault ──────────────────────────────
echo ""
echo "🔐 Storing secrets in Key Vault..."

# Cosmos connection string
COSMOS_CONN=$(az cosmosdb keys list \
  --name "$COSMOS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --type connection-strings \
  --query 'connectionStrings[0].connectionString' -o tsv)
az keyvault secret set --vault-name "$KV_NAME" --name "cosmos-connection-string" \
  --value "$COSMOS_CONN" --output none
echo "   ✅ cosmos-connection-string"

# Communication Services connection string
COMM_NAME=$(az communication list --resource-group "$RESOURCE_GROUP" --query '[0].name' -o tsv 2>/dev/null || echo "")
if [ -n "$COMM_NAME" ]; then
  COMM_CONN=$(az communication list-key --name "$COMM_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query 'primaryConnectionString' -o tsv)
  az keyvault secret set --vault-name "$KV_NAME" --name "communication-connection-string" \
    --value "$COMM_CONN" --output none
  echo "   ✅ communication-connection-string"
fi

# SSN encryption key (AES-256 — 32 random bytes as hex)
SSN_KEY=$(openssl rand -hex 32)
az keyvault secret set --vault-name "$KV_NAME" --name "ssn-encryption-key" \
  --value "$SSN_KEY" --output none
echo "   ✅ ssn-encryption-key (generated)"

# Admin API key for content management
ADMIN_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)
az keyvault secret set --vault-name "$KV_NAME" --name "admin-api-key" \
  --value "$ADMIN_KEY" --output none
echo "   ✅ admin-api-key (generated)"

# ── Get SWA deployment tokens ────────────────────────────────
echo ""
echo "🔑 Getting Static Web App deployment tokens..."

VILLAGE_SWA=$(az staticwebapp list --resource-group "$RESOURCE_GROUP" \
  --query "[?contains(name,'village')].name" -o tsv | head -1)
WATER_SWA=$(az staticwebapp list --resource-group "$RESOURCE_GROUP" \
  --query "[?contains(name,'water')].name" -o tsv | head -1)

VILLAGE_TOKEN=$(az staticwebapp secrets list --name "$VILLAGE_SWA" \
  --resource-group "$RESOURCE_GROUP" \
  --query 'properties.apiKey' -o tsv 2>/dev/null || echo "RETRIEVE_MANUALLY")
WATER_TOKEN=$(az staticwebapp secrets list --name "$WATER_SWA" \
  --resource-group "$RESOURCE_GROUP" \
  --query 'properties.apiKey' -o tsv 2>/dev/null || echo "RETRIEVE_MANUALLY")

# ── Print GitHub Secrets ─────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  Add these to GitHub → Settings → Secrets → Actions:            ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "  AZURE_CREDENTIALS          → (JSON from az ad sp create-for-rbac)"
echo "  ADMIN_EMAIL                → $ADMIN_EMAIL"
echo "  CONTACT_EMAIL              → $CONTACT_EMAIL"
echo "  VILLAGE_STATIC_WEB_APP_TOKEN → $VILLAGE_TOKEN"
echo "  WATER_STATIC_WEB_APP_TOKEN   → $WATER_TOKEN"
echo "  VILLAGE_HOSTNAME           → $VILLAGE_URL"
echo "  WATER_HOSTNAME             → $WATER_URL"
echo "  ADMIN_API_KEY              → $ADMIN_KEY"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "To generate AZURE_CREDENTIALS:"
echo "  az ad sp create-for-rbac --name 'saint-louisville-github' \\"
echo "    --role contributor \\"
echo "    --scopes /subscriptions/$SUBSCRIPTION_ID \\"
echo "    --sdk-auth"
echo ""
echo "✅ Bootstrap complete! Push to main to trigger deployment."
