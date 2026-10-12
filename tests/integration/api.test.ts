import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createApiApp } from '../../workers/api/src/app';
import { createLocalSqliteDb } from '../../workers/api/src/db';

describe('Comprehensive End-to-End API Integration & Security Suite', () => {
  let app: ReturnType<typeof createApiApp>;
  let env: any;
  let sqlite: any;
  let adminToken: string;
  let testEventId: string;
  let issuedCredId: string;

  beforeAll(() => {
    // In-memory SQLite for test isolation
    sqlite = new DatabaseSync(':memory:');
    const schemaSql = fs.readFileSync(path.resolve(__dirname, '../../db/migrations/0001_initial_schema.sql'), 'utf8');
    sqlite.exec(schemaSql);

    const seedSql = fs.readFileSync(path.resolve(__dirname, '../../db/seed.sql'), 'utf8');
    sqlite.exec(seedSql);

    const db = createLocalSqliteDb(sqlite);
    app = createApiApp();
    env = {
      DB: db,
      JWT_SECRET: 'test_super_secret_jwt_32bytes_minimum!!',
      PUBLIC_BASE_URL: 'http://localhost:5173',
      ENVIRONMENT: 'test'
    };
  });

  it('verifies seed data is active: Alice Chen credential verifies cryptographically as VALID', async () => {
    const res = await app.request('/api/v1/verify/cred_dev_valid_01', {}, env);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.status).toBe('valid');
    expect(body.credential.recipient_name).toBe('Alice Chen');
    expect(body.credential.signature_valid).toBe(true);
    expect(body.credential.issuer_organization).toBe('OpenTech Foundation');
    // Ensure privacy: private email MUST NOT be exposed in verification payload
    expect(body.credential.recipient_email_private).toBeUndefined();
    expect(body.credential.recipient_email).toBeUndefined();
  });

  it('verifies seed data: Charlie Davis credential reports status as REVOKED with reason', async () => {
    const res = await app.request('/api/v1/verify/cred_dev_revoked_03', {}, env);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.status).toBe('revoked');
    expect(body.credential.revocation_status).toBe('revoked');
    expect(body.credential.revocation_reason).toContain('name spelling correction');
  });

  it('verifies seed data: Diana Prince credential reports status as EXPIRED', async () => {
    const res = await app.request('/api/v1/verify/cred_dev_expired_04', {}, env);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.status).toBe('expired');
  });

  it('authenticates seed admin user with password', async () => {
    const res = await app.request(
      '/api/v1/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@opentech.test',
          password: 'DevAdmin123!'
        })
      },
      env
    );

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe('admin@opentech.test');
    adminToken = body.token;
  });

  it('rejects authentication with invalid password', async () => {
    const res = await app.request(
      '/api/v1/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@opentech.test',
          password: 'WrongPassword999!'
        })
      },
      env
    );
    expect(res.status).toBe(401);
  });

  it('allows authenticated admin to create a new event', async () => {
    const res = await app.request(
      '/api/v1/events',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: 'Cloudflare Workers & Distributed Systems 2026',
          description: 'Deep dive into Edge computing and D1 SQLite architecture',
          event_type: 'workshop',
          start_date: '2026-06-01',
          end_date: '2026-06-03'
        })
      },
      env
    );

    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.event.id).toBeDefined();
    testEventId = body.event.id;
  });

  it('issues a cryptographically signed certificate with QR code and PDF generation', async () => {
    const res = await app.request(
      `/api/v1/events/${testEventId}/credentials/issue`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          recipients: [
            {
              recipient_name: 'David K. Miller',
              recipient_email: 'david.miller@example.com',
              credential_title: 'Cloud Systems Specialist'
            }
          ],
          template_type: 'modern_tech',
          signer_name: 'Sarah Connor',
          signer_title: 'Chief Certification Officer'
        })
      },
      env
    );

    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.credentials.length).toBe(1);
    issuedCredId = body.credentials[0].id;
    expect(body.credentials[0].signature).toBeDefined();

    // Verify immediately via public verification endpoint
    const verifyRes = await app.request(`/api/v1/verify/${issuedCredId}`, {}, env);
    expect(verifyRes.status).toBe(200);
    const verifyBody: any = await verifyRes.json();
    expect(verifyBody.status).toBe('valid');
    expect(verifyBody.credential.recipient_name).toBe('David K. Miller');
    expect(verifyBody.credential.signature_valid).toBe(true);
  });

  it('allows downloading the generated certificate PDF', async () => {
    const res = await app.request(`/api/v1/credentials/${issuedCredId}/download`, {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it('revokes the issued credential with a mandatory reason', async () => {
    const revokeRes = await app.request(
      `/api/v1/credentials/${issuedCredId}/revoke`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          reason: 'Participant requested revocation and replacement'
        })
      },
      env
    );

    expect(revokeRes.status).toBe(200);

    // Verify that public verification now reports REVOKED
    const verifyRes = await app.request(`/api/v1/verify/${issuedCredId}`, {}, env);
    expect(verifyRes.status).toBe(200);
    const verifyBody: any = await verifyRes.json();
    expect(verifyBody.status).toBe('revoked');
    expect(verifyBody.credential.revocation_status).toBe('revoked');
    expect(verifyBody.credential.revocation_reason).toBe('Participant requested revocation and replacement');
  });

  it('CRITICAL SECURITY: if payload data in database is tampered, public verification returns invalid_signature', async () => {
    // Tamper with the stored canonical payload in the database directly
    sqlite.prepare(
      `UPDATE credentials SET payload_json = REPLACE(payload_json, 'Bob Martin', 'Eve Hacker') WHERE id = 'cred_dev_valid_02'`
    ).run();

    const verifyRes = await app.request('/api/v1/verify/cred_dev_valid_02', {}, env);
    expect(verifyRes.status).toBe(422);
    const body: any = await verifyRes.json();
    expect(body.status).toBe('invalid_signature');
    expect(body.message).toContain('Cryptographic signature verification failed');
  });

  it('allows registering a new organization with isolated signing keys', async () => {
    const res = await app.request(
      '/api/v1/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@acme-academy.test',
          password: 'AcmeSecurePass123!',
          displayName: 'Acme Admin',
          organizationName: 'Acme Academy',
          organizationSlug: 'acme-academy'
        })
      },
      env
    );

    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.token).toBeDefined();
    expect(body.user.organization.slug).toBe('acme-academy');
  });
});
