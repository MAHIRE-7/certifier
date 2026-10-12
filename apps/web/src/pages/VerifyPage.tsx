import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, ArrowRight, ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react';

export const VerifyPage: React.FC = () => {
  const [credentialId, setCredentialId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = credentialId.trim();
    if (!clean) {
      setError('Please enter a credential identifier or verification URL.');
      return;
    }

    const match = clean.match(/\/verify\/([a-zA-Z0-9_-]+)/);
    const targetId = match ? match[1] : clean;
    navigate(`/verify/${targetId}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Independent Authoritative Verification</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Verify a Digital Credential
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Enter any certificate ID or paste a QR code verification link to validate its cryptographic signature
          against the registered issuer key.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="cred-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Credential ID or URL
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="cred-input"
                type="text"
                value={credentialId}
                onChange={(e) => {
                  setCredentialId(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. cred_dev_valid_01 or https://certifier.platform.test/verify/cred_dev_valid_01"
                className="w-full pl-11 pr-4 py-3 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {error && <p className="text-xs text-rose-600 mt-2 font-medium">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <span>Run Cryptographic Verification</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Sample test credentials (from seed data):
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => navigate('/verify/cred_dev_valid_01')}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition"
            >
              cred_dev_valid_01 (Valid Active)
            </button>
            <button
              onClick={() => navigate('/verify/cred_dev_revoked_03')}
              className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-mono transition"
            >
              cred_dev_revoked_03 (Revoked)
            </button>
            <button
              onClick={() => navigate('/verify/cred_dev_expired_04')}
              className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-mono transition"
            >
              cred_dev_expired_04 (Expired)
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          What gets verified?
        </h3>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
          <li><strong>Cryptographic Signature:</strong> Validates Ed25519 signature over canonical RFC 8785 JSON claims.</li>
          <li><strong>Issuer Identity:</strong> Confirms the signing key belongs to an approved, active organization.</li>
          <li><strong>Revocation Status:</strong> Checks if the credential was marked revoked by the issuer.</li>
          <li><strong>Expiration:</strong> Validates current timestamp against any configured expiration date.</li>
          <li><strong>Privacy Safeguard:</strong> Recipient private emails are never exposed over public endpoints.</li>
        </ul>
      </div>
    </div>
  );
};
