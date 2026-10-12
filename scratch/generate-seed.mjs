import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';

async function generate() {
  // Generate Ed25519 key pair
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  );

  const spkiBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8Buffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const spkiBase64 = Buffer.from(spkiBuffer).toString('base64');
  const pkcs8Base64 = Buffer.from(pkcs8Buffer).toString('base64');

  // Password hash for 'DevAdmin123!'
  async function hashPassword(pwd) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(pwd),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2:100000:${saltHex}:${hashHex}`;
  }

  const adminHash = await hashPassword('DevAdmin123!');
  const issuerHash = await hashPassword('DevIssuer123!');

  // Canonicalize helper
  function canonicalize(obj) {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map(canonicalize).join(',')}]`;
    const keys = Object.keys(obj).sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
  }

  async function digest(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function sign(payload) {
    const cStr = canonicalize(payload);
    const dig = await digest(cStr);
    const sigBuf = await crypto.subtle.sign('Ed25519', keyPair.privateKey, new TextEncoder().encode(cStr));
    const sigHex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return { cStr, dig, sigHex };
  }

  const keyId = 'key_opentech_2026';
  const orgSlug = 'opentech';

  // Seed Credential 1: Valid
  const payload1 = {
    id: 'cred_dev_valid_01',
    schema_version: '1.0.0',
    credential_type: 'certificate',
    issuer_id: orgSlug,
    issuer_key_id: keyId,
    recipient: { name: 'Alice Chen' },
    title: 'Certified Systems Architect',
    event_or_achievement: 'Modern Distributed Systems & WebAssembly Workshop',
    issued_at: '2026-03-15T10:00:00.000Z',
    expires_at: null,
    revocation_uri: 'https://certifier.platform.test/api/v1/verify/cred_dev_valid_01',
    signature_algorithm: 'Ed25519'
  };
  const s1 = await sign(payload1);

  // Seed Credential 2: Valid
  const payload2 = {
    id: 'cred_dev_valid_02',
    schema_version: '1.0.0',
    credential_type: 'certificate',
    issuer_id: orgSlug,
    issuer_key_id: keyId,
    recipient: { name: 'Bob Martin' },
    title: 'Certified Systems Architect',
    event_or_achievement: 'Modern Distributed Systems & WebAssembly Workshop',
    issued_at: '2026-03-15T10:00:00.000Z',
    expires_at: null,
    revocation_uri: 'https://certifier.platform.test/api/v1/verify/cred_dev_valid_02',
    signature_algorithm: 'Ed25519'
  };
  const s2 = await sign(payload2);

  // Seed Credential 3: Revoked
  const payload3 = {
    id: 'cred_dev_revoked_03',
    schema_version: '1.0.0',
    credential_type: 'certificate',
    issuer_id: orgSlug,
    issuer_key_id: keyId,
    recipient: { name: 'Charlie Davis' },
    title: 'Certified Systems Architect',
    event_or_achievement: 'Modern Distributed Systems & WebAssembly Workshop',
    issued_at: '2026-03-15T10:00:00.000Z',
    expires_at: null,
    revocation_uri: 'https://certifier.platform.test/api/v1/verify/cred_dev_revoked_03',
    signature_algorithm: 'Ed25519'
  };
  const s3 = await sign(payload3);

  // Seed Credential 4: Expired
  const payload4 = {
    id: 'cred_dev_expired_04',
    schema_version: '1.0.0',
    credential_type: 'certificate',
    issuer_id: orgSlug,
    issuer_key_id: keyId,
    recipient: { name: 'Diana Prince' },
    title: 'Certified Systems Architect',
    event_or_achievement: 'Modern Distributed Systems & WebAssembly Workshop',
    issued_at: '2024-01-01T10:00:00.000Z',
    expires_at: '2025-01-01T10:00:00.000Z',
    revocation_uri: 'https://certifier.platform.test/api/v1/verify/cred_dev_expired_04',
    signature_algorithm: 'Ed25519'
  };
  const s4 = await sign(payload4);

  const seedSql = `-- =====================================================================
-- Seed Data for Local Development & Testing
-- Fictional Organization and Verifiable Credentials
-- =====================================================================

-- 1. Fictional Organization
INSERT OR IGNORE INTO organizations (id, name, slug, description, logo_key, approval_status, created_at, updated_at)
VALUES (
  'org_opentech_dev',
  'OpenTech Foundation',
  'opentech',
  'Fictional open-source engineering community for developer credential testing.',
  '',
  'approved',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);

-- 2. Fictional Users (Passwords: DevAdmin123! / DevIssuer123!)
INSERT OR IGNORE INTO users (id, auth_subject, email, display_name, password_hash, status, created_at)
VALUES (
  'usr_admin_dev',
  'local:usr_admin_dev',
  'admin@opentech.test',
  'Alex Rivera (Admin)',
  '${adminHash}',
  'active',
  '2026-01-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO users (id, auth_subject, email, display_name, password_hash, status, created_at)
VALUES (
  'usr_issuer_dev',
  'local:usr_issuer_dev',
  'issuer@opentech.test',
  'Sarah Connor (Issuer)',
  '${issuerHash}',
  'active',
  '2026-01-01T00:00:00.000Z'
);

-- 3. Memberships
INSERT OR IGNORE INTO memberships (id, organization_id, user_id, role, created_at)
VALUES (
  'mem_admin_dev',
  'org_opentech_dev',
  'usr_admin_dev',
  'organization_admin',
  '2026-01-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO memberships (id, organization_id, user_id, role, created_at)
VALUES (
  'mem_issuer_dev',
  'org_opentech_dev',
  'usr_issuer_dev',
  'issuer',
  '2026-01-01T00:00:00.000Z'
);

-- 4. Issuer Signing Key (Ed25519)
INSERT OR IGNORE INTO issuer_keys (id, organization_id, public_key, private_key_encrypted, key_algorithm, key_status, valid_from, created_at)
VALUES (
  '${keyId}',
  'org_opentech_dev',
  '${spkiBase64}',
  '${pkcs8Base64}',
  'Ed25519',
  'active',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);

-- 5. Workshop Event
INSERT OR IGNORE INTO events (id, organization_id, title, description, event_type, start_date, end_date, status, created_at, updated_at)
VALUES (
  'evt_workshop_2026',
  'org_opentech_dev',
  'Modern Distributed Systems & WebAssembly Workshop',
  'Hands-on technical workshop covering cloudflare workers, rust, and cryptographic verification.',
  'workshop',
  '2026-03-10T09:00:00.000Z',
  '2026-03-15T18:00:00.000Z',
  'active',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);

-- 6. Credential Templates
INSERT OR IGNORE INTO credential_templates (id, organization_id, name, template_type, configuration_json, status, created_at, updated_at)
VALUES (
  'tmpl_modern_tech_01',
  'org_opentech_dev',
  'Modern Technology Workshop Template',
  'modern_tech',
  '{}',
  'active',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO credential_templates (id, organization_id, name, template_type, configuration_json, status, created_at, updated_at)
VALUES (
  'tmpl_minimal_achieve_02',
  'org_opentech_dev',
  'Minimal Professional Achievement Template',
  'minimal_achievement',
  '{}',
  'active',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);

-- 7. Badge Definition
INSERT OR IGNORE INTO badge_definitions (id, organization_id, name, description, criteria, image_object_key, status, created_at, updated_at)
VALUES (
  'bdg_wasm_specialist',
  'org_opentech_dev',
  'Rust & WebAssembly Specialist',
  'Demonstrated proficiency in building secure, deterministic WebAssembly modules and cloud edge workers.',
  'Complete 3 real-world lab assignments and pass the cryptographic verification challenge.',
  '',
  'active',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);

-- 8. Development Credentials
-- Credential 1: Valid
INSERT OR IGNORE INTO credentials (
  id, organization_id, event_id, recipient_name, recipient_email_private,
  credential_type, title, issued_at, expires_at, status, pdf_object_key,
  payload_json, payload_digest, issuer_key_id, created_by, created_at, updated_at
) VALUES (
  'cred_dev_valid_01',
  'org_opentech_dev',
  'evt_workshop_2026',
  'Alice Chen',
  'alice.chen@example.com',
  'certificate',
  'Certified Systems Architect',
  '2026-03-15T10:00:00.000Z',
  NULL,
  'active',
  'certificates/cred_dev_valid_01.pdf',
  '${s1.cStr.replace(/'/g, "''")}',
  '${s1.dig}',
  '${keyId}',
  'usr_admin_dev',
  '2026-03-15T10:00:00.000Z',
  '2026-03-15T10:00:00.000Z'
);

INSERT OR IGNORE INTO credential_signatures (
  id, credential_id, signature_algorithm, issuer_key_id,
  signature_value, signature_format, signed_payload_digest, created_at
) VALUES (
  'sig_dev_01',
  'cred_dev_valid_01',
  'Ed25519',
  '${keyId}',
  '${s1.sigHex}',
  'raw_ed25519_hex',
  '${s1.dig}',
  '2026-03-15T10:00:00.000Z'
);

-- Credential 2: Valid
INSERT OR IGNORE INTO credentials (
  id, organization_id, event_id, recipient_name, recipient_email_private,
  credential_type, title, issued_at, expires_at, status, pdf_object_key,
  payload_json, payload_digest, issuer_key_id, created_by, created_at, updated_at
) VALUES (
  'cred_dev_valid_02',
  'org_opentech_dev',
  'evt_workshop_2026',
  'Bob Martin',
  'bob.martin@example.com',
  'certificate',
  'Certified Systems Architect',
  '2026-03-15T10:00:00.000Z',
  NULL,
  'active',
  'certificates/cred_dev_valid_02.pdf',
  '${s2.cStr.replace(/'/g, "''")}',
  '${s2.dig}',
  '${keyId}',
  'usr_admin_dev',
  '2026-03-15T10:00:00.000Z',
  '2026-03-15T10:00:00.000Z'
);

INSERT OR IGNORE INTO credential_signatures (
  id, credential_id, signature_algorithm, issuer_key_id,
  signature_value, signature_format, signed_payload_digest, created_at
) VALUES (
  'sig_dev_02',
  'cred_dev_valid_02',
  'Ed25519',
  '${keyId}',
  '${s2.sigHex}',
  'raw_ed25519_hex',
  '${s2.dig}',
  '2026-03-15T10:00:00.000Z'
);

-- Credential 3: Revoked
INSERT OR IGNORE INTO credentials (
  id, organization_id, event_id, recipient_name, recipient_email_private,
  credential_type, title, issued_at, expires_at, status, revocation_reason, revoked_at,
  pdf_object_key, payload_json, payload_digest, issuer_key_id, created_by, created_at, updated_at
) VALUES (
  'cred_dev_revoked_03',
  'org_opentech_dev',
  'evt_workshop_2026',
  'Charlie Davis',
  'charlie.davis@example.com',
  'certificate',
  'Certified Systems Architect',
  '2026-03-15T10:00:00.000Z',
  NULL,
  'revoked',
  'Recipient requested certificate reissue due to name spelling correction',
  '2026-03-20T14:30:00.000Z',
  'certificates/cred_dev_revoked_03.pdf',
  '${s3.cStr.replace(/'/g, "''")}',
  '${s3.dig}',
  '${keyId}',
  'usr_admin_dev',
  '2026-03-15T10:00:00.000Z',
  '2026-03-20T14:30:00.000Z'
);

INSERT OR IGNORE INTO credential_signatures (
  id, credential_id, signature_algorithm, issuer_key_id,
  signature_value, signature_format, signed_payload_digest, created_at
) VALUES (
  'sig_dev_03',
  'cred_dev_revoked_03',
  'Ed25519',
  '${keyId}',
  '${s3.sigHex}',
  'raw_ed25519_hex',
  '${s3.dig}',
  '2026-03-15T10:00:00.000Z'
);

-- Credential 4: Expired
INSERT OR IGNORE INTO credentials (
  id, organization_id, event_id, recipient_name, recipient_email_private,
  credential_type, title, issued_at, expires_at, status, pdf_object_key,
  payload_json, payload_digest, issuer_key_id, created_by, created_at, updated_at
) VALUES (
  'cred_dev_expired_04',
  'org_opentech_dev',
  'evt_workshop_2026',
  'Diana Prince',
  'diana.prince@example.com',
  'certificate',
  'Certified Systems Architect',
  '2024-01-01T10:00:00.000Z',
  '2025-01-01T10:00:00.000Z',
  'expired',
  'certificates/cred_dev_expired_04.pdf',
  '${s4.cStr.replace(/'/g, "''")}',
  '${s4.dig}',
  '${keyId}',
  'usr_admin_dev',
  '2024-01-01T10:00:00.000Z',
  '2024-01-01T10:00:00.000Z'
);

INSERT OR IGNORE INTO credential_signatures (
  id, credential_id, signature_algorithm, issuer_key_id,
  signature_value, signature_format, signed_payload_digest, created_at
) VALUES (
  'sig_dev_04',
  'cred_dev_expired_04',
  'Ed25519',
  '${keyId}',
  '${s4.sigHex}',
  'raw_ed25519_hex',
  '${s4.dig}',
  '2024-01-01T10:00:00.000Z'
);
`;

  fs.writeFileSync('db/seed.sql', seedSql);
  console.log('Seed SQL written successfully to db/seed.sql');
}

generate().catch(console.error);
