# Credential Envelope & Signature Specification

## 1. Canonical Payload Specification

To guarantee that signatures produce identical mathematical results regardless of JSON serializer differences, whitespace, or object key ordering, all credential payloads are canonicalized using a subset of **RFC 8785 (JSON Canonicalization Scheme - JCS)**.

### Canonical Serialization Rules
1. Whitespace outside string literals is completely removed.
2. Object properties are sorted lexicographically by UTF-16 code units.
3. String literals are UTF-8 encoded with standard JSON character escaping.
4. Numbers are represented without trailing zeroes.
5. Boolean literals are lowercase `true` or `false`.
6. `undefined`, functions, and symbols are omitted.

---

## 2. Credential Payload Schema

```json
{
  "id": "cred_dev_valid_01",
  "schema_version": "1.0.0",
  "credential_type": "certificate",
  "issuer_id": "opentech",
  "issuer_key_id": "key_opentech_2026",
  "recipient": {
    "name": "Alice Chen"
  },
  "title": "Certified Systems Architect",
  "event_or_achievement": "Modern Distributed Systems & WebAssembly Workshop",
  "issued_at": "2026-03-15T10:00:00.000Z",
  "expires_at": null,
  "revocation_uri": "https://certifier.platform.test/api/v1/verify/cred_dev_valid_01",
  "signature_algorithm": "Ed25519"
}
```

> **Privacy Note:** Notice that recipient email addresses are never included in the signed payload.

---

## 3. Cryptographic Signature Process

1. **Serialize to Canonical String:**
   ```ts
   const canonicalString = canonicalizeJson(payload);
   ```

2. **Compute SHA-256 Digest:**
   ```ts
   const digestBuffer = await crypto.subtle.digest(
     'SHA-256',
     new TextEncoder().encode(canonicalString)
   );
   const payloadDigestHex = bytesToHex(new Uint8Array(digestBuffer));
   ```

3. **Sign with Ed25519 Private Key:**
   ```ts
   const signatureBuffer = await crypto.subtle.sign(
     { name: 'Ed25519' },
     privateKey,
     new TextEncoder().encode(canonicalString)
   );
   const signatureHex = bytesToHex(new Uint8Array(signatureBuffer));
   ```

4. **Store in Database:**
   - Canonical payload string stored in `credentials.payload_json`.
   - SHA-256 digest stored in `credentials.payload_digest`.
   - Signature hex stored in `credential_signatures.signature_value`.

---

## 4. Verification Algorithm

```ts
async function verifyCredential(
  canonicalPayloadString: string,
  signatureHex: string,
  publicKeySpkiBase64: string
): Promise<boolean> {
  // 1. Import trusted public key from issuer registry
  const publicKey = await crypto.subtle.importKey(
    'spki',
    base64ToBytes(publicKeySpkiBase64),
    { name: 'Ed25519' },
    true,
    ['verify']
  );

  // 2. Decode raw signature bytes
  const signatureBytes = hexToBytes(signatureHex);
  const dataBytes = new TextEncoder().encode(canonicalPayloadString);

  // 3. Verify via WebCrypto
  return await crypto.subtle.verify(
    { name: 'Ed25519' },
    publicKey,
    signatureBytes,
    dataBytes
  );
}
```
