import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Calendar,
  Shield,
  Plus,
  ArrowRight,
  ExternalLink,
  Download
} from 'lucide-react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';

export const DashboardOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDashboardStats()
      .then((res) => setStats(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg">
        Failed to load dashboard metrics: {error}
      </div>
    );
  }

  const { metrics, recentCredentials } = stats;

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time cryptographic credential issuance metrics</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/events/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </Link>
          <Link
            to="/dashboard/events"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <span>Issue Credentials</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-medium text-slate-500">Total Issued</div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.totalCredentials}</div>
          <div className="text-[11px] text-slate-400">Lifetime credentials</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active & Valid</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.activeCredentials}</div>
          <div className="text-[11px] text-slate-400">Verifying successfully</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-medium text-rose-600 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Revoked</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.revokedCredentials}</div>
          <div className="text-[11px] text-slate-400">Invalidated by issuer</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>Events</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.totalEvents}</div>
          <div className="text-[11px] text-slate-400">Workshops & tracks</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1 col-span-2 lg:col-span-1">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span>Badges</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.totalBadges}</div>
          <div className="text-[11px] text-slate-400">Defined badge awards</div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Issuance Activity</h2>
            <p className="text-xs text-slate-500">Most recent credentials signed under this organization</p>
          </div>
          <Link
            to="/dashboard/credentials"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentCredentials.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No credentials issued yet. Go to Events to issue your first batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Recipient</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Credential Title</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Type</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Issued Date</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCredentials.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{c.recipient_name}</td>
                    <td className="px-5 py-3.5 text-slate-700">{c.title}</td>
                    <td className="px-5 py-3.5 capitalize text-slate-500">{c.credential_type}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={c.status} showIcon={false} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{c.issued_at.split('T')[0]}</td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Link
                        to={`/verify/${c.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                      >
                        Verify <ExternalLink className="w-3 h-3" />
                      </Link>
                      <Link
                        to={`/dashboard/credentials/${c.id}`}
                        className="text-slate-600 hover:text-slate-900 font-medium"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
