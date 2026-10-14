import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  FileText,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Users,
  Search,
  Filter,
  Check,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';
import { AdminStats, ItemSummary, FlagItem } from '../types';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/StatusBadge';

export const AdminPage: React.FC = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'moderation' | 'flags' | 'logs'>('moderation');

  const [items, setItems] = useState<ItemSummary[]>([]);
  const [modFilter, setModFilter] = useState('pending');
  const [flags, setFlags] = useState<FlagItem[]>([]);
  const [flagFilter, setFlagFilter] = useState('pending');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const s = await api.getAdminStats();
      setStats(s);
    } catch (err: any) {
      showToast(err.message || 'Failed to load stats', 'error');
    }
  };

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'moderation') {
        const res = await api.getAdminItems(modFilter === 'all' ? undefined : modFilter);
        setItems(res);
      } else if (activeTab === 'flags') {
        const res = await api.getAdminFlags(flagFilter === 'all' ? undefined : flagFilter);
        setFlags(res);
      } else if (activeTab === 'logs') {
        const res = await api.getAuditLogs();
        setAuditLogs(res);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    loadTabData();
  }, [activeTab, modFilter, flagFilter]);

  const handleModeration = async (publicId: string, status: 'approved' | 'rejected') => {
    try {
      await api.updateModeration(publicId, status, `Moderated by admin at ${new Date().toLocaleTimeString()}`);
      showToast(`Item ${publicId} marked as ${status}`, 'success');
      loadTabData();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to update moderation', 'error');
    }
  };

  const handleResolveFlag = async (flagId: string, status: 'reviewed' | 'dismissed') => {
    try {
      await api.updateFlagStatus(flagId, status);
      showToast(`Flag marked as ${status}`, 'success');
      loadTabData();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to update flag', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                <Shield className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Campus Admin Console
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Manage platform moderation, resolve user dispute flags, and inspect system audit logs.
            </p>
          </div>

          <button
            onClick={() => { fetchStats(); loadTabData(); }}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh statistics and queues"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total</span>
              <span className="text-2xl font-extrabold text-slate-900">{stats.total_reports}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="block text-rose-500 text-[10px] font-bold uppercase tracking-wider">Lost</span>
              <span className="text-2xl font-extrabold text-rose-600">{stats.lost_reports}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="block text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Found</span>
              <span className="text-2xl font-extrabold text-emerald-600">{stats.found_reports}</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs">
              <span className="block text-amber-700 text-[10px] font-bold uppercase tracking-wider">Pending Mod</span>
              <span className="text-2xl font-extrabold text-amber-800">{stats.pending_moderation}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="block text-blue-600 text-[10px] font-bold uppercase tracking-wider">Claims</span>
              <span className="text-2xl font-extrabold text-blue-700">{stats.active_claims}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="block text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Returned</span>
              <span className="text-2xl font-extrabold text-emerald-600">{stats.successfully_returned}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="block text-purple-600 text-[10px] font-bold uppercase tracking-wider">Users</span>
              <span className="text-2xl font-extrabold text-purple-700">{stats.total_users}</span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-2xs">
              <span className="block text-rose-700 text-[10px] font-bold uppercase tracking-wider">Flagged</span>
              <span className="text-2xl font-extrabold text-rose-700">{stats.flagged_listings}</span>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'moderation'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Listing Moderation
          </button>
          <button
            onClick={() => setActiveTab('flags')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'flags'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Flagged Content ({stats?.flagged_listings || 0})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'logs'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Audit History
          </button>
        </div>

        {/* Content Panes */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mb-3" />
            <p className="text-sm font-semibold">Loading administrative records...</p>
          </div>
        ) : (
          <>
            {/* 1. MODERATION QUEUE */}
            {activeTab === 'moderation' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Filter by status:
                  </span>
                  <div className="flex gap-2">
                    {['pending', 'approved', 'rejected', 'all'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setModFilter(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          modFilter === st
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
                    No items in this moderation filter queue.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="p-4">Report Details</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Location</th>
                          <th className="p-4">Moderation</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((i) => (
                          <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <Link
                                to={`/items/${i.public_id}`}
                                className="font-bold text-slate-900 hover:text-blue-600 block line-clamp-1"
                              >
                                {i.title}
                              </Link>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {i.public_id} • {new Date(i.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="p-4 font-medium text-slate-600">{i.category}</td>
                            <td className="p-4 text-slate-600">{i.general_location}</td>
                            <td className="p-4">
                              <StatusBadge status={i.moderation_status} type="moderation" />
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {i.moderation_status !== 'approved' && (
                                <button
                                  onClick={() => handleModeration(i.public_id, 'approved')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors"
                                >
                                  Approve
                                </button>
                              )}
                              {i.moderation_status !== 'rejected' && (
                                <button
                                  onClick={() => handleModeration(i.public_id, 'rejected')}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition-colors"
                                >
                                  Reject
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
            )}

            {/* 2. FLAGGED CONTENT */}
            {activeTab === 'flags' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Filter Flags:
                  </span>
                  <div className="flex gap-2">
                    {['pending', 'reviewed', 'dismissed', 'all'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFlagFilter(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          flagFilter === st
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {flags.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
                    No flagged listings on record.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flags.map((flag) => (
                      <div
                        key={flag.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
                              {flag.reason}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              Reported by {flag.reporter_name}
                            </span>
                          </div>
                          <Link
                            to={`/items/${flag.item_public_id}`}
                            className="font-bold text-sm text-slate-900 hover:text-blue-600 flex items-center gap-1"
                          >
                            Listing: {flag.item_title} ({flag.item_public_id}) <ExternalLink className="w-3 h-3" />
                          </Link>
                          {flag.details && (
                            <p className="text-xs text-slate-500 mt-1 italic">
                              "{flag.details}"
                            </p>
                          )}
                        </div>

                        {flag.status === 'pending' ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleResolveFlag(flag.id, 'reviewed')}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                            >
                              Action Taken
                            </button>
                            <button
                              onClick={() => handleResolveFlag(flag.id, 'dismissed')}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                            >
                              Dismiss Flag
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 capitalize">
                            Status: {flag.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. AUDIT LOGS */}
            {activeTab === 'logs' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-bold text-sm text-slate-900 mb-4">Administrator Action Timeline</h3>
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No administrator logs recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                        <div>
                          <span className="font-mono font-bold text-purple-700 uppercase bg-purple-50 px-2 py-0.5 rounded mr-2">
                            {log.action}
                          </span>
                          <span className="font-medium text-slate-700">
                            Resource: {log.resource_type} ({log.resource_id})
                          </span>
                          {log.details && (
                            <p className="text-[11px] text-slate-500 mt-1">{log.details}</p>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
