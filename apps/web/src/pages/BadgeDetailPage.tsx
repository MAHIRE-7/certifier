import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Award, CheckCircle2, ArrowLeft, Building2 } from 'lucide-react';
import { api } from '../api/client';

export const BadgeDetailPage: React.FC = () => {
  const { badgeId } = useParams<{ badgeId: string }>();
  const [loading, setLoading] = useState(true);
  const [badge, setBadge] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!badgeId) return;
    setLoading(true);
    api
      .getPublicBadge(badgeId)
      .then((res) => setBadge(res.badge))
      .catch((err) => setError(err.message || 'Badge definition not found'))
      .finally(() => setLoading(false));
  }, [badgeId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading badge definition...</p>
      </div>
    );
  }

  if (error || !badge) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Badge Not Found</h1>
        <p className="text-xs text-slate-600">{error}</p>
        <Link to="/" className="text-xs text-blue-600 hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </Link>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Digital Achievement Badge
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">{badge.name}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Issued by:</span>
              <Link to={`/issuers/${badge.organization_slug}`} className="font-semibold text-blue-600 hover:underline">
                {badge.organization_name}
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Description</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{badge.description}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Achievement Criteria</h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {badge.criteria}
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Badge ID: {badge.id}</span>
            <span>Created: {badge.created_at.split('T')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
