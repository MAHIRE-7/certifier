import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { KeyRound, Building2, ShieldCheck, Copy, Check, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [issuerData, setIssuerData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!user?.organization.slug) return;
    api
      .getPublicIssuer(user.organization.slug)
      .then((res) => setIssuerData(res))
      .finally(() => setLoading(false));
  }, [user]);

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization & Key Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage issuer identity, approval status, and Ed25519 cryptographic keys</p>
      </div>

      {/* Organization Details */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Organization Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Organization Name</div>
            <div className="font-semibold text-slate-900 text-sm mt-0.5">{user.organization.name}</div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Canonical Slug</div>
            <div className="font-mono text-slate-700 text-xs mt-0.5">{user.organization.slug}</div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Issuer Approval Status</div>
            <div className="mt-1">
              <StatusBadge status={user.organization.approvalStatus || 'approved'} />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <a
            href={`/issuers/${user.organization.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold"
          >
            <span>View Public Issuer Directory Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Cryptographic Keys */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <KeyRound className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Active Ed25519 Signing Keys</h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Your organization's Ed25519 public key is published in the global registry. Third-party verifiers use this
          public key to cryptographically validate certificate signatures without contacting proprietary servers.
        </p>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading public keys...</div>
        ) : issuerData?.publicKeys?.length > 0 ? (
          <div className="space-y-4">
            {issuerData.publicKeys.map((k: any) => (
              <div key={k.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{k.id}</span>
                    <span className="ml-2 font-mono text-slate-500 text-[11px]">{k.key_algorithm}</span>
                  </div>
                  <StatusBadge status={k.key_status} showIcon={false} />
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span>Public Key (SPKI Base64):</span>
                    <button
                      onClick={() => copyKey(k.public_key)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold text-[11px]"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-800 break-all select-all">
                    {k.public_key}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Valid from: {new Date(k.valid_from).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No public keys found.</p>
        )}
      </div>

      {/* Security & Key Rotation Documentation Notice */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Key Protection & Rotation Semantics
        </div>
        <p className="leading-relaxed">
          Production private signing keys never leave the server-side signing environment. In case of key rotation,
          historical public keys remain published so existing credentials remain verifiable. If a key is retired or
          compromised, it is marked accordingly in the audit log.
        </p>
      </div>
    </div>
  );
};
