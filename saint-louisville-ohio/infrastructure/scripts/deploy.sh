#!/bin/bash
# infrastructure/scripts/deploy.sh
# Bootstrap script — no jq required, uses only Azure CLI built-in queries.
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
CURRENT_USER_OID=$(az ad signed-in-user show --query id -o tsv 2>/dev/null || echo "")

echo "✅ Subscription : $SUBSCRIPTION_ID"
echo "✅ Logged in as : $(az account show --query user.name -o tsv)"

# ── Install required CLI extensions (non-interactive) ────────
echo ""
echo "📦 Installing required Azure CLI extensions..."
az extension add --name communication --yes 2>/dev/null || true
az extension add --name staticwebapp --yes 2>/dev/null || true
echo "   ✅ Extensions ready"

# ── Register required providers ──────────────────────────────
echo ""
echo "📋 Registering resource providers..."
for ns in Microsoft.Web Microsoft.DocumentDB Microsoft.KeyVault \
           Microsoft.Storage Microsoft.Communication Microsoft.Insights; do
  STATE=$(az provider show --namespace "$ns" --query registrationState -o tsv 2>/dev/null || echo "NotRegistered")
  if [ "$STATE" != "Registered" ]; then
    echo "   Registering $ns (waiting)..."
    az provider register --namespace "$ns" --wait
    echo "   ✅ $ns registered"
  else
    echo "   ✅ $ns already registered"
  fi
done

# ── Deploy Bicep ─────────────────────────────────────────────
echo ""
echo "📦 Deploying infrastructure — this takes 3-5 minutes..."

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@saintlouisvilleohio.gov}"
CONTACT_EMAIL="${CONTACT_EMAIL:-info@saintlouisvilleohio.gov}"
DEPLOY_NAME="slv-${ENVIRONMENT}-$(date +%Y%m%d%H%M%S)"

DEPLOYER_PARAM=""
if [ -n "$CURRENT_USER_OID" ]; then
  DEPLOYER_PARAM="deployerObjectId=$CURRENT_USER_OID"
fi

az deployment sub create \
  --name "$DEPLOY_NAME" \
  --location "$LOCATION" \
  --template-file "infrastructure/main.bicep" \
  --parameters \
    environment="$ENVIRONMENT" \
    location="$LOCATION" \
    adminEmail="$ADMIN_EMAIL" \
    contactEmail="$CONTACT_EMAIL" \
    $DEPLOYER_PARAM \
  --output none

echo "✅ Infrastructure deployed"

# ── Read outputs ─────────────────────────────────────────────
echo ""
echo "📋 Reading deployment outputs..."

VILLAGE_URL=$(az deployment sub show --name "$DEPLOY_NAME" \
  --query "properties.outputs.villageStaticAppUrl.value" -o tsv)
WATER_URL=$(az deployment sub show --name "$DEPLOY_NAME" \
  --query "properties.outputs.waterStaticAppUrl.value" -o tsv)
KV_NAME=$(az deployment sub show --name "$DEPLOY_NAME" \
  --query "properties.outputs.keyVaultName.value" -o tsv)
COSMOS_NAME=$(az deployment sub show --name "$DEPLOY_NAME" \
  --query "properties.outputs.cosmosAccountName.value" -o tsv)
STORAGE_NAME=$(az deployment sub show --name "$DEPLOY_NAME" \
  --query "properties.outputs.storageAccountName.value" -o tsv)

echo "   Village Site : https://$VILLAGE_URL"
echo "   Water Portal : https://$WATER_URL"
echo "   Key Vault    : $KV_NAME"
echo "   Cosmos DB    : $COSMOS_NAME"
echo "   Storage      : $STORAGE_NAME"

# ── Grant deployer Key Vault Secrets Officer (safety net) ────
echo ""
echo "🔑 Ensuring your account can write Key Vault secrets..."

