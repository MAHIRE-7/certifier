# Certifier — Verified Certificates & Digital Badges Platform

> **An independent, open-source platform for cryptographically verifiable digital credentials.**
> Built for technical workshops, student communities, and training academies.
> Engineered for free-tier-first deployment on Cloudflare Pages, Workers, D1 (SQLite), and R2.

[![CI](https://github.com/certifier/certifier/actions/workflows/ci.yml/badge.svg)](https://github.com/certifier/certifier/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cryptography: Ed25519](https://img.shields.io/badge/Cryptography-Ed25519%20WebCrypto-emerald.svg)](docs/credential-format.md)

---

## 1. Product Overview

A certificate ID or QR code alone is **never** proof of authenticity. Any attacker can copy an ID or paste a QR code onto an edited graphic.

**Certifier** solves this by establishing mathematical proof of authenticity:
- Every issued certificate and achievement badge is deterministically serialized according to **RFC 8785 JSON Canonicalization Scheme (JCS)** and signed with an **Ed25519** private key.
- Verification occurs in the browser or on the edge using standard Web Crypto without needing user login.
- Any modification to recipient name, issue date, event, or organization results in immediate mathematical signature failure.
- Distinct states are maintained for **Valid**, **Revoked**, **Expired**, and **Invalid/Tampered** credentials.
- Recipient email addresses are kept private and never disclosed over public verification endpoints.
- Server-side landscape A4 PDF certificates with embedded QR codes are generated dynamically.

---

## 2. Architecture Diagram

```
                        ┌───────────────────────────────┐
                        │       Public Verifier         │
                        │  (Scan QR / Visit /verify/:id)│
                        └───────────────┬───────────────┘
                                        │ HTTPS
                                        ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │              Cloudflare Pages (React + TypeScript + Vite SPA)          │
    │  - Public Homepage (/) with real verification search                   │
    │  - Public Verification Detail (/verify/:credentialId)                  │
    │  - Public Issuer Directory (/issuers/:slug)                            │
    │  - Issuer Dashboard (/dashboard/*) with CSV Bulk Import                │
    └───────────────────────────────────┬────────────────────────────────────┘
                                        │ JSON API (/api/v1/*)
                                        ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │                 Cloudflare Workers (Hono REST API)                     │
    │  - Ed25519 WebCrypto Signature Generation & Verification Engine        │
    │  - Deterministic RFC 8785 JSON Canonicalization                        │
    │  - Server-Side Landscape A4 PDF & QR Code Generator (pdf-lib & qrcode) │
    │  - Session Authentication & Organization Tenant Isolation              │
    └─────────────────┬────────────────────────────────────┬─────────────────┘
                      │ SQL Queries                        │ Storage
                      ▼                                    ▼
    ┌───────────────────────────────────┐┌───────────────────────────────────┐
    │          Cloudflare D1            ││          Cloudflare R2            │
    │      (SQLite Relational DB)       ││   (Private Object Storage)        │
    │  - Organizations & Users          ││  - Generated Landscape A4 PDFs    │
    │  - Events & Memberships           ││    with embedded verification QR  │
    │  - Credentials & Signatures       ││  - Public Badge Artwork           │
    │  - Issuer Keys & Audit Trail      ││                                   │
    └───────────────────────────────────┘└───────────────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router v6, Zod.
- **Backend:** Cloudflare Workers, TypeScript, Hono v4.
- **Database:** Cloudflare D1 (SQLite) with versioned migrations (`db/migrations/`).
- **Storage:** Cloudflare R2 for certificate PDFs and badge artwork.
- **Cryptography:** Web Crypto API (`crypto.subtle`) implementing Ed25519 signatures and PBKDF2 password hashing.
- **PDF & QR Generation:** `pdf-lib` and `qrcode` executing server-side.
- **Testing:** Vitest, React Testing Library, native `node:sqlite`.
- **CI/CD:** GitHub Actions workflows for continuous integration and automated deployment.

---

## 4. Quick Start (Local Development)

The repository provides a complete local development environment that runs with **zero cloud dependencies** or paid subscriptions.

### 4.1 Prerequisites
- **Node.js 22+** (Node 22 or 24 recommended, which includes native `node:sqlite`).
- **Git**.

### 4.2 Clone and Install
```bash
git clone https://github.com/certifier/certifier.git
cd certifier
npm install
```

### 4.3 Database Setup & Seed Data
Certifier includes automated migrations and a fictional development seed script:
```bash
# Seed script generates real Ed25519 signatures and hashes for local development
node scratch/generate-seed.mjs
```

### 4.4 Run Frontend & Backend Locally

In one terminal, start the backend dev server (runs on `http://localhost:8787` with SQLite):
```bash
npm run dev:api
```

In a second terminal, start the frontend Vite development server (runs on `http://localhost:5173`):
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 5. Development Credentials & Test Accounts

Certifier is pre-seeded with fictional development accounts and cryptographically verifiable credentials:

### Issuer Admin Login
- **URL:** `http://localhost:5173/login`
- **Email:** `admin@opentech.test`
- **Password:** `DevAdmin123!`
- *(Shortcut button "Fill Demo Credentials" is available directly on the login page)*

### Sample Verification IDs
- `cred_dev_valid_01` — **Active & Valid** (Recipient: Alice Chen, Ed25519 verified)
- `cred_dev_valid_02` — **Active & Valid** (Recipient: Bob Martin, Ed25519 verified)
- `cred_dev_revoked_03` — **Revoked** (Recipient: Charlie Davis, displays revocation reason)
- `cred_dev_expired_04` — **Expired** (Recipient: Diana Prince, expired award)

---

## 6. Running Tests

Certifier features unit, integration, and security test suites validating cryptography, PDF generation, CSV imports, and multi-tenant isolation.

```bash
# Run full Vitest suite
npm run test

# Run TypeScript checks across all workspaces
npm run lint
```

### Test Suite Coverage
- **`tests/unit/crypto.test.ts`:** Ed25519 key generation, RFC 8785 canonicalization, valid signatures, tampered recipient detection, modified issue date rejection, untrusted key rejection, malformed signature handling.
- **`tests/unit/pdf.test.ts`:** Server-side landscape A4 PDF generation with embedded QR codes, dimension verification (842x595 pt), and template engines.
- **`tests/integration/api.test.ts`:** Full E2E flow: registration, login, event creation, CSV bulk issuance, public cryptographic verification, PDF download, credential revocation, database tampering detection, and tenant isolation.

---

## 7. Cloudflare Deployment Guide

For full instructions, refer to [`docs/deployment.md`](docs/deployment.md).

### 7.1 Cloudflare Free-Tier Setup
1. Create a free D1 database:
   ```bash
   npx wrangler d1 create certifier_db
   ```
2. Apply the migration:
   ```bash
   npx wrangler d1 execute certifier_db --remote --file=db/migrations/0001_initial_schema.sql
   ```
3. Create an R2 storage bucket:
   ```bash
   npx wrangler r2 bucket create certifier-certificates
   ```
4. Set JWT secret:
   ```bash
   npx wrangler secret put JWT_SECRET
   ```
5. Deploy API Worker:
   ```bash
   cd workers/api && npx wrangler deploy
   ```
6. Deploy Frontend via Pages:
   ```bash
   cd apps/web && npm run build
   npx wrangler pages deploy dist --project-name=certifier-web
   ```

---

## 8. Free-Plan Quotas & Scaling

| Service | Cloudflare Free Limit | Usage in Certifier |
| :--- | :--- | :--- |
| **Pages** | Unlimited static bandwidth | Optimized bundle (~85 KB gzipped) |
| **Workers** | 100,000 requests/day | Lightweight edge JSON handler |
| **D1** | 5,000,000 reads/day, 100,000 writes/day | Parameterized queries with indexes |
| **R2** | 10 GB storage, 0 egress cost | ~40 KB per vector PDF certificate |

---

## 9. Documentation Index

- [`docs/architecture.md`](docs/architecture.md) — Comprehensive system architecture and data flows.
- [`docs/security.md`](docs/security.md) — Threat model, key protection, tenant isolation, and privacy safeguards.
- [`docs/credential-format.md`](docs/credential-format.md) — RFC 8785 JSON canonicalization and Ed25519 WebCrypto specification.
- [`docs/deployment.md`](docs/deployment.md) — Cloudflare Pages, Workers, D1, and R2 deployment checklist.

---

## 10. License

This project is licensed under the [MIT License](LICENSE).
