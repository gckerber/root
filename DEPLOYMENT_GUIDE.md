# Saint Louisville Ohio — Complete Deployment & Management Guide

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [First-Time Azure Setup](#2-first-time-azure-setup)
3. [Connect GitHub to Azure](#3-connect-github-to-azure)
4. [GitHub Secrets Reference](#4-github-secrets-reference)
5. [First Deployment](#5-first-deployment)
6. [Custom Domain Setup](#6-custom-domain-setup)
7. [Ongoing Deployments (CI/CD)](#7-ongoing-deployments-cicd)
8. [Admin Guide — Managing Content](#8-admin-guide--managing-content)
9. [Water Portal — Account Data Setup](#9-water-portal--account-data-setup)
10. [Monitoring & Troubleshooting](#10-monitoring--troubleshooting)
11. [Cost Estimate](#11-cost-estimate)

---

## 1. Prerequisites

Install these tools on your machine before starting:

| Tool | Install | Purpose |
|------|---------|---------|
| Azure CLI | https://learn.microsoft.com/en-us/cli/azure/install-azure-cli | Deploy infrastructure |
| Bicep CLI | `az bicep install` | IaC templates |
| Node.js 18+ | https://nodejs.org | Build frontend & functions |
| Azure Functions Core Tools v4 | `npm install -g azure-functions-core-tools@4` | Local function testing |
| Git | https://git-scm.com | Source control |

You will also need:
- An **Azure Subscription** (free tier is sufficient to start)
- A **GitHub account** with a repository for this project

---

## 2. First-Time Azure Setup

### 2a. Login to Azure
```bash
az login
az account show   # Confirm you're on the right subscription
```

### 2b. Run the Bootstrap Script
From the root of the repository:
```bash
chmod +x infrastructure/scripts/deploy.sh
./infrastructure/scripts/deploy.sh prod YOUR-SUBSCRIPTION-ID
```

This script will:
- Deploy all Azure resources via Bicep
- Store all secrets in Key Vault automatically
- Generate the SSN encryption key and admin API key
- Print all values you need for GitHub Secrets

> **⚠️ Important:** Copy the `ADMIN_API_KEY` printed at the end — you need it for GitHub Secrets and for admin API calls.

### 2c. Create the Azure Service Principal (for GitHub Actions)
```bash
az ad sp create-for-rbac \
  --name "saint-louisville-github-actions" \
  --role contributor \
  --scopes /subscriptions/YOUR-SUBSCRIPTION-ID \
  --sdk-auth
```
Copy the entire JSON output — this is your `AZURE_CREDENTIALS` secret.

---

## 3. Connect GitHub to Azure

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each secret below

---

## 4. GitHub Secrets Reference

Add every secret listed here. None are optional.

| Secret Name | How to Get It | Example Value |
|-------------|---------------|---------------|
| `AZURE_CREDENTIALS` | Output of `az ad sp create-for-rbac --sdk-auth` | `{"clientId":"...","clientSecret":"...",...}` |
| `UNIQUE_SUFFIX` | First 8 chars of your subscription ID (lowercase, alphanumeric only) | `a1b2c3d4` |
| `ADMIN_EMAIL` | Village admin email | `admin@saintlouisvilleohio.gov` |
| `CONTACT_EMAIL` | Contact form recipient | `info@saintlouisvilleohio.gov` |
| `VILLAGE_STATIC_WEB_APP_TOKEN` | `az staticwebapp secrets list --name stapp-village-prod-SUFFIX --resource-group rg-saintlouisville-prod --query 'properties.apiKey' -o tsv` | Long token string |
| `WATER_STATIC_WEB_APP_TOKEN` | Same as above for water app | Long token string |
| `VILLAGE_HOSTNAME` | From bootstrap output or Azure Portal | `agreeable-forest-xxx.azurestaticapps.net` |
| `WATER_HOSTNAME` | Same for water app | `wonderful-ocean-xxx.azurestaticapps.net` |
| `VILLAGE_API_BASE_URL` | Function App URL from Azure Portal | `https://func-village-prod-xxx.azurewebsites.net` |
| `WATER_API_BASE_URL` | Same for water function app | `https://func-water-prod-xxx.azurewebsites.net` |
| `AZURE_STORAGE_URL` | Storage account blob endpoint from Portal | `https://stslvprodxxxxxxxx.blob.core.windows.net` |
| `ADMIN_API_KEY` | Printed by bootstrap script | `aB3dEfGhI4jKlMnOpQ5rSt...` |

---

## 5. First Deployment

After setting all GitHub Secrets:

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

This triggers both GitHub Actions workflows automatically. Monitor progress at:
**GitHub → Actions tab → Deploy Village Site / Deploy Water Portal**

Expected deploy time: 8–12 minutes for a full build.

---

## 6. Custom Domain Setup

### In Azure Portal:
1. Go to your Static Web App → **Custom domains**
2. Click **+ Add** → Enter your domain (e.g., `saintlouisvilleohio.gov`)
3. Follow the DNS validation instructions

### DNS Records to Add (at your domain registrar):
```
Type: CNAME
Name: www
Value: agreeable-forest-xxx.azurestaticapps.net

Type: TXT
Name: _dnsauth
Value: (provided by Azure during setup)
```

For apex domains (`saintlouisvilleohio.gov` without www), use an **A record** pointing to Azure's IP or configure with your registrar's ALIAS record support.

Azure Static Web Apps provision a free SSL certificate automatically once DNS is verified.

---

## 7. Ongoing Deployments (CI/CD)

Every `git push` to `main` automatically:
1. Lints the code
2. Deploys infrastructure changes (Bicep is idempotent — safe to re-run)
3. Builds and deploys the frontend
4. Deploys the Azure Functions
5. Runs a smoke test

To deploy only one site, push changes only in that site's path — the workflow `paths` filter will skip unaffected sites.

**To roll back**, go to GitHub Actions → find the last successful run → click **Re-run jobs**.

---

## 8. Admin Guide — Managing Content

### Adding Council Meeting Minutes

#### Method A — GitHub (recommended for tech-savvy admins)

1. **Upload the PDF** to Azure Blob Storage:
   ```bash
   az storage blob upload \
     --account-name YOUR_STORAGE_ACCOUNT \
     --container-name minutes \
     --name "2024/2024-06-15-minutes.pdf" \
     --file /path/to/minutes.pdf \
     --auth-mode login
   ```
   This gives you a public URL:
   `https://YOUR_STORAGE.blob.core.windows.net/minutes/2024/2024-06-15-minutes.pdf`

2. **Add the metadata record** by calling the API:
   ```bash
   curl -X POST https://YOUR_VILLAGE_API/api/minutes \
     -H "Content-Type: application/json" \
     -H "x-admin-key: YOUR_ADMIN_API_KEY" \
     -d '{
       "meetingDate": "2024-06-15T19:00:00",
       "type": "Regular Session",
       "approved": true,
       "fileUrl": "https://YOUR_STORAGE.blob.core.windows.net/minutes/2024/2024-06-15-minutes.pdf",
       "fileSize": 245000
     }'
   ```

#### Method B — Azure Portal (no command line required)

1. Go to **Azure Portal** → Storage Account → **Containers** → `minutes`
2. Click **Upload** and select your PDF file
3. After upload, right-click the file → **Generate SAS** (or use the public blob URL)
4. Use the URL in your API call or a REST client like Insomnia/Postman

#### Method C — Azure Storage Explorer (GUI desktop app)

Download **Azure Storage Explorer** (free from Microsoft), connect to your storage account, and drag-and-drop PDF files into the `minutes` container.

---

### Adding Bulletin Board Announcements

```bash
curl -X POST https://YOUR_VILLAGE_API/api/bulletin \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_API_KEY" \
  -d '{
    "title": "Road Closure — Elm Street",
    "body": "Elm Street between Oak Ave and Pine St will be closed for utility work from June 20–22.",
    "category": "notice",
    "pinned": false
  }'
```

**Categories:** `notice`, `event`, `urgent`, `general`

Set `"pinned": true` to keep an announcement at the top of the list.

---

### Adding Ordinances

```bash
curl -X POST https://YOUR_VILLAGE_API/api/ordinances \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_API_KEY" \
  -d '{
    "number": "ORD-2024-007",
    "title": "Short-Term Rental Registration Requirements",
    "category": "zoning",
    "summary": "Establishes registration requirements for short-term rental properties within village limits.",
    "year": 2024,
    "fileUrl": "https://YOUR_STORAGE.blob.core.windows.net/ordinances/ORD-2024-007.pdf"
  }'
```

**Categories:** `zoning`, `general`, `traffic`, `health`, `utilities`

---

### Uploading Historical Photos

Upload photos to the `photos` blob container:
```bash
az storage blob upload \
  --account-name YOUR_STORAGE_ACCOUNT \
  --container-name photos \
  --name "1955-harvest-festival.jpg" \
  --file /path/to/photo.jpg \
  --auth-mode login
```

Then add the metadata via API or directly in Cosmos DB Explorer in the Azure Portal.

---

## 9. Water Portal — Account Data Setup

### Importing Resident Accounts

Resident water accounts must be imported into Cosmos DB. The SSN field must be stored **encrypted**. Use the provided seed script or import via the API.

**Sample account record structure in Cosmos DB (`waterdb/accounts`):**
```json
{
  "id": "uuid-here",
  "accountNumber": "SLV-2024-00001",
  "name": "Jane Smith",
  "address": "123 Main Street, Saint Louisville, OH 43071",
  "email": "jane.smith@email.com",
  "balance": 45.50,
  "status": "current",
  "dueDate": "2024-07-15",
  "meterReading": "4521 gal",
  "ssnEncrypted": "ENCRYPTED_VALUE_HERE",
  "lastPayment": {
    "amount": 42.00,
    "date": "2024-06-15T00:00:00Z"
  }
}
```

> **⚠️ SSN Encryption:** Never import raw SSNs. Use the encryption utility in `functions/water-api/lookup/index.js` to encrypt SSNs before storage. Contact your Tech Czar for the import tool.

---

## 10. Monitoring & Troubleshooting

### View Live Logs
```bash
# Village API logs
az webapp log tail --name func-village-prod-SUFFIX --resource-group rg-saintlouisville-prod

# Water API logs
az webapp log tail --name func-water-prod-SUFFIX --resource-group rg-saintlouisville-prod
```

### Azure Application Insights
Go to Azure Portal → Application Insights → your instance → **Live Metrics** to see real-time requests, failures, and performance.

### Common Issues

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| API returns 500 | Key Vault not accessible | Check Managed Identity has `Key Vault Secrets User` role |
| Contact form fails | Communication Services not configured | Verify `communication-connection-string` secret in Key Vault |
| SSN lookup fails | Encryption key mismatch | Verify `ssn-encryption-key` in Key Vault matches what was used to encrypt |
| Site shows blank page | Build failed | Check GitHub Actions logs for build errors |
| CORS errors | Function app CORS not set | Verify CORS settings in Function App → Configuration → CORS |

---

## 11. Cost Estimate

All services use free or serverless tiers. Estimated monthly cost for a low-traffic village site:

| Service | Tier | Estimated Cost |
|---------|------|---------------|
| Azure Static Web Apps (×2) | Free | $0.00 |
| Azure Functions (×2) | Consumption (first 1M executions free) | ~$0.00 |
| Azure Cosmos DB | Free tier + Serverless | ~$0.00–$2.00 |
| Azure Blob Storage | LRS, ~1 GB | ~$0.02 |
| Azure Key Vault | Standard (~1,000 operations) | ~$0.03 |
| Azure Communication Services | First 100 emails/month free | ~$0.00 |
| Application Insights | First 5 GB/month free | $0.00 |
| **Total** | | **~$0–$5/month** |

> Costs will remain near zero as long as the site stays under Azure's free tier limits, which is expected for a small village.

---

*Guide maintained by George Kerber, Tech Czar — Village of Saint Louisville, Ohio*
*Last updated: 2025*
