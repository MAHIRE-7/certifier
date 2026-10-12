import { describe, it, expect } from 'vitest';
import { canonicalizeJson, computePayloadDigest, CredentialPayload } from '@certifier/credential-schema';
import {
  generateIssuerKeyPair,
  signCredentialPayload,
  verifyCredentialSignature,
  bytesToHex,
  hexToBytes
} from '@certifier/signing';

describe('Ed25519 Cryptographic Credential Signing and Verification', () => {
  it('generates an Ed25519 keypair with valid SPKI and PKCS#8 base64 formats', async () => {
    const keyPair = await generateIssuerKeyPair();
    expect(keyPair.publicKeySpkiBase64).toBeDefined();
    expect(keyPair.privateKeyPkcs8Base64).toBeDefined();
    expect(keyPair.publicKeySpkiBase64.length).toBeGreaterThan(30);
    expect(keyPair.privateKeyPkcs8Base64.length).toBeGreaterThan(40);
  });

  it('canonicalizes JSON deterministically regardless of key order', () => {
    const objA = { z: 1, a: 'hello', m: { y: 2, b: 'world' } };
    const objB = { a: 'hello', m: { b: 'world', y: 2 }, z: 1 };
    expect(canonicalizeJson(objA)).toEqual(canonicalizeJson(objB));
  });

  it('signs and verifies a valid credential payload', async () => {
    const keyPair = await generateIssuerKeyPair();
    const payload: CredentialPayload = {
      id: 'cred_test_001',
      schema_version: '1.0.0',
      credential_type: 'certificate',
      issuer_id: 'opentech',
      issuer_key_id: 'key_001',
      recipient: { name: 'Alice Chen' },
      title: 'Certified Rust Developer',
      event_or_achievement: 'Rust Systems Intensive 2026',
      issued_at: '2026-03-15T10:00:00.000Z',
      expires_at: null,
      revocation_uri: 'https://certifier.platform.test/api/v1/verify/cred_test_001',
      signature_algorithm: 'Ed25519'
    };

    const signResult = await signCredentialPayload(payload, keyPair.privateKeyPkcs8Base64);
    expect(signResult.signatureHex).toBeDefined();
    expect(signResult.payloadDigestHex).toBeDefined();

    // Verification must succeed
    const isValid = await verifyCredentialSignature(
      payload,
      signResult.signatureHex,
      keyPair.publicKeySpkiBase64
    );
    expect(isValid).toBe(true);
  });

  it('CRITICAL SECURITY: fails verification if recipient name is tampered with', async () => {
    const keyPair = await generateIssuerKeyPair();
    const payload: CredentialPayload = {
      id: 'cred_test_tamper_01',
      schema_version: '1.0.0',
      credential_type: 'certificate',
      issuer_id: 'opentech',
      issuer_key_id: 'key_001',
      recipient: { name: 'Alice Chen' },
      title: 'Certified Rust Developer',
      event_or_achievement: 'Rust Systems Intensive 2026',
      issued_at: '2026-03-15T10:00:00.000Z',
      expires_at: null,
      signature_algorithm: 'Ed25519'
    };

    const signResult = await signCredentialPayload(payload, keyPair.privateKeyPkcs8Base64);

    // Tampered payload with different name
    const tamperedPayload = {
      ...payload,
      recipient: { name: 'Eve Malicious' }
    };

    const isValid = await verifyCredentialSignature(
      tamperedPayload,
      signResult.signatureHex,
      keyPair.publicKeySpkiBase64
    );
    expect(isValid).toBe(false);
  });

  it('CRITICAL SECURITY: fails verification if issue date is modified', async () => {
    const keyPair = await generateIssuerKeyPair();
    const payload: CredentialPayload = {
      id: 'cred_test_tamper_02',
      schema_version: '1.0.0',
      credential_type: 'certificate',
      issuer_id: 'opentech',
      issuer_key_id: 'key_001',
      recipient: { name: 'Alice Chen' },
      title: 'Certified Rust Developer',
      event_or_achievement: 'Rust Systems Intensive 2026',
      issued_at: '2026-03-15T10:00:00.000Z',
      expires_at: null,
      signature_algorithm: 'Ed25519'
    };

    const signResult = await signCredentialPayload(payload, keyPair.privateKeyPkcs8Base64);

    const tamperedPayload = {
      ...payload,
      issued_at: '2020-01-01T00:00:00.000Z'
    };

    const isValid = await verifyCredentialSignature(
      tamperedPayload,
      signResult.signatureHex,
      keyPair.publicKeySpkiBase64
    );
    expect(isValid).toBe(false);
  });

  it('CRITICAL SECURITY: fails verification when checked against a different public key', async () => {
    const keyPairA = await generateIssuerKeyPair();
    const keyPairB = await generateIssuerKeyPair();

    const payload: CredentialPayload = {
      id: 'cred_test_tamper_03',
      schema_version: '1.0.0',
      credential_type: 'certificate',
      issuer_id: 'opentech',
      issuer_key_id: 'key_001',
      recipient: { name: 'Alice Chen' },
      title: 'Certified Rust Developer',
      event_or_achievement: 'Rust Systems Intensive 2026',
      issued_at: '2026-03-15T10:00:00.000Z',
      expires_at: null,
      signature_algorithm: 'Ed25519'
    };

    const signResult = await signCredentialPayload(payload, keyPairA.privateKeyPkcs8Base64);

    const isValid = await verifyCredentialSignature(
      payload,
      signResult.signatureHex,
      keyPairB.publicKeySpkiBase64
    );
    expect(isValid).toBe(false);
  });

  it('CRITICAL SECURITY: fails verification on malformed signature hex', async () => {
    const keyPair = await generateIssuerKeyPair();
    const payload: CredentialPayload = {
      id: 'cred_test_malformed',
      schema_version: '1.0.0',
      credential_type: 'certificate',
      issuer_id: 'opentech',
      issuer_key_id: 'key_001',
      recipient: { name: 'Alice Chen' },
      title: 'Certified Rust Developer',
      event_or_achievement: 'Rust Systems Intensive 2026',
      issued_at: '2026-03-15T10:00:00.000Z',
      expires_at: null,
      signature_algorithm: 'Ed25519'
    };

    const isValid = await verifyCredentialSignature(
      payload,
      'deadbeef00000000',
      keyPair.publicKeySpkiBase64
    );
    expect(isValid).toBe(false);
  });
});