KV_ID=$(az keyvault show \
  --name "$KV_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query id -o tsv)

if [ -n "$CURRENT_USER_OID" ]; then
  az role assignment create \
    --role "b86a8fe4-44ce-4948-aee5-eccb2c155cd7" \
    --assignee-object-id "$CURRENT_USER_OID" \
    --assignee-principal-type User \
    --scope "$KV_ID" \
    --output none 2>/dev/null && echo "   ✅ Key Vault Secrets Officer granted" \
    || echo "   ✅ Role already assigned"
  echo "   ⏳ Waiting 25 seconds for role propagation..."
  sleep 25
fi

# ── Store secrets in Key Vault ───────────────────────────────
echo ""
echo "🔐 Storing secrets in Key Vault..."

COSMOS_CONN=$(az cosmosdb keys list \
  --name "$COSMOS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" -o tsv)

az keyvault secret set --vault-name "$KV_NAME" \
  --name "cosmos-connection-string" --value "$COSMOS_CONN" --output none
echo "   ✅ cosmos-connection-string"

# Communication Services — install extension first, then query
# Use REST API fallback if extension is unavailable
COMM_NAME=$(az resource list \
  --resource-group "$RESOURCE_GROUP" \
  --resource-type "Microsoft.Communication/communicationServices" \
  --query "[0].name" -o tsv 2>/dev/null || echo "")

if [ -n "$COMM_NAME" ] && [ "$COMM_NAME" != "None" ] && [ "$COMM_NAME" != "null" ]; then
  echo "   Found Communication Services: $COMM_NAME"
  # Use REST API to get keys — avoids needing the CLI extension
  COMM_KEYS=$(az rest \
    --method post \
    --url "https://management.azure.com/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Communication/communicationServices/${COMM_NAME}/listKeys?api-version=2023-03-31" \
    --query "primaryConnectionString" -o tsv 2>/dev/null || echo "")

  if [ -n "$COMM_KEYS" ] && [ "$COMM_KEYS" != "None" ]; then
    az keyvault secret set --vault-name "$KV_NAME" \
      --name "communication-connection-string" --value "$COMM_KEYS" --output none
    echo "   ✅ communication-connection-string"
  else
    echo "   ⚠️  Could not retrieve Communication Services key — add manually (see below)"
  fi
else
  echo "   ⚠️  Communication Services not found — add communication-connection-string to Key Vault manually"
fi

# SSN encryption key (AES-256)
SSN_KEY=$(openssl rand -hex 32)
az keyvault secret set --vault-name "$KV_NAME" \
  --name "ssn-encryption-key" --value "$SSN_KEY" --output none
echo "   ✅ ssn-encryption-key (auto-generated)"

# Admin API key
ADMIN_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)
az keyvault secret set --vault-name "$KV_NAME" \
  --name "admin-api-key" --value "$ADMIN_KEY" --output none
echo "   ✅ admin-api-key (auto-generated)"

# ── Get SWA deployment tokens ────────────────────────────────
echo ""
echo "🔑 Getting Static Web App deployment tokens..."

VILLAGE_SWA=$(az staticwebapp list \
  --resource-group "$RESOURCE_GROUP" \
  --query "[?contains(name,'village')].name" -o tsv | head -1)
WATER_SWA=$(az staticwebapp list \
  --resource-group "$RESOURCE_GROUP" \
  --query "[?contains(name,'water')].name" -o tsv | head -1)

VILLAGE_TOKEN="NOT_FOUND"
WATER_TOKEN="NOT_FOUND"

if [ -n "$VILLAGE_SWA" ]; then
  VILLAGE_TOKEN=$(az staticwebapp secrets list \
    --name "$VILLAGE_SWA" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" -o tsv 2>/dev/null || echo "NOT_FOUND")
fi
if [ -n "$WATER_SWA" ]; then
  WATER_TOKEN=$(az staticwebapp secrets list \
    --name "$WATER_SWA" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" -o tsv 2>/dev/null || echo "NOT_FOUND")
fi

# ── If Communication Services key was missing, print manual steps ─
echo ""
if [ -z "$COMM_KEYS" ] || [ "$COMM_KEYS" = "None" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ⚠️  Manual step: Add Communication Services key to Key Vault"
  echo ""
  echo "  1. Go to portal.azure.com → Resource Groups → $RESOURCE_GROUP"
  echo "  2. Click your Communication Services resource"
  echo "  3. Left menu → Keys → copy Primary Connection String"
  echo "  4. Run:"
  echo "     az keyvault secret set \\"
  echo "       --vault-name $KV_NAME \\"
  echo "       --name communication-connection-string \\"
  echo "       --value 'YOUR_CONNECTION_STRING'"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

# ── GitHub Secrets summary ───────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  GitHub → Settings → Secrets → Actions → New repository secret  ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo ""
echo "  ADMIN_EMAIL                  → $ADMIN_EMAIL"
echo "  CONTACT_EMAIL                → $CONTACT_EMAIL"
echo "  VILLAGE_HOSTNAME             → $VILLAGE_URL"
echo "  WATER_HOSTNAME               → $WATER_URL"
echo "  VILLAGE_STATIC_WEB_APP_TOKEN → $VILLAGE_TOKEN"
echo "  WATER_STATIC_WEB_APP_TOKEN   → $WATER_TOKEN"
echo "  ADMIN_API_KEY                → $ADMIN_KEY"
echo "  AZURE_CREDENTIALS            → (generate with command below)"
echo ""
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Generate AZURE_CREDENTIALS (copy the entire JSON output):"
echo ""
echo "  az ad sp create-for-rbac \\"
echo "    --name 'saint-louisville-github' \\"
echo "    --role contributor \\"
echo "    --scopes /subscriptions/$SUBSCRIPTION_ID \\"
echo "    --sdk-auth"
echo ""
echo "✅ Bootstrap complete! Add secrets to GitHub, then push to main."
