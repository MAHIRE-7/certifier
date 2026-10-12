import React, { useEffect, useState } from 'react';
import { History, Shield, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';

export const AdminAuditPage: React.FC = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAudits = () => {
    setLoading(true);
    api
      .getAdminAudit()
      .then((res) => setAudits(res.auditEvents))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAudits();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Log</h1>
          <p className="text-xs text-slate-500 mt-1">Immutable security ledger of issuance, login, and revocation events</p>
        </div>
        <button onClick={loadAudits} className="p-2 text-slate-400 hover:text-slate-600 rounded">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : audits.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No audit events recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Action</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Actor</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Target Type</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Target ID</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Reason / Notes</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-600">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {audits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-bold font-sans text-slate-900">{a.action}</td>
                    <td className="px-5 py-3 font-sans text-slate-700">
                      {a.actor_name ? `${a.actor_name} (${a.actor_email})` : a.actor_user_id || 'System'}
                    </td>
                    <td className="px-5 py-3 text-slate-600 uppercase">{a.target_type}</td>
                    <td className="px-5 py-3 text-slate-500 max-w-[150px] truncate" title={a.target_id}>
                      {a.target_id}
                    </td>
                    <td className="px-5 py-3 font-sans text-slate-600">{a.reason || '—'}</td>
                    <td className="px-5 py-3 text-right text-slate-400">
                      {new Date(a.created_at).toLocaleString()}
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
