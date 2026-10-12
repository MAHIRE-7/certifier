import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Plus, Award, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';

export const BadgesPage: React.FC = () => {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Badge Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [badgeName, setBadgeName] = useState('');
  const [badgeDesc, setBadgeDesc] = useState('');
  const [badgeCriteria, setBadgeCriteria] = useState('');
  const [creating, setCreating] = useState(false);

  // Issue Badge Modal
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [issueResult, setIssueResult] = useState<any | null>(null);

  const loadBadges = () => {
    setLoading(true);
    api
      .getBadges()
      .then((res) => setBadges(res.badges))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createBadge({
        name: badgeName,
        description: badgeDesc,
        criteria: badgeCriteria
      });
      setShowCreateModal(false);
      setBadgeName('');
      setBadgeDesc('');
      setBadgeCriteria('');
      loadBadges();
    } finally {
      setCreating(false);
    }
  };

  const handleIssueBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBadge) return;
    setIssuing(true);
    try {
      const res = await api.issueBadge(selectedBadge.id, {
        recipient_name: recipientName,
        recipient_email: recipientEmail
      });
      setIssueResult(res.credential);
      setRecipientName('');
      setRecipientEmail('');
      loadBadges();
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Digital Badges</h1>
          <p className="text-xs text-slate-500 mt-1">
            Define verifiable achievement badges and issue cryptographic awards
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Badge Definition</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading badge definitions...</div>
      ) : badges.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <Shield className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No digital badges defined yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create badge criteria and issue signed awards to high-achieving community members.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Create Badge Definition
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{b.name}</h2>
                      <div className="text-[11px] font-mono text-slate-400">{b.id}</div>
                    </div>
                  </div>
                  <StatusBadge status={b.status} showIcon={false} />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{b.description}</p>

                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">Criteria: </span>
                  {b.criteria}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  <strong className="text-slate-800">{b.awarded_count || 0}</strong> awards issued
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/badges/${b.id}`}
                    target="_blank"
                    className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-0.5"
                  >
                    Public Page <ExternalLink className="w-3 h-3" />
                  </Link>

                  <button
                    onClick={() => {
                      setSelectedBadge(b);
                      setIssueResult(null);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition"
                  >
                    Award to Recipient
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Badge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Create Badge Definition</h3>

            <form onSubmit={handleCreateBadge} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Badge Name</label>
                <input
                  type="text"
                  required
                  value={badgeName}
                  onChange={(e) => setBadgeName(e.target.value)}
                  placeholder="e.g. Distributed Consensus Specialist"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={badgeDesc}
                  onChange={(e) => setBadgeDesc(e.target.value)}
                  placeholder="What this badge represents..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Achievement Criteria</label>
                <textarea
                  required
                  rows={2}
                  value={badgeCriteria}
                  onChange={(e) => setBadgeCriteria(e.target.value)}
                  placeholder="Requirements or projects completed to earn this badge..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  {creating ? 'Saving...' : 'Save Badge Definition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Badge Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Award Badge: {selectedBadge.name}</h3>

            {issueResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Badge Awarded & Cryptographically Signed!
                  </div>
                  <div>Recipient: {issueResult.recipient_name}</div>
                  <div className="font-mono text-[11px] break-all">{issueResult.id}</div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    to={`/verify/${issueResult.id}`}
                    target="_blank"
                    className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    Open Public Verification <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBadge(null);
                      setIssueResult(null);
                    }}
                    className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleIssueBadge} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Samantha Wu"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Recipient Email (Private)</label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="samantha@example.com"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedBadge(null)}
                    className="px-4 py-2 font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={issuing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    {issuing ? 'Signing...' : 'Sign & Award Badge'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
