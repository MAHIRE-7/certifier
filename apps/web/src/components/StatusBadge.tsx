import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';

export type StatusType =
  | 'valid'
  | 'active'
  | 'revoked'
  | 'expired'
  | 'invalid_signature'
  | 'untrusted_issuer'
  | 'not_found'
  | 'pending'
  | 'approved'
  | 'suspended';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showIcon = true }) => {
  const norm = status.toLowerCase();

  switch (norm) {
    case 'valid':
    case 'active':
    case 'approved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          {norm === 'valid' ? 'Cryptographically Verified' : norm === 'approved' ? 'Approved Issuer' : 'Active'}
        </span>
      );

    case 'revoked':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 ${className}`}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
          Revoked Credential
        </span>
      );

    case 'expired':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 ${className}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600" />}
          Expired
        </span>
      );

    case 'invalid_signature':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 ${className}`}
        >
          {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-red-600" />}
          Invalid Signature (Tampered)
        </span>
      );

    case 'untrusted_issuer':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 ${className}`}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          Untrusted Issuer Key
        </span>
      );

    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-blue-500" />}
          Pending Approval
        </span>
      );

    case 'suspended':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 ${className}`}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />}
          Suspended
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          {status}
        </span>
      );
  }
};
