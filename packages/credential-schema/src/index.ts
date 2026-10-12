import { z } from 'zod';
export { canonicalizeJson, computePayloadDigest } from './canonicalize';

export const CredentialTypeSchema = z.enum(['certificate', 'badge']);
export type CredentialType = z.infer<typeof CredentialTypeSchema>;

export const CredentialStatusSchema = z.enum(['active', 'revoked', 'expired']);
export type CredentialStatus = z.infer<typeof CredentialStatusSchema>;

export const VerificationStatusSchema = z.enum([
  'valid',
  'revoked',
  'expired',
  'invalid_signature',
  'untrusted_issuer',
  'not_found',
  'verification_unavailable'
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

/**
 * Deterministic Credential Payload to be signed and verified.
 * Never includes raw recipient email to respect recipient privacy.
 */
export const CredentialPayloadSchema = z.object({
  id: z.string().min(1),
  schema_version: z.literal('1.0.0'),
  credential_type: CredentialTypeSchema,
  issuer_id: z.string().min(1),
  issuer_key_id: z.string().min(1),
  recipient: z.object({
    name: z.string().min(1),
    identifier_hash: z.string().optional()
  }),
  title: z.string().min(1),
  event_or_achievement: z.string().min(1),
  issued_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable(),
  revocation_uri: z.string().url().optional(),
  signature_algorithm: z.literal('Ed25519')
});
export type CredentialPayload = z.infer<typeof CredentialPayloadSchema>;

/**
 * Public Verification API Response Schema
 */
export const PublicVerificationResultSchema = z.object({
  status: VerificationStatusSchema,
  message: z.string(),
  credential: z
    .object({
      id: z.string(),
      title: z.string(),
      credential_type: CredentialTypeSchema,
      recipient_name: z.string(),
      issuer_organization: z.string(),
      issuer_slug: z.string(),
      event_or_achievement: z.string(),
      issued_at: z.string(),
      expires_at: z.string().nullable(),
      revocation_status: z.enum(['active', 'revoked', 'expired']),
      revocation_reason: z.string().nullable().optional(),
      revoked_at: z.string().nullable().optional(),
      issuer_key_id: z.string(),
      issuer_approval_status: z.string(),
      signature_algorithm: z.string(),
      signature_valid: z.boolean(),
      download_available: z.boolean()
    })
    .nullable(),
  cryptographic_details: z
    .object({
      signature_algorithm: z.string(),
      issuer_key_id: z.string(),
      issuer_public_key_spki_base64: z.string(),
      payload_digest_sha256: z.string(),
      signature_hex: z.string()
    })
    .nullable()
});
export type PublicVerificationResult = z.infer<typeof PublicVerificationResultSchema>;

/**
 * CSV Import Row Schema
 */
export const RecipientCsvRowSchema = z.object({
  recipient_name: z.string().min(1, 'Recipient name is required'),
  recipient_email: z.string().email('Invalid email address'),
  credential_title: z.string().min(1, 'Credential title is required'),
  issue_date: z.string().optional(),
  expiration_date: z.string().optional()
});
export type RecipientCsvRow = z.infer<typeof RecipientCsvRowSchema>;

/**
 * Event creation schema
 */
export const CreateEventSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().default(''),
  event_type: z.string().default('workshop'),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});
export type CreateEventInput = z.infer<typeof CreateEventSchema>;

/**
 * Badge Definition schema
 */
export const CreateBadgeDefinitionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  criteria: z.string().min(5, 'Criteria must be at least 5 characters'),
  image_object_key: z.string().default('')
});
export type CreateBadgeDefinitionInput = z.infer<typeof CreateBadgeDefinitionSchema>;
