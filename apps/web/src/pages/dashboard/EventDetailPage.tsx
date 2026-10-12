import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Award,
  Upload,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any | null>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CSV Import State
  const [csvContent, setCsvContent] = useState('');
  const [previewSummary, setPreviewSummary] = useState<any | null>(null);
  const [validRows, setValidRows] = useState<any[]>([]);
  const [invalidRows, setInvalidRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);

  // Form options
  const [templateType, setTemplateType] = useState<'modern_tech' | 'minimal_achievement'>('modern_tech');
  const [signerName, setSignerName] = useState('Dr. Sarah Connor');
  const [signerTitle, setSignerTitle] = useState('Director of Technical Certification');

  const loadEvent = () => {
    if (!eventId) return;
    setLoading(true);
    api
      .getEvent(eventId)
      .then((res) => {
        setEvent(res.event);
        setCredentials(res.credentials);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const handleFillSampleCsv = () => {
    const sample = `recipient_name,recipient_email,credential_title,issue_date
Marcus Vance,marcus.vance@example.test,Certified Cloud Engineer,2026-06-03
Priya Sharma,priya.sharma@example.test,Certified Cloud Engineer,2026-06-03
Liam O'Connor,liam.oconnor@example.test,Certified Cloud Engineer,2026-06-03`;
    setCsvContent(sample);
    setPreviewSummary(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string || '');
      setPreviewSummary(null);
    };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    if (!eventId || !csvContent.trim()) return;
    setImporting(true);
    setError(null);

    try {
      const res = await api.previewCsv(eventId, csvContent);
      setPreviewSummary(res.summary);
      setValidRows(res.validRows);
      setInvalidRows(res.invalidRows);
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV');
    } finally {
      setImporting(false);
    }
  };

  const handleExecuteIssue = async () => {
    if (!eventId || validRows.length === 0) return;
    setIssuing(true);
    setError(null);
    setIssueSuccess(null);

    try {
      const res = await api.issueCredentials(eventId, {
        recipients: validRows,
        template_type: templateType,
        signer_name: signerName,
        signer_title: signerTitle
      });

      setIssueSuccess(`Successfully issued and cryptographically signed ${res.credentials.length} credentials!`);
      setCsvContent('');
      setPreviewSummary(null);
      setValidRows([]);
      setInvalidRows([]);
      loadEvent();
    } catch (err: any) {
      setError(err.message || 'Issuance failed');
    } finally {
      setIssuing(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading event data...</div>;
  }

  if (error && !event) {
    return <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Event Header */}
      <div>
        <Link
          to="/dashboard/events"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Events</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                {event.event_type}
              </span>
              <StatusBadge status={event.status} showIcon={false} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{event.title}</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">{event.description}</p>
          </div>

          <div className="text-xs text-slate-500 sm:text-right shrink-0">
            <div>Created: {event.created_at.split('T')[0]}</div>
            <div className="font-semibold text-slate-800 mt-1">{credentials.length} total credentials</div>
          </div>
        </div>
      </div>

      {/* CSV Bulk Issuance Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Issue Certificates (CSV Bulk Import)</h2>
          </div>
          <button
            type="button"
            onClick={handleFillSampleCsv}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200"
          >
            Insert Sample CSV Template
          </button>
        </div>

        {issueSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{issueSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Recipient Data (CSV format: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">recipient_name,recipient_email,credential_title,issue_date</code>)
              </label>
              <label className="text-xs text-blue-600 hover:underline cursor-pointer font-medium">
                Upload CSV File
                <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <textarea
              rows={5}
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value);
                setPreviewSummary(null);
              }}
              placeholder="Paste comma-separated rows or click 'Insert Sample CSV Template' above..."
              className="w-full p-3 font-mono text-xs text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={importing || !csvContent.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {importing ? 'Validating...' : 'Validate & Preview CSV'}
            </button>
          </div>
        </div>

        {/* CSV Preview Summary & Settings */}
        {previewSummary && (
          <div className="pt-6 border-t border-slate-200 space-y-6">
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <span className="p-2 bg-slate-100 rounded-lg text-slate-700">
                Total Rows: <strong>{previewSummary.totalRows}</strong>
              </span>
              <span className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                Valid Recipients: <strong>{previewSummary.validCount}</strong>
              </span>
              {previewSummary.invalidCount > 0 && (
                <span className="p-2 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg">
                  Invalid Rows: <strong>{previewSummary.invalidCount}</strong>
                </span>
              )}
            </div>

            {/* Invalid rows callout */}
            {invalidRows.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                <div className="font-bold">Errors Found in CSV Rows:</div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {invalidRows.map((inv, idx) => (
                    <li key={idx}>
                      Row {inv.row_number}: {inv.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Valid Rows Preview Table */}
            {validRows.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Ready for Issuance ({validRows.length} recipients)
                </h4>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Recipient Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Email (Private)</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Credential Title</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-900">{row.recipient_name}</td>
                          <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">{row.recipient_email}</td>
                          <td className="px-3 py-2 text-slate-700">{row.credential_title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Configuration Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Template</label>
                    <select
                      value={templateType}
                      onChange={(e) => setTemplateType(e.target.value as any)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="modern_tech">Modern Technology Workshop</option>
                      <option value="minimal_achievement">Minimal Professional Achievement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Signer Display Name</label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Signer Title</label>
                    <input
                      type="text"
                      value={signerTitle}
                      onChange={(e) => setSignerTitle(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Issue Execution Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Deterministic Ed25519 signing will execute server-side.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteIssue}
                    disabled={issuing}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {issuing ? 'Generating Signatures & PDFs...' : `Confirm & Sign ${validRows.length} Credentials`}
                    <KeyRound className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Existing Issued Credentials Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Issued Credentials for this Event</h2>
            <p className="text-xs text-slate-500">Cryptographically signed certificates in the authoritative registry</p>
          </div>
          <button onClick={loadEvent} className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {credentials.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No credentials have been issued for this event yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Recipient</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Email (Internal Private)</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Title</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Issued At</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {credentials.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-900">{c.recipient_name}</td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">{c.recipient_email_private}</td>
                    <td className="px-5 py-3 text-slate-700">{c.title}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} showIcon={false} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">{c.issued_at.split('T')[0]}</td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <a
                        href={`/api/v1/credentials/${c.id}/download`}
                        download
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
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
