import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Download,
  Calendar,
  Building2,
  Award,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { api, API_BASE } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export const VerifyDetailPage: React.FC = () => {
  const { credentialId } = useParams<{ credentialId: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!credentialId) return;
    setLoading(true);
    setError(null);

    api
      .verifyCredential(credentialId)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(err.message || 'Verification service failed to query the registry.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [credentialId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Verifying cryptographic signature & issuer registry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Verification Error / Not Found</h1>
        <p className="text-sm text-slate-600">
          {error || 'The credential record could not be located in the authoritative registry.'}
        </p>
        <div className="pt-2">
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Try another Credential ID
          </Link>
        </div>
      </div>
    );
  }

  const { status, message, credential, cryptographic_details } = data;
  const isSignatureValid = status === 'valid';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Top Back Link */}
      <div>
        <Link
          to="/verify"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Verification Search</span>
        </Link>
      </div>

      {/* Main Status Header Card */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border ${
          status === 'valid'
            ? 'bg-emerald-50/60 border-emerald-200'
            : status === 'revoked'
            ? 'bg-rose-50/60 border-rose-200'
            : status === 'expired'
            ? 'bg-amber-50/60 border-amber-200'
            : 'bg-red-50/60 border-red-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                status === 'valid'
                  ? 'bg-emerald-600 text-white'
                  : status === 'revoked'
                  ? 'bg-rose-600 text-white'
                  : status === 'expired'
                  ? 'bg-amber-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {status === 'valid' ? (
                <ShieldCheck className="w-7 h-7" />
              ) : status === 'revoked' ? (
                <ShieldAlert className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {status === 'valid'
                    ? 'Authentic Verified Credential'
                    : status === 'revoked'
                    ? 'Revoked Credential'
                    : status === 'expired'
                    ? 'Expired Credential'
                    : 'Invalid Signature (Tampered)'}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">{message}</p>
            </div>
          </div>

          <div className="shrink-0">
            <StatusBadge status={status} />
          </div>
        </div>

        {/* If Revoked: Banner with Reason */}
        {status === 'revoked' && credential?.revocation_reason && (
          <div className="mt-5 p-3.5 bg-rose-100/70 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1">
            <div className="font-semibold uppercase tracking-wider text-[11px] text-rose-700">Revocation Notice:</div>
            <div>{credential.revocation_reason}</div>
            {credential.revoked_at && (
              <div className="text-[11px] text-rose-600">
                Revoked on {new Date(credential.revoked_at).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Credential Details Grid */}
      {credential && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  {credential.credential_type === 'certificate' ? 'Verified Certificate' : 'Digital Badge'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                  {credential.title}
                </h2>
              </div>

              {/* Download Action */}
              {credential.download_available && status !== 'revoked' && (
                <a
                  href={`${API_BASE}/credentials/${credential.id}/download`}
                  download
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Certificate</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
              <div>
                <div className="text-xs font-medium text-slate-400">Awarded To (Recipient)</div>
                <div className="text-base font-semibold text-slate-900 mt-0.5">{credential.recipient_name}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-400">Issuer Organization</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Link
                    to={`/issuers/${credential.issuer_slug}`}
                    className="text-base font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>{credential.issuer_organization}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-400">Event / Achievement</div>
                <div className="text-base font-semibold text-slate-900 mt-0.5">{credential.event_or_achievement}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-400">Issue Date</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">
                  {credential.issued_at.split('T')[0]}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-400">Expiration Date</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">
                  {credential.expires_at ? credential.expires_at.split('T')[0] : 'Does not expire'}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-400">Credential Identifier</div>
                <div className="text-xs font-mono font-medium text-slate-800 mt-1 break-all bg-slate-50 p-1.5 rounded border border-slate-200">
                  {credential.id}
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Proof Details */}
          {cryptographic_details && (
            <div className="p-6 sm:p-8 bg-slate-50 space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cryptographic Signature Proof
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-500 font-medium mb-1">Algorithm & Standard:</div>
                  <div className="font-mono bg-white p-2 rounded border border-slate-200 text-slate-800 flex items-center justify-between">
                    <span>{cryptographic_details.signature_algorithm} / RFC 8785 Canonical JSON Envelope</span>
                    <span className="text-[11px] font-semibold text-emerald-600">WebCrypto Compliant</span>
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 font-medium mb-1">Issuer Key ID:</div>
                  <div className="font-mono bg-white p-2 rounded border border-slate-200 text-slate-800">
                    {cryptographic_details.issuer_key_id}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 font-medium mb-1">Signed Payload SHA-256 Digest:</div>
                  <div className="font-mono bg-white p-2 rounded border border-slate-200 text-slate-800 break-all">
                    {cryptographic_details.payload_digest_sha256}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 font-medium mb-1 flex items-center justify-between">
                    <span>Issuer Public Key (SPKI Base64):</span>
                    <button
                      onClick={() => copyToClipboard(cryptographic_details.issuer_public_key_spki_base64)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold text-[11px]"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey ? 'Copied' : 'Copy Public Key'}</span>
                    </button>
                  </div>
                  <div className="font-mono bg-white p-2 rounded border border-slate-200 text-slate-700 break-all text-[11px] select-all">
                    {cryptographic_details.issuer_public_key_spki_base64}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 font-medium mb-1">Raw Signature (Ed25519 Hex):</div>
                  <div className="font-mono bg-white p-2 rounded border border-slate-200 text-slate-700 break-all text-[11px]">
                    {cryptographic_details.signature_hex}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
