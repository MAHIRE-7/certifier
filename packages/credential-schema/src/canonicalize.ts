/**
 * Deterministic JSON Canonicalization Scheme (RFC 8785 compliant subset).
 * Ensures that two equivalent objects serialize to the exact same byte string
 * regardless of key ordering or whitespace.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item) => canonicalizeJson(item));
    return `[${items.join(',')}]`;
  }

  // Object: sort keys alphabetically by UTF-16 code units
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs: string[] = [];

  for (const key of keys) {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== undefined && typeof value !== 'function' && typeof value !== 'symbol') {
      pairs.push(`${JSON.stringify(key)}:${canonicalizeJson(value)}`);
    }
  }

  return `{${pairs.join(',')}}`;
}

/**
 * Computes SHA-256 digest in hex encoding for any string using standard Web Crypto API.
 */
export async function computePayloadDigest(canonicalString: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
