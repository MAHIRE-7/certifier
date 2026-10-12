import { canonicalizeJson, computePayloadDigest, CredentialPayload } from '@certifier/credential-schema';
import { bytesToBase64, base64ToBytes, bytesToHex, hexToBytes } from './utils';

export * from './utils';

export interface KeyPairResult {
  publicKeySpkiBase64: string;
  privateKeyPkcs8Base64: string;
}

export interface SignResult {
  signatureHex: string;
  signatureBase64: string;
  canonicalString: string;
  payloadDigestHex: string;
}

/**
 * Generates an Ed25519 signing keypair using standard Web Crypto API.
 */
export async function generateIssuerKeyPair(): Promise<KeyPairResult> {
  const keyPair = (await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair;

  const spkiBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8Buffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKeySpkiBase64: bytesToBase64(new Uint8Array(spkiBuffer)),
    privateKeyPkcs8Base64: bytesToBase64(new Uint8Array(pkcs8Buffer))
  };
}

/**
 * Imports an Ed25519 private key from PKCS#8 base64.
 */
export async function importPrivateKey(pkcs8Base64: string): Promise<CryptoKey> {
  const bytes = base64ToBytes(pkcs8Base64);
  return crypto.subtle.importKey(
    'pkcs8',
    bytes as any,
    { name: 'Ed25519' },
    false,
    ['sign']
  );
}

/**
 * Imports an Ed25519 public key from SPKI base64.
 */
export async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
  const bytes = base64ToBytes(spkiBase64);
  return crypto.subtle.importKey(
    'spki',
    bytes as any,
    { name: 'Ed25519' },
    true,
    ['verify']
  );
}

/**
 * Signs a credential payload deterministically.
 */
export async function signCredentialPayload(
  payload: CredentialPayload,
  privateKeyPkcs8Base64: string
): Promise<SignResult> {
  const canonicalString = canonicalizeJson(payload);
  const payloadDigestHex = await computePayloadDigest(canonicalString);

  const privateKey = await importPrivateKey(privateKeyPkcs8Base64);
  const data = new TextEncoder().encode(canonicalString);

  const signatureBuffer = await crypto.subtle.sign(
    { name: 'Ed25519' },
    privateKey,
    data
  );

  const signatureBytes = new Uint8Array(signatureBuffer);

  return {
    signatureHex: bytesToHex(signatureBytes),
    signatureBase64: bytesToBase64(signatureBytes),
    canonicalString,
    payloadDigestHex
  };
}

/**
 * Verifies a credential signature against canonicalized payload and public key.
 */
export async function verifyCredentialSignature(
  payload: CredentialPayload | string,
  signatureHex: string,
  publicKeySpkiBase64: string
): Promise<boolean> {
  try {
    const canonicalString = typeof payload === 'string' ? payload : canonicalizeJson(payload);
    const publicKey = await importPublicKey(publicKeySpkiBase64);
    const signatureBytes = hexToBytes(signatureHex);
    const data = new TextEncoder().encode(canonicalString);

    return await crypto.subtle.verify(
      { name: 'Ed25519' },
      publicKey,
      signatureBytes as any,
      data
    );
  } catch (err) {
    // Malformed signature or invalid key should fail verification safely
    return false;
  }
}
