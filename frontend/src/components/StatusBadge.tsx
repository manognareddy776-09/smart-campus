import React from 'react';
import { Clock, CheckCircle2, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'item' | 'claim' | 'moderation';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'item', size = 'sm' }) => {
  const norm = status.toLowerCase();
  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  if (type === 'item') {
    switch (norm) {
      case 'open':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 ${padding}`}>
            <Clock className="w-3 h-3" /> Active Listing
          </span>
        );
      case 'claimed':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${padding}`}>
            <AlertTriangle className="w-3 h-3" /> Under Claim
          </span>
        );
      case 'returned':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${padding}`}>
            <CheckCircle2 className="w-3 h-3" /> Returned to Owner
          </span>
        );
      case 'closed':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${padding}`}>
            <XCircle className="w-3 h-3" /> Closed
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-slate-100 text-slate-700 ${padding}`}>
            {status}
          </span>
        );
    }
  }

  if (type === 'claim') {
    switch (norm) {
      case 'pending':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${padding}`}>
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'accepted':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${padding}`}>
            <ShieldCheck className="w-3 h-3" /> Claim Approved
          </span>
        );
      case 'rejected':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${padding}`}>
            <XCircle className="w-3 h-3" /> Claim Rejected
          </span>
        );
      case 'completed':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${padding}`}>
            <CheckCircle2 className="w-3 h-3" /> Handover Complete
          </span>
        );
      default:
        return <span className={`inline-flex items-center font-semibold rounded-full bg-slate-100 text-slate-700 ${padding}`}>{status}</span>;
    }
  }

  // Moderation
  switch (norm) {
    case 'approved':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${padding}`}>
          <ShieldCheck className="w-3 h-3" /> Approved
        </span>
      );
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${padding}`}>
          <Clock className="w-3 h-3" /> Needs Moderation
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${padding}`}>
          <XCircle className="w-3 h-3" /> Moderation Rejected
        </span>
      );
    default:
      return <span className={`inline-flex items-center font-semibold rounded-full bg-slate-100 text-slate-700 ${padding}`}>{status}</span>;
  }
};
