# Certifier Platform Architecture

## 1. System Overview

Certifier is an independent, open-source platform for cryptographically verifiable digital certificates and achievement badges designed for technical workshops, academies, and community events.

The platform provides tamper-evident proof of credentials through Ed25519 digital signatures. A certificate ID or QR code alone is never accepted as proof of authenticity without mathematical verification of the underlying claims.

```
   ┌─────────────────────────────────────────────────────────────┐
   │                    Public Verifiers                         │
   │  (Scan QR Code or visit /verify/:credentialId - No Login)   │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ HTTPS GET
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │             Cloudflare Pages (React + Vite SPA)             │
   │      - /: Public Homepage & Instant Verification Search     │
   │      - /verify/:id: Authoritative Verification Result       │
   │      - /issuers/:slug: Public Issuer Directory Profile      │
   │      - /dashboard/*: Authenticated Issuer Workflows         │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ JSON API (/api/v1/*)
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │             Cloudflare Workers (Hono Router)                │
   │  - Ed25519 WebCrypto Signature Engine                       │
   │  - RFC 8785 JSON Canonicalization (Deterministic Payload)   │
   │  - Server-Side Landscape A4 PDF & QR Code Generator         │
   │  - Role-based Session & Tenant Isolation Middleware         │
   └───────────────┬─────────────────────────────┬───────────────┘
                   │ SQL Queries                 │ Object Read/Write
                   ▼                             ▼
   ┌─────────────────────────────┐ ┌─────────────────────────────┐
   │      Cloudflare D1          │ │      Cloudflare R2          │
   │  (SQLite Relational DB)     │ │  (Certificate PDF Storage)  │
   │  - Organizations & Users    │ │  - Generated Landscape A4   │
   │  - Events & Memberships     │ │    PDFs with embedded QR    │
   │  - Issued Credentials       │ │    matrix                   │
   │  - Signatures & Audit Logs  │ └─────────────────────────────┘
   │  - Issuer Public Key Reg    │
   └─────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Frontend (`apps/web`)
- **Framework:** React 18 with TypeScript and Vite.
- **Styling:** Tailwind CSS with accessible color tokens and responsive layouts.
- **Routing:** React Router v6.
- **Icons:** Lucide React icons.
- **Responsibilities:**
  - Public verification search and detailed cryptographic report.
  - Issuer registration, login, and session persistence.
  - Workshop creation and CSV recipient import preview with real-time error detection.
  - Credential revocation workflows with mandatory documented justification.
  - Digital badge creation and issuance.
  - Public issuer profile and public key discovery table.

### 2.2 API Worker (`workers/api`)
- **Framework:** Hono router compiled to Cloudflare Workers runtime.
- **Standard APIs:** Web Crypto API (`crypto.subtle`) for Ed25519 signatures, PBKDF2 password hashing, and HMAC-SHA256 session tokens.
- **Database Abstraction:** Cloudflare D1 client with transparent local `node:sqlite` adapter for testing and offline development.
- **Storage:** Cloudflare R2 bucket with in-memory fallback for local development.

### 2.3 Shared Packages (`packages/*`)
- **`@certifier/credential-schema`:** Shared TypeScript types, Zod schemas, RFC 8785 JSON canonicalization, and SHA-256 payload digest utilities.
- **`@certifier/signing`:** Ed25519 key generation, SPKI/PKCS#8 export/import, deterministic signing, and signature verification via standard Web Crypto API.
- **`@certifier/pdf`:** Landscape A4 PDF certificate generator using `pdf-lib` and `qrcode`.

---

## 3. Free-Tier-First Architecture & Quotas

Certifier was engineered specifically to run within Cloudflare's published free tiers:

| Component | Free Plan Quota | Certifier Resource Usage |
| :--- | :--- | :--- |
| **Cloudflare Pages** | Unlimited static requests, 500 builds/month | Static client bundle (~85 KB gzipped) |
| **Cloudflare Workers** | 100,000 requests / day | Sub-15ms edge compute per verification |
| **Cloudflare D1** | 5M row reads/day, 100,000 row writes/day, 5 GB storage | Indexed single-row reads, bulk batch inserts |
| **Cloudflare R2** | 10 GB storage, 1M Class A operations/month, 10M Class B operations/month | ~40 KB per generated PDF certificate |
| **Egress Fees** | $0 (No egress fees on Cloudflare R2 / Pages / Workers) | Egress completely free on Cloudflare network |

### Scaling Constraints
- For batches exceeding 200 participants, issuance can be divided into chunks or processed asynchronously using Cloudflare Queues or scheduled Workers.
- The default synchronous implementation comfortably processes batches of 50-100 participants per HTTP request within Cloudflare Worker's 30-second CPU time limits.
