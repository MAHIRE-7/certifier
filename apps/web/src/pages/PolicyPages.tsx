import React from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-2 text-blue-600">
        <Lock className="w-5 h-5" />
        <span className="text-xs font-semibold uppercase tracking-wider">Privacy & Claims Disclosure</span>
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
      <p className="text-xs text-slate-500">Last updated: October 2026</p>

      <div className="prose prose-slate text-xs leading-relaxed space-y-4 text-slate-700 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">1. Cryptographic Privacy by Design</h3>
        <p>
          Certifier is architected to protect recipient personal data. When digital certificates or badges are issued,
          recipient private email addresses are stored securely on server-side databases solely for issuance administration
          and are <strong>strictly excluded</strong> from the canonical signed payload and public verification endpoints.
        </p>

        <h3 className="text-sm font-bold text-slate-900">2. Publicly Disclosed Claims</h3>
        <p>
          When a credential is authenticated through the public verification endpoint or QR code, only authorized public claims
          are revealed: recipient display name, credential title, issuing organization, event or achievement title,
          issue date, expiration status, and cryptographic signature proof.
        </p>

        <h3 className="text-sm font-bold text-slate-900">3. Data Retention and Revocation</h3>
        <p>
          Issuing organizations maintain administrative control over credentials issued under their authority. If a credential
          is revoked, the verification record reflects the revocation status alongside the mandatory documented reason,
          ensuring third-party verifiers are notified of invalidated awards.
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-2 text-blue-600">
        <FileText className="w-5 h-5" />
        <span className="text-xs font-semibold uppercase tracking-wider">Platform Governance</span>
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
      <p className="text-xs text-slate-500">Last updated: October 2026</p>

      <div className="prose prose-slate text-xs leading-relaxed space-y-4 text-slate-700 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">1. Authorized Issuers</h3>
        <p>
          Only authorized organizations and designated community leads may issue cryptographically signed credentials.
          Organizations are responsible for ensuring that recipient records and workshop awards accurately reflect
          genuine educational or community achievements.
        </p>

        <h3 className="text-sm font-bold text-slate-900">2. Cryptographic Authenticity & Verification</h3>
        <p>
          Certifier validates that signed credential claims match the registered public key of an issuing organization.
          A valid cryptographic signature proves data integrity and origin authenticity; it does not substitute for
          external legal or institutional accreditation.
        </p>

        <h3 className="text-sm font-bold text-slate-900">3. Prohibition of Malicious Use</h3>
        <p>
          Users may not impersonate organizations, forge cryptographic keys, upload malicious payloads, or attempt to
          bypass tenant authorization boundaries. Violations result in immediate suspension of issuer privileges.
        </p>
      </div>
    </div>
  );
};

export const SecurityPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-2 text-emerald-600">
        <ShieldCheck className="w-5 h-5" />
        <span className="text-xs font-semibold uppercase tracking-wider">Architecture & Cryptographic Standards</span>
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Security & Trust Model</h1>
      <p className="text-xs text-slate-500">Last updated: October 2026</p>

      <div className="prose prose-slate text-xs leading-relaxed space-y-4 text-slate-700 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">1. Ed25519 Cryptographic Envelope</h3>
        <p>
          Credentials use the Ed25519 elliptic-curve signature standard. Payloads are canonicalized using RFC 8785
          JSON Canonicalization Scheme (JCS) to eliminate whitespace and key-ordering variance, ensuring consistent
          SHA-256 digest calculation.
        </p>

        <h3 className="text-sm font-bold text-slate-900">2. Key Protection Principles</h3>
        <p>
          Private signing keys are generated server-side using the standard Web Crypto API. Private keys are never
          disclosed in API responses, Git history, generated PDF metadata, or client JavaScript bundles.
        </p>

        <h3 className="text-sm font-bold text-slate-900">3. Independent Public Key Discovery</h3>
        <p>
          Verifiers do not trust unverified public keys embedded in untrusted credential bodies. The verification
          engine resolves the authoritative issuer from the organization registry and verifies claims strictly
          against registered public keys.
        </p>

        <h3 className="text-sm font-bold text-slate-900">4. Immutable Audit Trail</h3>
        <p>
          Key rotation, credential issuance, user authentication, and credential revocation events are logged with
          timestamped audit records to ensure full organizational accountability.
        </p>
      </div>
    </div>
  );
};
