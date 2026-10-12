import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, ShieldCheck, KeyRound, Award, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export const IssuerProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .getPublicIssuer(slug)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Issuer profile not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading issuer registry information...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Issuer Not Found</h1>
        <p className="text-xs text-slate-600">{error}</p>
        <Link to="/" className="inline-block text-xs text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  const { issuer, publicKeys, credentials } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Issuer Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{issuer.name}</h1>
                <StatusBadge status={issuer.approval_status} />
              </div>
              <p className="text-xs font-mono text-slate-500 mt-1">slug: {issuer.slug}</p>
              <p className="text-xs text-slate-600 mt-2 max-w-xl leading-relaxed">
                {issuer.description || 'Verified organization issuing cryptographic credentials on Certifier.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Public Key Discovery Registry */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Registered Ed25519 Public Keys</h2>
        </div>
        <p className="text-xs text-slate-500">
          Historical and active public keys published for cryptographic verification. Private keys are never disclosed.
        </p>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Key ID</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Algorithm</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Valid From</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Public Key (SPKI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {publicKeys.map((k: any) => (
                <tr key={k.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{k.id}</td>
                  <td className="px-4 py-3 text-slate-600">{k.key_algorithm}</td>
                  <td className="px-4 py-3 font-sans">
                    <StatusBadge status={k.key_status} showIcon={false} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-sans">{k.valid_from.split('T')[0]}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={k.public_key}>
                    {k.public_key.slice(0, 32)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Publicly Issued Credentials */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Recent Public Credentials</h2>
        </div>

        {credentials.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No public credentials currently published.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {credentials.map((c: any) => (
              <Link
                key={c.id}
                to={`/verify/${c.id}`}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-blue-600">{c.credential_type}</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{c.title}</div>
                  <div className="text-xs text-slate-600 mt-1">Recipient: {c.recipient_name}</div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-200/60">
                  <span>Issued: {c.issued_at.split('T')[0]}</span>
                  <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                    Verify <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
