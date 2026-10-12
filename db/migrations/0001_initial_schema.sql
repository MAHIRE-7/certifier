-- =====================================================================
-- Cloudflare D1 / SQLite Initial Migration
-- Platform: Verified Credentials & Digital Badges
-- =====================================================================

PRAGMA foreign_keys = ON;

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  logo_key TEXT NOT NULL DEFAULT '',
  approval_status TEXT NOT NULL DEFAULT 'approved' CHECK(approval_status IN ('pending', 'approved', 'suspended')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  auth_subject TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
  created_at TEXT NOT NULL
);

-- 3. Memberships
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('platform_admin', 'organization_admin', 'issuer')),
  created_at TEXT NOT NULL,
  UNIQUE(organization_id, user_id)
);

-- 4. Issuer Keys (Ed25519 Public Keys for verification)
CREATE TABLE IF NOT EXISTS issuer_keys (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT,
  key_algorithm TEXT NOT NULL DEFAULT 'Ed25519',
  key_status TEXT NOT NULL DEFAULT 'active' CHECK(key_status IN ('active', 'retired', 'revoked', 'compromised')),
  valid_from TEXT NOT NULL,
  valid_until TEXT,
  created_at TEXT NOT NULL
);

-- 5. Events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'workshop',
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 6. Credential Templates
CREATE TABLE IF NOT EXISTS credential_templates (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'modern_tech' CHECK(template_type IN ('modern_tech', 'minimal_achievement')),
  configuration_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 7. Credentials (Certificates and Badges)
CREATE TABLE IF NOT EXISTS credentials (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  recipient_email_private TEXT NOT NULL,
  credential_type TEXT NOT NULL CHECK(credential_type IN ('certificate', 'badge')),
  title TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'revoked', 'expired')),
  revocation_reason TEXT,
  revoked_at TEXT,
  pdf_object_key TEXT,
  payload_json TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  issuer_key_id TEXT NOT NULL REFERENCES issuer_keys(id),
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 8. Credential Signatures
CREATE TABLE IF NOT EXISTS credential_signatures (
  id TEXT PRIMARY KEY,
  credential_id TEXT NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  signature_algorithm TEXT NOT NULL DEFAULT 'Ed25519',
  issuer_key_id TEXT NOT NULL REFERENCES issuer_keys(id),
  signature_value TEXT NOT NULL,
  signature_format TEXT NOT NULL DEFAULT 'raw_ed25519_hex',
  signed_payload_digest TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(credential_id)
);

-- 9. Badge Definitions
CREATE TABLE IF NOT EXISTS badge_definitions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria TEXT NOT NULL,
  image_object_key TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 10. Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT,
  request_id TEXT,
  created_at TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credentials_org ON credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_credentials_event ON credentials(event_id);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON credentials(status);
CREATE INDEX IF NOT EXISTS idx_credentials_key ON credentials(issuer_key_id);
CREATE INDEX IF NOT EXISTS idx_credentials_recipient ON credentials(recipient_name);
CREATE INDEX IF NOT EXISTS idx_signatures_credential ON credential_signatures(credential_id);
CREATE INDEX IF NOT EXISTS idx_issuer_keys_org ON issuer_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_org ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_badges_org ON badge_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
