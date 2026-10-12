import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Github, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-slate-900 tracking-tight">Certifier</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Open-source infrastructure for cryptographically verifiable digital credentials, workshops, and badges.
              Built for Cloudflare Pages, Workers, D1, and R2.
            </p>
          </div>

          {/* Verification */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Verification</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/verify" className="hover:text-blue-600 transition">
                  Public Certificate Verification
                </Link>
              </li>
              <li>
                <Link to="/issuers/opentech" className="hover:text-blue-600 transition">
                  Issuer Registry & Public Keys
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-blue-600 transition">
                  Cryptographic Trust Model
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/login" className="hover:text-blue-600 transition">
                  Issuer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-600 transition">
                  Register Organization
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-blue-600 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-blue-600 transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Open Source */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Open Source</h4>
            <p className="text-xs text-slate-500 mb-3">
              Independent, self-hostable credential infrastructure. Zero vendor lock-in.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Github className="w-4 h-4" />
              <span>MIT Licensed</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Certifier Project. Cryptographic signatures adhere to Ed25519 standard.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-slate-600 transition">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-600 transition">Terms</Link>
            <Link to="/security" className="hover:text-slate-600 transition">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
