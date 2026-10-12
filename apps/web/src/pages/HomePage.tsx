import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  KeyRound,
  FileCheck2,
  FileText,
  Search,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Lock,
  Layers,
  Database
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [searchId, setSearchId] = useState('');
  const navigate = useNavigate();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchId.trim();
    if (!clean) return;
    // Extract ID if a full URL was pasted
    const match = clean.match(/\/verify\/([a-zA-Z0-9_-]+)/);
    const targetId = match ? match[1] : clean;
    navigate(`/verify/${targetId}`);
  };

  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center px-4 space-y-6 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Independent Digital Credential Infrastructure</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Issue credentials. <br />
          <span className="text-blue-600">Verify authenticity.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Open-source platform for cryptographically verifiable certificates and achievement badges.
          Built for technical workshops, student communities, and verified training events with Ed25519 signatures.
        </p>

        {/* Verification Form Box */}
        <div className="max-w-xl mx-auto pt-4">
          <form
            onSubmit={handleVerify}
            className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-xl shadow-md border border-slate-200"
          >
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Credential ID (e.g. cred_dev_valid_01) or URL"
                className="w-full pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition shrink-0"
            >
              Verify Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Seed demo quick links */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span>Try sample credentials:</span>
            <button
              type="button"
              onClick={() => navigate('/verify/cred_dev_valid_01')}
              className="text-blue-600 hover:underline font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
            >
              cred_dev_valid_01 (Active)
            </button>
            <button
              type="button"
              onClick={() => navigate('/verify/cred_dev_revoked_03')}
              className="text-rose-600 hover:underline font-mono bg-rose-50 px-2 py-0.5 rounded border border-rose-100"
            >
              cred_dev_revoked_03 (Revoked)
            </button>
            <button
              type="button"
              onClick={() => navigate('/verify/cred_dev_expired_04')}
              className="text-amber-600 hover:underline font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-100"
            >
              cred_dev_expired_04 (Expired)
            </button>
          </div>
        </div>

        {/* Primary and Secondary CTA */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            Verify a Certificate
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition"
          >
            <KeyRound className="w-4 h-4 text-blue-600" />
            Issuer Dashboard
          </Link>
        </div>
      </section>

      {/* Feature Principles Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Trust built on cryptography, not databases alone
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            A certificate ID or QR code alone is never proof of authenticity.
            Certifier provides tamper-evident cryptographic validation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Ed25519 WebCrypto Signatures</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every credential is deterministically serialized according to RFC 8785 canonical JSON and signed using
              the issuer’s Ed25519 private key. Public verification requires zero login.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Immediate Tamper Detection</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Altering a recipient name, date, or issuer ID causes immediate signature mismatch.
              Tampered claims fail verification instantaneously.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Distinct Statuses & Revocation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Active, Revoked, Expired, and Invalid signatures are distinguished authoritatively.
              Revocation requires an audited reason and takes effect immediately.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Server-Side PDF & QR Generation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generates landscape A4 certificates in Modern Tech and Minimal Professional templates.
              High-resolution QR codes link directly to canonical verification endpoints.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Digital Achievement Badges</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create modular badge definitions and issue cryptographic badge awards with criteria,
              timestamps, and issuer attribution.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Free-Tier Cloudflare Architecture</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Engineered specifically for Cloudflare Pages, Workers, D1 (SQLite), and R2 storage.
              Operate robust workshops and communities without expensive recurring infrastructure bills.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How Cryptographic Verification Works</h2>
            <p className="text-sm text-slate-500 mt-2">
              Three-stage trust validation: Authoritative database, issuer key discovery, and WebCrypto signature execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-slate-200 p-6 rounded-xl bg-slate-50/50 space-y-3">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 1</div>
              <h3 className="font-semibold text-slate-900 text-sm">Deterministic Payload Canonicalization</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When a certificate is issued, recipient claims and workshop metadata are serialized into
                a strict RFC 8785 canonical string and hashed with SHA-256.
              </p>
            </div>

            <div className="border border-slate-200 p-6 rounded-xl bg-slate-50/50 space-y-3">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 2</div>
              <h3 className="font-semibold text-slate-900 text-sm">Ed25519 Signature Generation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The issuer's server-side private key signs the canonical payload. Private keys never leave
                the protected worker environment and are never exposed in Git, PDFs, or client responses.
              </p>
            </div>

            <div className="border border-slate-200 p-6 rounded-xl bg-slate-50/50 space-y-3">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 3</div>
              <h3 className="font-semibold text-slate-900 text-sm">Public Key Resolution & Mathematical Check</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Anyone scanning the QR code or visiting the verification URL retrieves the approved issuer's registered
                public key and independently validates the cryptographic signature.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Issuer Onboarding CTA */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <div className="p-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to issue tamper-proof certificates for your event?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
            Create an organization, generate isolated Ed25519 signing keys, upload participants via CSV, and issue
            downloadable PDF certificates with embedded QR codes in seconds.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow transition"
            >
              Get Started as an Issuer
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
