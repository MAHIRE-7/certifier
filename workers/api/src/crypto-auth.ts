import { bytesToHex, hexToBytes, bytesToBase64, base64ToBytes } from '@certifier/signing';

export interface SessionPayload {
  sub: string;
  email: string;
  orgId: string;
  role: 'platform_admin' | 'organization_admin' | 'issuer';
  exp: number;
}

/**
 * Hashes a password using PBKDF2 with SHA-256 and a random 16-byte salt via WebCrypto.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const saltHex = bytesToHex(salt);
  const hashHex = bytesToHex(new Uint8Array(derivedBits));

  return `pbkdf2:100000:${saltHex}:${hashHex}`;
}

/**
 * Verifies a password against a stored PBKDF2 hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    return false;
  }

  const iterations = parseInt(parts[1], 10);
  const salt = hexToBytes(parts[2]);
  const expectedHashHex = parts[3];

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const actualHashHex = bytesToHex(new Uint8Array(derivedBits));
  return actualHashHex === expectedHashHex;
}

/**
 * Signs a session payload using HMAC-SHA256 via WebCrypto.
 */
export async function createSessionToken(
  payload: SessionPayload,
  secret: string
): Promise<string> {
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = bytesToBase64(new TextEncoder().encode(payloadJson));

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(payloadBase64)
  );

  const sigBase64 = bytesToBase64(new Uint8Array(sigBuffer));
  return `${payloadBase64}.${sigBase64}`;
}

/**
 * Verifies an HMAC-SHA256 session token.
 */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, sigBase64] = parts;
    const enc = new TextEncoder();

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = base64ToBytes(sigBase64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as any,
      enc.encode(payloadBase64)
    );

    if (!isValid) return null;

    const payloadBytes = base64ToBytes(payloadBase64);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson) as SessionPayload;

    // Check expiration
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
