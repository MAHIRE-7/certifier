# Deployment Guide: Cloudflare Pages, Workers, D1, and R2

This guide documents how to deploy Certifier to Cloudflare's free-tier infrastructure using GitHub Actions or the Wrangler CLI.

---

## 1. Prerequisites

1. A free **Cloudflare Account** ([cloudflare.com](https://dash.cloudflare.com/)).
2. Installed **Node.js 22+** and **Wrangler** (`npm install -g wrangler`).
3. An active GitHub repository with Actions enabled.

---

## 2. Cloudflare Resource Setup

### 2.1 Create D1 SQLite Database
Run in your terminal:
```bash
npx wrangler d1 create certifier_db
```
Output will contain:
```toml
[[d1_databases]]
binding = "DB"
database_name = "certifier_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
Copy `database_id` into `workers/api/wrangler.toml`.

### 2.2 Apply D1 Database Migrations
```bash
npx wrangler d1 execute certifier_db --remote --file=db/migrations/0001_initial_schema.sql
```

### 2.3 Create R2 Storage Bucket
```bash
npx wrangler r2 bucket create certifier-certificates
```

### 2.4 Configure Worker Secrets
Configure your production JWT secret:
```bash
npx wrangler secret put JWT_SECRET
# Enter a secure 32+ character random string when prompted
```

---

## 3. GitHub Actions Secrets Configuration

In your GitHub repository under **Settings > Secrets and variables > Actions**, add the following repository secrets:

| Secret Name | Value Description |
| :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token with Edit Workers, Pages, D1, and R2 permissions. |
| `CLOUDFLARE_ACCOUNT_ID` | Your 32-character Cloudflare Account ID from the Dashboard sidebar. |

---

## 4. Manual Deployment via CLI

### 4.1 Deploy Backend API Worker
```bash
cd workers/api
npx wrangler deploy
```

### 4.2 Build and Deploy Frontend via Cloudflare Pages
```bash
cd apps/web
npm run build
npx wrangler pages deploy dist --project-name=certifier-web
```

---

## 5. Rollback Procedures

- **Cloudflare Workers:** In the Cloudflare dashboard under **Workers & Pages > certifier-api > Deployments**, click **Rollback** on any previous version.
- **Cloudflare Pages:** Under **certifier-web > Deployments**, select any previous build and click **Rollback to this deployment**.
- **Database Backup:** Export D1 data at any time via:
  ```bash
  npx wrangler d1 export certifier_db --remote --output=backup.sql
  ```
