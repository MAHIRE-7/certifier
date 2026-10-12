import React, { useEffect, useState } from 'react';
import { Users, CheckCircle2, XCircle, Building2, ExternalLink } from 'lucide-react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';

export const AdminIssuersPage: React.FC = () => {
  const [issuers, setIssuers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadIssuers = () => {
    setLoading(true);
    api
      .getAdminIssuers()
      .then((res) => setIssuers(res.issuers))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadIssuers();
  }, []);

  const handleApprove = async (id: string) => {
    await api.approveIssuer(id);
    setActionMessage('Issuer approved successfully.');
    loadIssuers();
  };

  const handleSuspend = async (id: string) => {
    await api.suspendIssuer(id);
    setActionMessage('Issuer suspended successfully.');
    loadIssuers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Issuer Governance Directory</h1>
        <p className="text-xs text-slate-500 mt-1">Platform administration and organization approval management</p>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 rounded-lg">
          {actionMessage}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading organizations...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Organization Name</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Slug</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Issued Credentials</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issuers.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{org.name}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">{org.slug}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">{org.credential_count || 0}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={org.approval_status} showIcon={false} />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <a
                        href={`/issuers/${org.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-0.5"
                      >
                        Public <ExternalLink className="w-3 h-3" />
                      </a>

                      {org.approval_status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(org.id)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded border border-emerald-200"
                        >
                          Approve
                        </button>
                      )}

                      {org.approval_status !== 'suspended' && (
                        <button
                          type="button"
                          onClick={() => handleSuspend(org.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded border border-rose-200"
                        >
                          Suspend
                        </button>
                      )}
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
