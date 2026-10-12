# Security & Trust Model

## 1. Threat Model

Certifier is designed to protect credential integrity against specific attack vectors:

| Attack Vector | Threat Description | Mitigation Strategy |
| :--- | :--- | :--- |
| **Claim Tampering** | An attacker edits the recipient name, issue date, or title on a certificate. | Alteration alters the SHA-256 payload digest. The Ed25519 signature fails verification instantly. |
| **Key Impersonation** | An untrusted actor signs fraudulent credentials with their own key and claims an approved organization issued it. | The verifier never trusts public keys supplied in credential requests. The verifier resolves public keys strictly from the authoritative issuer registry. |
| **Private Key Exposure** | Leakage of private keys via frontend bundles or repositories. | Keys are generated server-side. Private keys never leave the server-side environment. Zero secrets are committed to Git. |
| **Cross-Tenant Access** | Organization A attempts to view, revoke, or issue credentials under Organization B. | Server-side authorization enforces strict organization scoping on all write and read queries. Role and organization IDs are verified via server-side session tokens. |
| **Recipient Deanonymization** | An attacker scrapes public endpoints to harvest participant emails. | Recipient email addresses are strictly excluded from signed payloads, public verification responses, and public issuer directory listings. |
| **SQL Injection** | Malicious input in search or import strings. | 100% of database interactions use parameterized SQL statements (`db.prepare(...).bind(...)`). |
| **XSS via Template Strings** | Malicious script payloads injected into recipient names or titles. | Strict escaping in React JSX output and PDF text layout. Content-Security-Policy headers block inline scripts. |

---

## 2. Key Protection Principles

1. **Server-Side Key Generation:**
   - Keys are created using `crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])`.
   - Client-side key generation is strictly forbidden.
2. **Residual Risk in Free-Tier MVP:**
   - In the free-tier Cloudflare MVP, private keys are stored encrypted in the database or Cloudflare Worker Secrets.
   - For enterprise production deployments requiring hardware isolation, integrate with Cloudflare Key Management or AWS KMS/CloudHSM.
3. **Key Rotation & Compromise:**
   - When an issuer rotates their key, historical public keys remain active with a `valid_from` / `valid_until` timestamp so historical credentials remain verifiable.
   - If a key is compromised, administrators update the key status to `compromised` or `revoked`, immediately invalidating subsequent verification checks.

---

## 3. Revocation and Expiration Semantics

- **Authoritative Status Checks:** A cryptographic signature proves data authenticity at the time of issuance, but cannot reflect later administrative actions on its own.
- **Authoritative Registry:** Public verification checks the authoritative database status alongside cryptographic validity:
  1. If status is `revoked`, the system returns `status: "revoked"`, displays the documented revocation reason, and disables PDF download.
  2. If the current timestamp exceeds `expires_at`, the system returns `status: "expired"`.
  3. If payload claims do not match the cryptographic signature, the system returns `status: "invalid_signature"`.
  4. Only credentials that pass signature verification, match approved issuer keys, are unexpired, and remain unrevoked receive the `status: "valid"` rating.

---

## 4. Privacy & Personal Data Handling

- **Recipient Email Privacy:** The recipient's email is stored only in the `recipient_email_private` column for the issuer's event coordination. It is omitted from the public verification payload, the PDF file, and the public API.
- **Audit Logging:** Administrative operations (login, logout, event creation, bulk issuance, and revocation) are written to `audit_events` with timestamp, actor user ID, target ID, and mandatory reasons.
