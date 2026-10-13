import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Award, Download, ExternalLink, ShieldAlert, Copy, Check, Filter } from 'lucide-react';
import { api, API_BASE } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';

export const CredentialsPage: React.FC = () => {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadCredentials = () => {
    setLoading(true);
    api
      .getCredentials({ search: search.trim() || undefined, status: statusFilter || undefined })
      .then((res) => setCredentials(res.credentials))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCredentials();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCredentials();
  };

  const copyVerifyLink = (id: string) => {
    const url = `${window.location.origin}/verify/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Issued Credentials</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, download, and manage cryptographically signed certificates and badges
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by recipient name, title, or credential ID..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="revoked">Revoked Only</option>
            <option value="expired">Expired Only</option>
          </select>
          <button
            type="button"
            onClick={loadCredentials}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Credentials Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading credentials...</div>
        ) : credentials.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No credentials found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Recipient</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Credential Title</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Event / Achievement</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Issued</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {credentials.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      <div>{c.recipient_name}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{c.id}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{c.title}</td>
                    <td className="px-5 py-3.5 text-slate-500">{c.event_title || 'Standalone Award'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={c.status} showIcon={false} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{c.issued_at.split('T')[0]}</td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => copyVerifyLink(c.id)}
                        className="text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1"
                        title="Copy public verification link"
                      >
                        {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === c.id ? 'Copied' : 'Link'}</span>
                      </button>

                      {c.credential_type === 'certificate' && c.status !== 'revoked' && (
                        <a
                          href={`${API_BASE}/credentials/${c.id}/download`}
                          download
                          className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </a>
                      )}

                      <Link
                        to={`/verify/${c.id}`}
                        target="_blank"
                        className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        Verify <ExternalLink className="w-3 h-3" />
                      </Link>

                      <Link
                        to={`/dashboard/credentials/${c.id}`}
                        className="text-slate-800 hover:text-blue-600 font-medium"
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
