import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import {
  canonicalizeJson,
  computePayloadDigest,
  CredentialPayloadSchema,
  RecipientCsvRowSchema,
  CreateEventSchema,
  CreateBadgeDefinitionSchema,
  PublicVerificationResult
} from '@certifier/credential-schema';
import {
  generateIssuerKeyPair,
  signCredentialPayload,
  verifyCredentialSignature,
  bytesToHex
} from '@certifier/signing';
import { generateCertificatePdf } from '@certifier/pdf';
import { D1DatabaseLike } from './db';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  SessionPayload
} from './crypto-auth';

export interface AppEnv {
  Bindings: {
    DB: D1DatabaseLike;
    CERTIFICATES_BUCKET?: any;
    JWT_SECRET?: string;
    PUBLIC_BASE_URL?: string;
    ENVIRONMENT?: string;
  };
  Variables: {
    user?: SessionPayload;
  };
}

// In-memory PDF storage fallback for local dev & testing when R2 is not configured
export const localPdfStorage = new Map<string, Uint8Array>();

export function createApiApp() {
  const app = new Hono<AppEnv>();

  // Global security headers and CORS
  app.use('*', cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Disposition'],
    credentials: true
  }));

  app.use('*', async (c, next) => {
    // Security headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';");
    await next();
  });

  // Global Error Handler
  app.onError((err, c) => {
    console.error('API Error:', err);
    return c.json({ error: err.message || 'Internal Server Error' }, 500);
  });

  // Health check
  app.get('/health', (c) => c.json({ status: 'ok', service: 'certifier-api', timestamp: new Date().toISOString() }));

  const v1 = new Hono<AppEnv>();

  // -------------------------------------------------------------
  // Auth Middleware
  // -------------------------------------------------------------
  const authMiddleware = async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');
    const secret = c.env.JWT_SECRET || 'dev_insecure_jwt_secret_key_32bytes!!';
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
    }
    const token = authHeader.substring(7);
    const session = await verifySessionToken(token, secret);
    if (!session) {
      return c.json({ error: 'Unauthorized: Invalid or expired session' }, 401);
    }
    c.set('user', session);
    await next();
  };

  // Helper for audit logging
  const logAudit = async (
    db: D1DatabaseLike,
    orgId: string | null,
    actorId: string | null,
    action: string,
    targetType: string,
    targetId: string,
    reason?: string
  ) => {
    try {
      const id = `audit_${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO audit_events (id, organization_id, actor_user_id, action, target_type, target_id, reason, request_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(id, orgId, actorId, action, targetType, targetId, reason || null, crypto.randomUUID(), now)
        .run();
    } catch (e) {
      console.error('Failed to write audit event', e);
    }
  };

  // -------------------------------------------------------------
  // Authentication Routes
  // -------------------------------------------------------------
  const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    displayName: z.string().min(2),
    organizationName: z.string().min(2),
    organizationSlug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric/hyphen')
  });

  v1.post('/auth/register', async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const { email, password, displayName, organizationName, organizationSlug } = parsed.data;
    const db = c.env.DB;

    // Check if user already exists
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existingUser) {
      return c.json({ error: 'User with this email already exists' }, 409);
    }

    // Check if organization slug exists
    const existingOrg = await db.prepare('SELECT id FROM organizations WHERE slug = ?').bind(organizationSlug).first();
    if (existingOrg) {
      return c.json({ error: 'Organization slug is already taken' }, 409);
    }

    const now = new Date().toISOString();
    const userId = `usr_${crypto.randomUUID()}`;
    const orgId = `org_${crypto.randomUUID()}`;
    const keyId = `key_${crypto.randomUUID()}`;
    const membershipId = `mem_${crypto.randomUUID()}`;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate issuer Ed25519 keypair for the new organization
    const keyPair = await generateIssuerKeyPair();

    // Insert Organization
    await db
      .prepare(
        `INSERT INTO organizations (id, name, slug, description, logo_key, approval_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, '', 'approved', ?, ?)`
      )
      .bind(orgId, organizationName, organizationSlug, '', now, now)
      .run();

    // Insert User
    await db
      .prepare(
        `INSERT INTO users (id, auth_subject, email, display_name, password_hash, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?)`
      )
      .bind(userId, `local:${userId}`, email, displayName, passwordHash, now)
      .run();

    // Insert Membership (organization_admin)
    await db
      .prepare(
        `INSERT INTO memberships (id, organization_id, user_id, role, created_at)
         VALUES (?, ?, ?, 'organization_admin', ?)`
      )
      .bind(membershipId, orgId, userId, now)
      .run();

    // Insert Issuer Key
    await db
      .prepare(
        `INSERT INTO issuer_keys (id, organization_id, public_key, private_key_encrypted, key_algorithm, key_status, valid_from, created_at)
         VALUES (?, ?, ?, ?, 'Ed25519', 'active', ?, ?)`
      )
      .bind(keyId, orgId, keyPair.publicKeySpkiBase64, keyPair.privateKeyPkcs8Base64, now, now)
      .run();

    // Insert Default Certificate Template
    await db
      .prepare(
        `INSERT INTO credential_templates (id, organization_id, name, template_type, configuration_json, status, created_at, updated_at)
         VALUES (?, ?, 'Standard Modern Workshop', 'modern_tech', '{}', 'active', ?, ?)`
      )
      .bind(`tmpl_${crypto.randomUUID()}`, orgId, now, now)
      .run();

    await logAudit(db, orgId, userId, 'REGISTER_ORGANIZATION', 'organization', orgId);

    // Create session token
    const secret = c.env.JWT_SECRET || 'dev_insecure_jwt_secret_key_32bytes!!';
    const session: SessionPayload = {
      sub: userId,
      email,
      orgId,
      role: 'organization_admin',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    const token = await createSessionToken(session, secret);

    return c.json({
      token,
      user: {
        id: userId,
        email,
        displayName,
        role: 'organization_admin',
        organization: { id: orgId, name: organizationName, slug: organizationSlug }
      }
    }, 201);
  });

  const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string()
  });

  v1.post('/auth/login', async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid login credentials format' }, 400);
    }

    const { email, password } = parsed.data;
    const db = c.env.DB;

    const user = await db
      .prepare('SELECT id, email, display_name, password_hash, status FROM users WHERE email = ?')
      .bind(email)
      .first<{ id: string; email: string; display_name: string; password_hash: string; status: string }>();

    if (!user || user.status !== 'active') {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const matches = await verifyPassword(password, user.password_hash);
    if (!matches) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Fetch user's membership and organization
    const membership = await db
      .prepare(
        `SELECT m.organization_id, m.role, o.name as org_name, o.slug as org_slug, o.approval_status
         FROM memberships m
         JOIN organizations o ON m.organization_id = o.id
         WHERE m.user_id = ?
         LIMIT 1`
      )
      .bind(user.id)
      .first<{ organization_id: string; role: any; org_name: string; org_slug: string; approval_status: string }>();

    if (!membership) {
      return c.json({ error: 'User does not belong to any organization' }, 403);
    }

    const secret = c.env.JWT_SECRET || 'dev_insecure_jwt_secret_key_32bytes!!';
    const session: SessionPayload = {
      sub: user.id,
      email: user.email,
      orgId: membership.organization_id,
      role: membership.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    const token = await createSessionToken(session, secret);
    await logAudit(db, membership.organization_id, user.id, 'USER_LOGIN', 'user', user.id);

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: membership.role,
        organization: {
          id: membership.organization_id,
          name: membership.org_name,
          slug: membership.org_slug,
          approvalStatus: membership.approval_status
        }
      }
    });
  });

  v1.post('/auth/logout', authMiddleware, async (c) => {
    const user = c.get('user');
    await logAudit(c.env.DB, user?.orgId || null, user?.sub || null, 'USER_LOGOUT', 'user', user?.sub || '');
    return c.json({ message: 'Logged out successfully' });
  });

  v1.get('/auth/me', authMiddleware, async (c) => {
    const sessionUser = c.get('user')!;
    const db = c.env.DB;

    const user = await db
      .prepare('SELECT id, email, display_name, status FROM users WHERE id = ?')
      .bind(sessionUser.sub)
      .first<{ id: string; email: string; display_name: string; status: string }>();

    const membership = await db
      .prepare(
        `SELECT m.organization_id, m.role, o.name as org_name, o.slug as org_slug, o.approval_status
         FROM memberships m
         JOIN organizations o ON m.organization_id = o.id
         WHERE m.user_id = ? AND m.organization_id = ?`
      )
      .bind(sessionUser.sub, sessionUser.orgId)
      .first<{ organization_id: string; role: any; org_name: string; org_slug: string; approval_status: string }>();

    if (!user || !membership) {
      return c.json({ error: 'User session not found' }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: membership.role,
        organization: {
          id: membership.organization_id,
          name: membership.org_name,
          slug: membership.org_slug,
          approvalStatus: membership.approval_status
        }
      }
    });
  });

  // -------------------------------------------------------------
  // Dashboard & Metrics
  // -------------------------------------------------------------
  v1.get('/dashboard/stats', authMiddleware, async (c) => {
    const user = c.get('user')!;
    const db = c.env.DB;

    const totalIssued = await db
      .prepare('SELECT COUNT(*) as count FROM credentials WHERE organization_id = ?')
      .bind(user.orgId)
      .first<{ count: number }>();

    const activeIssued = await db
      .prepare("SELECT COUNT(*) as count FROM credentials WHERE organization_id = ? AND status = 'active'")
      .bind(user.orgId)
      .first<{ count: number }>();

    const revokedIssued = await db
      .prepare("SELECT COUNT(*) as count FROM credentials WHERE organization_id = ? AND status = 'revoked'")
      .bind(user.orgId)
      .first<{ count: number }>();

    const totalEvents = await db
      .prepare('SELECT COUNT(*) as count FROM events WHERE organization_id = ?')
      .bind(user.orgId)
      .first<{ count: number }>();

    const totalBadges = await db
      .prepare('SELECT COUNT(*) as count FROM badge_definitions WHERE organization_id = ?')
      .bind(user.orgId)
      .first<{ count: number }>();

    const recentActivity = await db
      .prepare(
        `SELECT id, recipient_name, title, credential_type, status, issued_at
         FROM credentials
         WHERE organization_id = ?
         ORDER BY created_at DESC
         LIMIT 6`
      )
      .bind(user.orgId)
      .all();

    return c.json({
      metrics: {
        totalCredentials: totalIssued?.count || 0,
        activeCredentials: activeIssued?.count || 0,
        revokedCredentials: revokedIssued?.count || 0,
        totalEvents: totalEvents?.count || 0,
        totalBadges: totalBadges?.count || 0
      },
      recentCredentials: recentActivity.results
    });
  });

  // -------------------------------------------------------------
  // Events Management
  // -------------------------------------------------------------
  v1.get('/events', authMiddleware, async (c) => {
    const user = c.get('user')!;
    const db = c.env.DB;

    const events = await db
      .prepare(
        `SELECT e.*, COUNT(c.id) as credential_count
         FROM events e
         LEFT JOIN credentials c ON e.id = c.event_id
         WHERE e.organization_id = ?
         GROUP BY e.id
         ORDER BY e.created_at DESC`
      )
      .bind(user.orgId)
      .all();

    return c.json({ events: events.results });
  });

  v1.post('/events', authMiddleware, async (c) => {
    const user = c.get('user')!;
    const body = await c.req.json().catch(() => null);
    const parsed = CreateEventSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const { title, description, event_type, start_date, end_date } = parsed.data;
    const db = c.env.DB;
    const eventId = `evt_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO events (id, organization_id, title, description, event_type, start_date, end_date, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
      )
      .bind(eventId, user.orgId, title, description, event_type, start_date || null, end_date || null, now, now)
      .run();

    await logAudit(db, user.orgId, user.sub, 'CREATE_EVENT', 'event', eventId);

    return c.json({
      event: {
        id: eventId,
        organization_id: user.orgId,
        title,
        description,
        event_type,
        start_date,
        end_date,
        status: 'active',
        created_at: now
      }
    }, 201);
  });

  v1.get('/events/:id', authMiddleware, async (c) => {
    const user = c.get('user')!;
    const eventId = c.req.param('id');
    const db = c.env.DB;

    const event = await db
      .prepare('SELECT * FROM events WHERE id = ? AND organization_id = ?')
      .bind(eventId, user.orgId)
      .first();

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const credentials = await db
      .prepare(
        `SELECT id, recipient_name, recipient_email_private, credential_type, title, status, issued_at
         FROM credentials
         WHERE event_id = ? AND organization_id = ?
         ORDER BY created_at DESC`
      )
      .bind(eventId, user.orgId)
      .all();

    return c.json({ event, credentials: credentials.results });
  });

  // CSV preview & parse endpoint
  v1.post('/events/:id/imports', authMiddleware, async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body || !body.csvContent || typeof body.csvContent !== 'string') {
      return c.json({ error: 'csvContent string is required' }, 400);
    }

    const rawRows = body.csvContent.split(/\r?\n/).filter((r: string) => r.trim().length > 0);
    if (rawRows.length < 2) {
      return c.json({ error: 'CSV must contain a header and at least one data row' }, 400);
    }

    const headers = rawRows[0].split(',').map((h: string) => h.trim().toLowerCase());
    const validRows: any[] = [];
    const invalidRows: any[] = [];

    for (let i = 1; i < rawRows.length; i++) {
      const line = rawRows[i].trim();
      if (!line) continue;
      const values = line.split(',').map((v: string) => v.trim());
      const rowObj: Record<string, string> = {};
      headers.forEach((h: string, idx: number) => {
        rowObj[h] = values[idx] || '';
      });

      const parsed = RecipientCsvRowSchema.safeParse(rowObj);
      if (parsed.success) {
        validRows.push({ ...parsed.data, row_number: i });
      } else {
        invalidRows.push({
          row_number: i,
          raw: line,
          errors: parsed.error.issues.map((iss) => `${iss.path.join('.')}: ${iss.message}`)
        });
      }
    }

    return c.json({
      summary: {
        totalRows: rawRows.length - 1,
        validCount: validRows.length,
        invalidCount: invalidRows.length
      },
      validRows: validRows.slice(0, 50),
      invalidRows
    });
  });

  // -------------------------------------------------------------
  // Credential Issuance (Cryptographically Signed with Ed25519)
  // -------------------------------------------------------------
  const IssueCredentialsSchema = z.object({
    recipients: z.array(
      z.object({
        recipient_name: z.string().min(1),
        recipient_email: z.string().email(),
        credential_title: z.string().min(1),
        issue_date: z.string().optional(),
        expiration_date: z.string().nullable().optional()
      })
    ).min(1, 'At least one recipient is required'),
    template_type: z.enum(['modern_tech', 'minimal_achievement']).default('modern_tech'),
    signer_name: z.string().optional(),
    signer_title: z.string().optional()
  });

  v1.post('/events/:id/credentials/issue', authMiddleware, async (c) => {
    const user = c.get('user')!;
    const eventId = c.req.param('id');
    const body = await c.req.json().catch(() => null);
    const parsed = IssueCredentialsSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const db = c.env.DB;
    // Check event exists for this organization
    const event = await db
      .prepare('SELECT * FROM events WHERE id = ? AND organization_id = ?')
      .bind(eventId, user.orgId)
      .first<{ id: string; title: string }>();

    if (!event) {
      return c.json({ error: 'Event not found in your organization' }, 404);
    }

    // Retrieve active issuer signing key for the organization
    const issuerKey = await db
      .prepare(
        `SELECT id, public_key, private_key_encrypted
         FROM issuer_keys
         WHERE organization_id = ? AND key_status = 'active'
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .bind(user.orgId)
      .first<{ id: string; public_key: string; private_key_encrypted: string }>();

    if (!issuerKey || !issuerKey.private_key_encrypted) {
      return c.json({ error: 'No active signing key configured for your organization' }, 500);
    }

    // Retrieve organization details
    const org = await db
      .prepare('SELECT name, slug FROM organizations WHERE id = ?')
      .bind(user.orgId)
      .first<{ name: string; slug: string }>();

    const baseUrl = c.env.PUBLIC_BASE_URL || 'https://certifier.platform.test';
    const now = new Date().toISOString();
    const issuedCredentials: any[] = [];

    for (const recipient of parsed.data.recipients) {
      const credId = `cred_${crypto.randomUUID()}`;
      const verificationUrl = `${baseUrl}/verify/${credId}`;

      // Build canonical credential payload (no raw email in public payload!)
      const payload = {
        id: credId,
        schema_version: '1.0.0' as const,
        credential_type: 'certificate' as const,
        issuer_id: org?.slug || user.orgId,
        issuer_key_id: issuerKey.id,
        recipient: {
          name: recipient.recipient_name
        },
        title: recipient.credential_title,
        event_or_achievement: event.title,
        issued_at: recipient.issue_date || now,
        expires_at: recipient.expiration_date || null,
        revocation_uri: `${baseUrl}/api/v1/verify/${credId}`,
        signature_algorithm: 'Ed25519' as const
      };

      // Sign payload deterministically using Ed25519 WebCrypto
      const signResult = await signCredentialPayload(payload, issuerKey.private_key_encrypted);

      // Generate PDF with embedded QR code
      const pdfBytes = await generateCertificatePdf({
        recipientName: recipient.recipient_name,
        credentialTitle: recipient.credential_title,
        eventOrAchievement: event.title,
        issuerOrganization: org?.name || 'Authorized Issuer',
        issuedAt: payload.issued_at,
        credentialId: credId,
        verificationUrl,
        signerName: parsed.data.signer_name || 'Academic & Certification Board',
        signerTitle: parsed.data.signer_title || 'Lead Certification Authority',
        templateType: parsed.data.template_type
      });

      // Save PDF into R2 bucket or local fallback
      const pdfObjectKey = `certificates/${credId}.pdf`;
      if (c.env.CERTIFICATES_BUCKET) {
        await c.env.CERTIFICATES_BUCKET.put(pdfObjectKey, pdfBytes, {
          httpMetadata: { contentType: 'application/pdf' }
        });
      } else {
        localPdfStorage.set(pdfObjectKey, pdfBytes);
      }

      // Store in D1
      await db
        .prepare(
          `INSERT INTO credentials (
            id, organization_id, event_id, recipient_name, recipient_email_private,
            credential_type, title, issued_at, expires_at, status, pdf_object_key,
            payload_json, payload_digest, issuer_key_id, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'certificate', ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          credId,
          user.orgId,
          eventId,
          recipient.recipient_name,
          recipient.recipient_email,
          recipient.credential_title,
          payload.issued_at,
          payload.expires_at,
          pdfObjectKey,
          signResult.canonicalString,
          signResult.payloadDigestHex,
          issuerKey.id,
          user.sub,
          now,
          now
        )
        .run();

      // Store Signature in credential_signatures
      await db
        .prepare(
          `INSERT INTO credential_signatures (
            id, credential_id, signature_algorithm, issuer_key_id,
            signature_value, signature_format, signed_payload_digest, created_at
          ) VALUES (?, ?, 'Ed25519', ?, ?, 'raw_ed25519_hex', ?, ?)`
        )
        .bind(
          `sig_${crypto.randomUUID()}`,
          credId,
          issuerKey.id,
          signResult.signatureHex,
          signResult.payloadDigestHex,
          now
        )
        .run();

      issuedCredentials.push({
        id: credId,
        recipient_name: recipient.recipient_name,
        verificationUrl,
        signature: signResult.signatureHex
      });
    }

    await logAudit(
      db,
      user.orgId,
      user.sub,
      'ISSUE_CREDENTIALS',
      'event',
      eventId,
      `Issued ${issuedCredentials.length} credentials`
    );

    return c.json({
      message: `Successfully issued ${issuedCredentials.length} credentials`,
      credentials: issuedCredentials
    }, 201);
  });

  // -------------------------------------------------------------
  // Credential Management & Audit
  // -------------------------------------------------------------
  v1.get('/credentials', authMiddleware, async (c) => {
    const user = c.get('user')!;
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const db = c.env.DB;

    let query = `
      SELECT c.id, c.recipient_name, c.recipient_email_private, c.credential_type,
             c.title, c.issued_at, c.expires_at, c.status, c.created_at, e.title as event_title
      FROM credentials c
      LEFT JOIN events e ON c.event_id = e.id
      WHERE c.organization_id = ?
    `;
    const params: unknown[] = [user.orgId];

    if (search) {
      query += ` AND (c.recipient_name LIKE ? OR c.id LIKE ? OR c.title LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY c.created_at DESC LIMIT 100`;

    const credentials = await db.prepare(query).bind(...params).all();
    return c.json({ credentials: credentials.results });
  });

  v1.get('/credentials/:id', authMiddleware, async (c) => {
    const user = c.get('user')!;
    const credId = c.req.param('id');
    const db = c.env.DB;

    const credential = await db
      .prepare(
        `SELECT c.*, e.title as event_title, s.signature_value, s.signature_algorithm
         FROM credentials c
         LEFT JOIN events e ON c.event_id = e.id
         LEFT JOIN credential_signatures s ON c.id = s.credential_id
         WHERE c.id = ? AND c.organization_id = ?`
      )
      .bind(credId, user.orgId)
      .first();

    if (!credential) {
      return c.json({ error: 'Credential not found' }, 404);
    }

    const auditHistory = await db
      .prepare('SELECT * FROM audit_events WHERE target_id = ? ORDER BY created_at DESC')
      .bind(credId)
      .all();

    return c.json({ credential, auditHistory: auditHistory.results });
  });

  // Download signed certificate PDF
  v1.get('/credentials/:id/download', async (c) => {
    const credId = c.req.param('id');
    const db = c.env.DB;

    const cred = await db
      .prepare('SELECT id, recipient_name, pdf_object_key, status FROM credentials WHERE id = ?')
      .bind(credId)
      .first<{ id: string; recipient_name: string; pdf_object_key: string; status: string }>();

    if (!cred || !cred.pdf_object_key) {
      return c.json({ error: 'Certificate file not found' }, 404);
    }

    let pdfData: Uint8Array | null = null;
    if (c.env.CERTIFICATES_BUCKET) {
      const obj = await c.env.CERTIFICATES_BUCKET.get(cred.pdf_object_key);
      if (obj) {
        pdfData = new Uint8Array(await obj.arrayBuffer());
      }
    } else {
      pdfData = localPdfStorage.get(cred.pdf_object_key) || null;
    }

    if (!pdfData) {
      return c.json({ error: 'PDF file is not present in storage' }, 404);
    }

    const safeFilename = `Certificate-${cred.id}.pdf`;
    return new Response(pdfData as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  });

  // Revoke credential with mandatory reason
  v1.post('/credentials/:id/revoke', authMiddleware, async (c) => {
    const user = c.get('user')!;
    const credId = c.req.param('id');
    const body = await c.req.json().catch(() => null);

    if (!body || !body.reason || typeof body.reason !== 'string' || body.reason.trim().length < 5) {
      return c.json({ error: 'A mandatory revocation reason of at least 5 characters is required' }, 400);
    }

    const db = c.env.DB;
    const cred = await db
      .prepare('SELECT id, status FROM credentials WHERE id = ? AND organization_id = ?')
      .bind(credId, user.orgId)
      .first<{ id: string; status: string }>();

    if (!cred) {
      return c.json({ error: 'Credential not found' }, 404);
    }

    if (cred.status === 'revoked') {
      return c.json({ error: 'Credential is already revoked' }, 400);
    }

    const now = new Date().toISOString();
    await db
      .prepare(
        `UPDATE credentials
         SET status = 'revoked', revocation_reason = ?, revoked_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(body.reason.trim(), now, now, credId)
      .run();

    await logAudit(db, user.orgId, user.sub, 'REVOKE_CREDENTIAL', 'credential', credId, body.reason.trim());

    return c.json({ message: 'Credential revoked successfully', id: credId, status: 'revoked', revoked_at: now });
  });

  // -------------------------------------------------------------
  // Digital Badges
  // -------------------------------------------------------------
  v1.get('/badges', authMiddleware, async (c) => {
    const user = c.get('user')!;
    const db = c.env.DB;

    const badges = await db
      .prepare(
        `SELECT b.*, COUNT(c.id) as awarded_count
         FROM badge_definitions b
         LEFT JOIN credentials c ON b.id = c.event_id AND c.credential_type = 'badge'
         WHERE b.organization_id = ?
         GROUP BY b.id
         ORDER BY b.created_at DESC`
      )
      .bind(user.orgId)
      .all();

    return c.json({ badges: badges.results });
  });

  v1.post('/badges', authMiddleware, async (c) => {
    const user = c.get('user')!;
    const body = await c.req.json().catch(() => null);
    const parsed = CreateBadgeDefinitionSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const { name, description, criteria, image_object_key } = parsed.data;
    const db = c.env.DB;
    const badgeId = `bdg_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO badge_definitions (id, organization_id, name, description, criteria, image_object_key, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`
      )
      .bind(badgeId, user.orgId, name, description, criteria, image_object_key || '', now, now)
      .run();

    await logAudit(db, user.orgId, user.sub, 'CREATE_BADGE_DEFINITION', 'badge_definition', badgeId);

    return c.json({
      badge: {
        id: badgeId,
        name,
        description,
        criteria,
        image_object_key,
        status: 'active',
        created_at: now
      }
    }, 201);
  });

  // Issue a badge to a recipient
  v1.post('/badges/:id/issue', authMiddleware, async (c) => {
    const user = c.get('user')!;
    const badgeId = c.req.param('id');
    const body = await c.req.json().catch(() => null);

    const schema = z.object({
      recipient_name: z.string().min(1),
      recipient_email: z.string().email(),
      notes: z.string().optional()
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const db = c.env.DB;
    const badge = await db
      .prepare('SELECT * FROM badge_definitions WHERE id = ? AND organization_id = ?')
      .bind(badgeId, user.orgId)
      .first<{ id: string; name: string }>();

    if (!badge) {
      return c.json({ error: 'Badge definition not found' }, 404);
    }

    const issuerKey = await db
      .prepare("SELECT id, private_key_encrypted FROM issuer_keys WHERE organization_id = ? AND key_status = 'active' LIMIT 1")
      .bind(user.orgId)
      .first<{ id: string; private_key_encrypted: string }>();

    if (!issuerKey || !issuerKey.private_key_encrypted) {
      return c.json({ error: 'No active signing key configured' }, 500);
    }

    const org = await db.prepare('SELECT name, slug FROM organizations WHERE id = ?').bind(user.orgId).first<{ name: string; slug: string }>();
    const credId = `cred_bdg_${crypto.randomUUID()}`;
    const baseUrl = c.env.PUBLIC_BASE_URL || 'https://certifier.platform.test';
    const now = new Date().toISOString();

    const payload = {
      id: credId,
      schema_version: '1.0.0' as const,
      credential_type: 'badge' as const,
      issuer_id: org?.slug || user.orgId,
      issuer_key_id: issuerKey.id,
      recipient: {
        name: parsed.data.recipient_name
      },
      title: badge.name,
      event_or_achievement: `Awarded Badge: ${badge.name}`,
      issued_at: now,
      expires_at: null,
      revocation_uri: `${baseUrl}/api/v1/verify/${credId}`,
      signature_algorithm: 'Ed25519' as const
    };

    const signResult = await signCredentialPayload(payload, issuerKey.private_key_encrypted);

    await db
      .prepare(
        `INSERT INTO credentials (
          id, organization_id, event_id, recipient_name, recipient_email_private,
          credential_type, title, issued_at, expires_at, status, payload_json,
          payload_digest, issuer_key_id, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'badge', ?, ?, NULL, 'active', ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        credId,
        user.orgId,
        badgeId,
        parsed.data.recipient_name,
        parsed.data.recipient_email,
        badge.name,
        now,
        signResult.canonicalString,
        signResult.payloadDigestHex,
        issuerKey.id,
        user.sub,
        now,
        now
      )
      .run();

    await db
      .prepare(
        `INSERT INTO credential_signatures (
          id, credential_id, signature_algorithm, issuer_key_id,
          signature_value, signature_format, signed_payload_digest, created_at
        ) VALUES (?, ?, 'Ed25519', ?, ?, 'raw_ed25519_hex', ?, ?)`
      )
      .bind(
        `sig_${crypto.randomUUID()}`,
        credId,
        issuerKey.id,
        signResult.signatureHex,
        signResult.payloadDigestHex,
        now
      )
      .run();

    await logAudit(db, user.orgId, user.sub, 'ISSUE_BADGE', 'badge', badgeId, `Awarded to ${parsed.data.recipient_name}`);

    return c.json({
      message: 'Badge successfully issued',
      credential: {
        id: credId,
        recipient_name: parsed.data.recipient_name,
        verificationUrl: `${baseUrl}/verify/${credId}`
      }
    }, 201);
  });

  // Public Badge Definition page
  v1.get('/badges/:badgeId', async (c) => {
    const badgeId = c.req.param('badgeId');
    const db = c.env.DB;

    const badge = await db
      .prepare(
        `SELECT b.*, o.name as organization_name, o.slug as organization_slug
         FROM badge_definitions b
         JOIN organizations o ON b.organization_id = o.id
         WHERE b.id = ?`
      )
      .bind(badgeId)
      .first();

    if (!badge) {
      return c.json({ error: 'Badge definition not found' }, 404);
    }

    return c.json({ badge });
  });

  // -------------------------------------------------------------
  // Public Verification & Trust Endpoints (NO LOGIN REQUIRED)
  // -------------------------------------------------------------
  v1.get('/verify/:credentialId', async (c) => {
    const credId = c.req.param('credentialId');
    const db = c.env.DB;

    // 1. Fetch credential record from authoritative database
    const cred = await db
      .prepare(
        `SELECT c.id, c.organization_id, c.event_id, c.recipient_name,
                c.credential_type, c.title, c.issued_at, c.expires_at, c.status,
                c.revocation_reason, c.revoked_at, c.pdf_object_key,
                c.payload_json, c.payload_digest, c.issuer_key_id,
                o.name as org_name, o.slug as org_slug, o.approval_status as org_approval_status,
                e.title as event_title,
                s.signature_value, s.signature_algorithm
         FROM credentials c
         JOIN organizations o ON c.organization_id = o.id
         LEFT JOIN events e ON c.event_id = e.id
         LEFT JOIN credential_signatures s ON c.id = s.credential_id
         WHERE c.id = ?`
      )
      .bind(credId)
      .first<any>();

    if (!cred) {
      return c.json<PublicVerificationResult>(
        {
          status: 'not_found',
          message: 'Credential with this identifier was not found in the registry.',
          credential: null,
          cryptographic_details: null
        },
        404
      );
    }

    // 2. Resolve trusted issuer public key from registry
    const issuerKey = await db
      .prepare(
        `SELECT id, public_key, key_status, valid_from, valid_until
         FROM issuer_keys
         WHERE id = ? AND organization_id = ?`
      )
      .bind(cred.issuer_key_id, cred.organization_id)
      .first<{ id: string; public_key: string; key_status: string; valid_from: string; valid_until: string | null }>();

    if (!issuerKey) {
      return c.json<PublicVerificationResult>(
        {
          status: 'untrusted_issuer',
          message: 'Signing key is not recognized in the approved issuer registry.',
          credential: null,
          cryptographic_details: null
        },
        422
      );
    }

    // 3. Perform cryptographic signature verification
    const isSignatureValid = await verifyCredentialSignature(
      cred.payload_json,
      cred.signature_value,
      issuerKey.public_key
    );

    if (!isSignatureValid) {
      return c.json<PublicVerificationResult>(
        {
          status: 'invalid_signature',
          message: 'Cryptographic signature verification failed. The credential data may have been altered.',
          credential: null,
          cryptographic_details: {
            signature_algorithm: cred.signature_algorithm || 'Ed25519',
            issuer_key_id: cred.issuer_key_id,
            issuer_public_key_spki_base64: issuerKey.public_key,
            payload_digest_sha256: cred.payload_digest,
            signature_hex: cred.signature_value
          }
        },
        422
      );
    }

    // 4. Check revocation status
    if (cred.status === 'revoked') {
      return c.json<PublicVerificationResult>({
        status: 'revoked',
        message: 'This credential was cryptographically signed by an approved issuer, but has subsequently been REVOKED.',
        credential: {
          id: cred.id,
          title: cred.title,
          credential_type: cred.credential_type,
          recipient_name: cred.recipient_name, // Name is public; email is NEVER exposed
          issuer_organization: cred.org_name,
          issuer_slug: cred.org_slug,
          event_or_achievement: cred.event_title || cred.title,
          issued_at: cred.issued_at,
          expires_at: cred.expires_at,
          revocation_status: 'revoked',
          revocation_reason: cred.revocation_reason,
          revoked_at: cred.revoked_at,
          issuer_key_id: cred.issuer_key_id,
          issuer_approval_status: cred.org_approval_status,
          signature_algorithm: cred.signature_algorithm,
          signature_valid: true,
          download_available: false
        },
        cryptographic_details: {
          signature_algorithm: cred.signature_algorithm,
          issuer_key_id: cred.issuer_key_id,
          issuer_public_key_spki_base64: issuerKey.public_key,
          payload_digest_sha256: cred.payload_digest,
          signature_hex: cred.signature_value
        }
      });
    }

    // 5. Check expiration status
    if (cred.expires_at && new Date() > new Date(cred.expires_at)) {
      return c.json<PublicVerificationResult>({
        status: 'expired',
        message: 'This credential was cryptographically signed by an approved issuer, but has EXPIRED.',
        credential: {
          id: cred.id,
          title: cred.title,
          credential_type: cred.credential_type,
          recipient_name: cred.recipient_name,
          issuer_organization: cred.org_name,
          issuer_slug: cred.org_slug,
          event_or_achievement: cred.event_title || cred.title,
          issued_at: cred.issued_at,
          expires_at: cred.expires_at,
          revocation_status: 'expired',
          issuer_key_id: cred.issuer_key_id,
          issuer_approval_status: cred.org_approval_status,
          signature_algorithm: cred.signature_algorithm,
          signature_valid: true,
          download_available: true
        },
        cryptographic_details: {
          signature_algorithm: cred.signature_algorithm,
          issuer_key_id: cred.issuer_key_id,
          issuer_public_key_spki_base64: issuerKey.public_key,
          payload_digest_sha256: cred.payload_digest,
          signature_hex: cred.signature_value
        }
      });
    }

    // 6. Return authentic, verified status
    return c.json<PublicVerificationResult>({
      status: 'valid',
      message: 'Credential authenticity verified. Cryptographic signature and issuer identity are valid and active.',
      credential: {
        id: cred.id,
        title: cred.title,
        credential_type: cred.credential_type,
        recipient_name: cred.recipient_name,
        issuer_organization: cred.org_name,
        issuer_slug: cred.org_slug,
        event_or_achievement: cred.event_title || cred.title,
        issued_at: cred.issued_at,
        expires_at: cred.expires_at,
        revocation_status: 'active',
        issuer_key_id: cred.issuer_key_id,
        issuer_approval_status: cred.org_approval_status,
        signature_algorithm: cred.signature_algorithm,
        signature_valid: true,
        download_available: !!cred.pdf_object_key
      },
      cryptographic_details: {
        signature_algorithm: cred.signature_algorithm,
        issuer_key_id: cred.issuer_key_id,
        issuer_public_key_spki_base64: issuerKey.public_key,
        payload_digest_sha256: cred.payload_digest,
        signature_hex: cred.signature_value
      }
    });
  });

  // Public Issuer Profile
  v1.get('/issuers/:slug', async (c) => {
    const slug = c.req.param('slug');
    const db = c.env.DB;

    const org = await db
      .prepare('SELECT id, name, slug, description, approval_status, created_at FROM organizations WHERE slug = ?')
      .bind(slug)
      .first();

    if (!org) {
      return c.json({ error: 'Issuer organization not found' }, 404);
    }

    const publicKeys = await db
      .prepare(
        `SELECT id, public_key, key_algorithm, key_status, valid_from, valid_until
         FROM issuer_keys
         WHERE organization_id = ?
         ORDER BY created_at DESC`
      )
      .bind((org as any).id)
      .all();

    const publicCredentials = await db
      .prepare(
        `SELECT id, recipient_name, credential_type, title, issued_at, status
         FROM credentials
         WHERE organization_id = ? AND status != 'revoked'
         ORDER BY issued_at DESC
         LIMIT 20`
      )
      .bind((org as any).id)
      .all();

    return c.json({
      issuer: org,
      publicKeys: publicKeys.results,
      credentials: publicCredentials.results
    });
  });

  // Public Key Discovery
  v1.get('/issuers/:slug/keys/:keyId', async (c) => {
    const slug = c.req.param('slug');
    const keyId = c.req.param('keyId');
    const db = c.env.DB;

    const key = await db
      .prepare(
        `SELECT k.id, k.public_key, k.key_algorithm, k.key_status, k.valid_from, k.valid_until, o.name as org_name, o.slug as org_slug
         FROM issuer_keys k
         JOIN organizations o ON k.organization_id = o.id
         WHERE o.slug = ? AND k.id = ?`
      )
      .bind(slug, keyId)
      .first();

    if (!key) {
      return c.json({ error: 'Issuer key not found' }, 404);
    }

    return c.json({ key });
  });

  // Admin endpoints
  v1.get('/admin/issuers', authMiddleware, async (c) => {
    const user = c.get('user')!;
    if (user.role !== 'platform_admin' && user.role !== 'organization_admin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const db = c.env.DB;
    const orgs = await db
      .prepare(
        `SELECT o.*, COUNT(c.id) as credential_count
         FROM organizations o
         LEFT JOIN credentials c ON o.id = c.organization_id
         GROUP BY o.id
         ORDER BY o.created_at DESC`
      )
      .all();

    return c.json({ issuers: orgs.results });
  });

  v1.post('/admin/issuers/:id/approve', authMiddleware, async (c) => {
    const user = c.get('user')!;
    if (user.role !== 'platform_admin' && user.role !== 'organization_admin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const orgId = c.req.param('id');
    const db = c.env.DB;
    await db.prepare("UPDATE organizations SET approval_status = 'approved', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), orgId).run();
    await logAudit(db, orgId, user.sub, 'APPROVE_ISSUER', 'organization', orgId);
    return c.json({ message: 'Issuer approved successfully' });
  });

  v1.post('/admin/issuers/:id/suspend', authMiddleware, async (c) => {
    const user = c.get('user')!;
    if (user.role !== 'platform_admin' && user.role !== 'organization_admin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const orgId = c.req.param('id');
    const db = c.env.DB;
    await db.prepare("UPDATE organizations SET approval_status = 'suspended', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), orgId).run();
    await logAudit(db, orgId, user.sub, 'SUSPEND_ISSUER', 'organization', orgId);
    return c.json({ message: 'Issuer suspended successfully' });
  });

  v1.get('/admin/audit', authMiddleware, async (c) => {
    const user = c.get('user')!;
    const db = c.env.DB;

    const audits = await db
      .prepare(
        `SELECT a.*, u.email as actor_email, u.display_name as actor_name
         FROM audit_events a
         LEFT JOIN users u ON a.actor_user_id = u.id
         WHERE a.organization_id = ?
         ORDER BY a.created_at DESC
         LIMIT 100`
      )
      .bind(user.orgId)
      .all();

    return c.json({ auditEvents: audits.results });
  });

  // Mount v1 router under /api/v1
  app.route('/api/v1', v1);

  return app;
}
