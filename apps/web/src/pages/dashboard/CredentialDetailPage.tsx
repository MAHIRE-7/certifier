import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Download,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  FileText,
  Clock,
  History,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { api, API_BASE } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';

export const CredentialDetailPage: React.FC = () => {
  const { credentialId } = useParams<{ credentialId: string }>();
  const [credential, setCredential] = useState<any | null>(null);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Revocation Modal state
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState<string | null>(null);

  const loadData = () => {
    if (!credentialId) return;
    setLoading(true);
    api
      .getCredential(credentialId)
      .then((res) => {
        setCredential(res.credential);
        setAuditHistory(res.auditHistory);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [credentialId]);

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialId || revokeReason.trim().length < 5) return;
    setRevoking(true);
    setError(null);

    try {
      await api.revokeCredential(credentialId, revokeReason);
      setRevokeSuccess('Credential has been successfully revoked and marked invalidated in public registry.');
      setShowRevokeModal(false);
      setRevokeReason('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke credential');
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading credential details...</div>;
  }

  if (error && !credential) {
    return <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-lg">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          to="/dashboard/credentials"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Credentials</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                {credential.credential_type}
              </span>
              <StatusBadge status={credential.status} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{credential.title}</h1>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{credential.id}</p>
          </div>

          <div className="flex items-center gap-2">
            {credential.credential_type === 'certificate' && credential.status !== 'revoked' && (
              <a
                href={`${API_BASE}/credentials/${credential.id}/download`}
                download
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>
            )}

            <Link
              to={`/verify/${credential.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <span>Public Verify Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {credential.status !== 'revoked' && (
              <button
                type="button"
                onClick={() => setShowRevokeModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg transition"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Revoke Credential</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {revokeSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{revokeSuccess}</span>
        </div>
      )}

      {credential.status === 'revoked' && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-900 rounded-xl space-y-1">
          <div className="font-bold text-rose-700 uppercase tracking-wider text-[11px]">Revocation Record</div>
          <div>Reason: {credential.revocation_reason}</div>
          {credential.revoked_at && (
            <div className="text-rose-600 text-[11px]">Revoked at: {new Date(credential.revoked_at).toLocaleString()}</div>
          )}
        </div>
      )}

      {/* Recipient and Event Metadata */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Credential Claims</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Recipient Name (Public)</div>
            <div className="font-semibold text-slate-900 text-sm mt-0.5">{credential.recipient_name}</div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Recipient Email (Internal Private)</div>
            <div className="font-mono text-slate-700 text-xs mt-0.5">{credential.recipient_email_private}</div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Associated Event / Workshop</div>
            <div className="font-semibold text-slate-900 text-sm mt-0.5">
              {credential.event_title || 'Direct Award'}
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Issued Timestamp</div>
            <div className="text-slate-700 mt-0.5">{new Date(credential.issued_at).toLocaleString()}</div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Expiration Timestamp</div>
            <div className="text-slate-700 mt-0.5">
              {credential.expires_at ? new Date(credential.expires_at).toLocaleString() : 'Does not expire'}
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Signing Key ID</div>
            <div className="font-mono text-slate-700 text-[11px] mt-0.5">{credential.issuer_key_id}</div>
          </div>
        </div>
      </div>

      {/* Cryptographic Signature & Canonical Payload */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Signed Canonical Payload (RFC 8785)</h2>
        </div>
        <p className="text-xs text-slate-500">
          This exact deterministic string was hashed with SHA-256 and signed with the organization’s Ed25519 private key.
        </p>

        <div className="space-y-3 text-xs">
          <div>
            <div className="text-slate-500 font-medium mb-1">Payload JSON:</div>
            <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
              {credential.payload_json}
            </pre>
          </div>

          <div>
            <div className="text-slate-500 font-medium mb-1">SHA-256 Payload Digest:</div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-800 break-all">
              {credential.payload_digest}
            </div>
          </div>

          <div>
            <div className="text-slate-500 font-medium mb-1">Raw Ed25519 Signature Value:</div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-800 break-all">
              {credential.signature_value}
            </div>
          </div>
        </div>
      </div>

      {/* Audit History */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-600" />
          <h2 className="text-sm font-bold text-slate-900">Audit History</h2>
        </div>

        {auditHistory.length === 0 ? (
          <p className="text-xs text-slate-400">No audit events recorded for this credential.</p>
        ) : (
          <div className="space-y-2">
            {auditHistory.map((item) => (
              <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-800">{item.action}</span>
                  {item.reason && <span className="text-slate-600 ml-2">— {item.reason}</span>}
                </div>
                <div className="text-slate-400 text-[11px] font-mono">
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revocation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Revoke Credential</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Revoking a credential marks it permanently invalid in the public registry. Anyone scanning the QR code
              or verifying the ID will see that the award has been revoked along with the reason you provide.
            </p>

            <form onSubmit={handleRevokeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Revocation Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Issued in error, name change requested, or code of conduct violation..."
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRevokeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revoking || revokeReason.trim().length < 5}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {revoking ? 'Revoking...' : 'Confirm Revocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
