# Village of Saint Louisville, Ohio — Official Web Presence

This repository contains the complete source code, infrastructure, and deployment configuration for the two official Village of Saint Louisville websites.

## Sites

| Site | Purpose | URL |
|------|---------|-----|
| **Village Site** | Village information, council minutes, ordinances, bulletin board, calendar, history | `saintlouisvilleohio.gov` |
| **Water Portal** | Resident water bill lookup and secure online payment | `water.saintlouisvilleohio.gov` |

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Azure Functions (Node.js 18, serverless)
- **Database:** Azure Cosmos DB (free tier + serverless)
- **Hosting:** Azure Static Web Apps (free tier)
- **Security:** Azure Key Vault + Managed Identity (zero hardcoded credentials)
- **Email:** Azure Communication Services
- **CI/CD:** GitHub Actions + Azure Bicep (IaC)

## Repository Structure

```
saint-louisville-ohio/
├── .github/workflows/     # GitHub Actions CI/CD pipelines
├── infrastructure/        # Azure Bicep IaC templates
│   ├── main.bicep
│   ├── modules/
│   └── scripts/deploy.sh  # One-time bootstrap
├── apps/
│   ├── village-site/      # Site 1 — React frontend
│   └── water-portal/      # Site 2 — React frontend
├── functions/
│   ├── village-api/       # Azure Functions for village site
│   └── water-api/         # Azure Functions for water portal
└── docs/
    └── DEPLOYMENT_GUIDE.md
```

## Quick Start

See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) for the complete setup guide.

```bash
# 1. Bootstrap Azure infrastructure (one time)
./infrastructure/scripts/deploy.sh prod YOUR-SUBSCRIPTION-ID

# 2. Add GitHub Secrets (see DEPLOYMENT_GUIDE.md §4)

# 3. Push to main to deploy
git push origin main
```

## Security

- SSNs are encrypted at rest using AES-256 with keys stored in Azure Key Vault
- All secrets accessed via Managed Identity — no hardcoded credentials anywhere
- HTTPS enforced everywhere with security headers (HSTS, CSP, X-Frame-Options)
- SSNs are masked in all UI responses: `***-**-1234`
- Rate limiting on all public-facing API endpoints

## Officials

- **Mayor:** Dave Allen
- **Village Council:** 5 members (see About page)
- **Tech Czar:** George Kerber

---
*Village of Saint Louisville, Ohio · Licking County · Est. 1833*
