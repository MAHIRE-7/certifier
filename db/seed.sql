-- =====================================================================
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
  'pbkdf2:100000:a38794a695554e5f3c2ba693940f0750:69c5b3ddec0ab182ddf20271645a7501fa00265eff4cb89f8a34354118402428',
  'active',
  '2026-01-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO users (id, auth_subject, email, display_name, password_hash, status, created_at)
VALUES (
  'usr_issuer_dev',
  'local:usr_issuer_dev',
  'issuer@opentech.test',
  'Sarah Connor (Issuer)',
  'pbkdf2:100000:11855643ab433ea24676d35ed86e0ccf:a57ce966f25544bc5a21dfb3b6a57d5751d0ff0b30f55385551a9cd095687e94',
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
  'key_opentech_2026',
  'org_opentech_dev',
  'MCowBQYDK2VwAyEAZua0lBzs9WnAM35B9OP3Nt2iJRWGY39nIB3WiNacQpY=',
  'MC4CAQAwBQYDK2VwBCIEIC7NruJduX0iAGycouDe0y6FzFtygow3dktfdn0YZL4K',
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
  '{"credential_type":"certificate","event_or_achievement":"Modern Distributed Systems & WebAssembly Workshop","expires_at":null,"id":"cred_dev_valid_01","issued_at":"2026-03-15T10:00:00.000Z","issuer_id":"opentech","issuer_key_id":"key_opentech_2026","recipient":{"name":"Alice Chen"},"revocation_uri":"https://certifier.platform.test/api/v1/verify/cred_dev_valid_01","schema_version":"1.0.0","signature_algorithm":"Ed25519","title":"Certified Systems Architect"}',
  '81ecd6dad338616cf8329ec067e56e2e4d963fbf853744978783d044abc7dd75',
  'key_opentech_2026',
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
  'key_opentech_2026',
  '76117d14fe6c1ad8e47ffa16b086453d5a3c28910e31755db444a9de01e3c8fdb4ddca93bc3c44625578be05db6f16e960c7fc8875573790b266263be70d7c04',
  'raw_ed25519_hex',
  '81ecd6dad338616cf8329ec067e56e2e4d963fbf853744978783d044abc7dd75',
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
  '{"credential_type":"certificate","event_or_achievement":"Modern Distributed Systems & WebAssembly Workshop","expires_at":null,"id":"cred_dev_valid_02","issued_at":"2026-03-15T10:00:00.000Z","issuer_id":"opentech","issuer_key_id":"key_opentech_2026","recipient":{"name":"Bob Martin"},"revocation_uri":"https://certifier.platform.test/api/v1/verify/cred_dev_valid_02","schema_version":"1.0.0","signature_algorithm":"Ed25519","title":"Certified Systems Architect"}',
  'dce1aba90e46c5a4a288cbbdc44182541d41da90ecfc8645bdb2fc3e4bd0d31d',
  'key_opentech_2026',
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
  'key_opentech_2026',
  '7a1e6af1494c0aabac6f0e8725eac462cbf06d8c7635ba7b71f17ddee1b105a109c964e5d862a5abf315d17d20e0ab6022c48edf6cd24914b571a9a0e2bc1e03',
  'raw_ed25519_hex',
  'dce1aba90e46c5a4a288cbbdc44182541d41da90ecfc8645bdb2fc3e4bd0d31d',
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
  '{"credential_type":"certificate","event_or_achievement":"Modern Distributed Systems & WebAssembly Workshop","expires_at":null,"id":"cred_dev_revoked_03","issued_at":"2026-03-15T10:00:00.000Z","issuer_id":"opentech","issuer_key_id":"key_opentech_2026","recipient":{"name":"Charlie Davis"},"revocation_uri":"https://certifier.platform.test/api/v1/verify/cred_dev_revoked_03","schema_version":"1.0.0","signature_algorithm":"Ed25519","title":"Certified Systems Architect"}',
  '2678dba2650649980c1124fe5f9ffcd7e265f7cfb743e127be39c21702aa7b2a',
  'key_opentech_2026',
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
  'key_opentech_2026',
  '78555a353fa6ff5a43b12013b2e8b593820fc8a8ab02d6be5ec9a984fef6401299264335db936575dc19631528a19056543a7a3c90dab69b4652f08cc02ad506',
  'raw_ed25519_hex',
  '2678dba2650649980c1124fe5f9ffcd7e265f7cfb743e127be39c21702aa7b2a',
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
  '{"credential_type":"certificate","event_or_achievement":"Modern Distributed Systems & WebAssembly Workshop","expires_at":"2025-01-01T10:00:00.000Z","id":"cred_dev_expired_04","issued_at":"2024-01-01T10:00:00.000Z","issuer_id":"opentech","issuer_key_id":"key_opentech_2026","recipient":{"name":"Diana Prince"},"revocation_uri":"https://certifier.platform.test/api/v1/verify/cred_dev_expired_04","schema_version":"1.0.0","signature_algorithm":"Ed25519","title":"Certified Systems Architect"}',
  'fd406b83765f4883f99895ffd8f92d4fca0d5ee89946e20eda6ac587682da7f4',
  'key_opentech_2026',
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
  'key_opentech_2026',
  'c969b98acc56247012fe4ef5758456cd809a31c04007f09b232a4c44ce20d4c44cecc336c49f509831c6bffecdb0bd92d72581dfbcca724086e456dc6a700d09',
  'raw_ed25519_hex',
  'fd406b83765f4883f99895ffd8f92d4fca0d5ee89946e20eda6ac587682da7f4',
  '2024-01-01T10:00:00.000Z'
);
