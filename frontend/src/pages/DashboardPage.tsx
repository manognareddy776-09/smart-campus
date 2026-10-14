import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  User,
  FileQuestion,
  PlusCircle,
  ShieldCheck,
  MessageSquare,
  Heart,
  Bell,
  Settings,
  Clock,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Edit3,
  CheckCheck,
  Lock,
  Building2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import {
  ItemSummary,
  Claim,
  ContactRequest,
  NotificationItem,
  Campus
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ItemCard } from '../components/ItemCard';

export const DashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'lost';

  const [lostItems, setLostItems] = useState<ItemSummary[]>([]);
  const [foundItems, setFoundItems] = useState<ItemSummary[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [favorites, setFavorites] = useState<ItemSummary[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);

  const [loading, setLoading] = useState(false);

  // Settings form states
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [collegeId, setCollegeId] = useState(user?.college_id || '');
  const [campusId, setCampusId] = useState(user?.campus_id || '');
  const [contactPref, setContactPref] = useState(user?.contact_preferences || 'in_app');
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Password change states
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  // Set active tab in search params
  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'lost') {
        const res = await api.getMyItems('lost');
        setLostItems(res);
      } else if (activeTab === 'found') {
        const res = await api.getMyItems('found');
        setFoundItems(res);
      } else if (activeTab === 'claims') {
        const res = await api.getMyClaims();
        setClaims(res);
      } else if (activeTab === 'messages') {
        const res = await api.getMyContacts();
        setContacts(res);
      } else if (activeTab === 'favorites') {
        const res = await api.getMyFavorites();
        setFavorites(res);
      } else if (activeTab === 'notifications') {
        const res = await api.getNotifications();
        setNotifications(res);
      } else if (activeTab === 'settings') {
        const camps = await api.getCampuses();
        setCampuses(camps);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name);
      setCollegeId(user.college_id || '');
      setCampusId(user.campus_id || '');
      setContactPref(user.contact_preferences || 'in_app');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      await api.updateProfile({
        display_name: displayName.trim(),
        college_id: collegeId.trim() || undefined,
        campus_id: campusId || undefined,
        contact_preferences: contactPref,
      });
      await refreshUser();
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    setPwdSaving(true);
    try {
      await api.changePassword({ current_password: currPassword, new_password: newPassword });
      setCurrPassword('');
      setNewPassword('');
      showToast('Password changed successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setPwdSaving(false);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast('All notifications marked as read', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to mark read', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              {user?.display_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Welcome, {user?.display_name}!
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  {user?.role === 'admin' ? 'Campus Admin' : 'Student'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {user?.email} • {user?.campus_name || 'Main Campus'} • ID: {user?.college_id || 'Not set'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/report/lost"
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all"
            >
              + Report Lost
            </Link>
            <Link
              to="/report/found"
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
            >
              + Report Found
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none border-b border-slate-200">
          <button
            onClick={() => setTab('lost')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'lost'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            My Lost Reports
          </button>

          <button
            onClick={() => setTab('found')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'found'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            My Found Reports
          </button>

          <button
            onClick={() => setTab('claims')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'claims'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            My Claims
          </button>

          <button
            onClick={() => setTab('messages')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'messages'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Messages
          </button>

          <button
            onClick={() => setTab('favorites')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'favorites'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Heart className="w-4 h-4" />
            Saved Items
          </button>

          <button
            onClick={() => setTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>

          <button
            onClick={() => setTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {/* Tab Content Panes */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-semibold">Updating dashboard...</p>
          </div>
        ) : (
          <>
            {/* 1. MY LOST REPORTS */}
            {activeTab === 'lost' && (
              <div>
                {lostItems.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
                    <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 mb-1">No lost reports yet</h3>
                    <p className="text-xs text-slate-500 mb-4">You have not submitted any lost item reports.</p>
                    <Link
                      to="/report/lost"
                      className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl"
                    >
                      Report Lost Belonging
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lostItems.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. MY FOUND REPORTS */}
            {activeTab === 'found' && (
              <div>
                {foundItems.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
                    <PlusCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 mb-1">No found reports yet</h3>
                    <p className="text-xs text-slate-500 mb-4">Help the campus by reporting items you discover.</p>
                    <Link
                      to="/report/found"
                      className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                    >
                      Report Found Belonging
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {foundItems.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. MY CLAIMS */}
            {activeTab === 'claims' && (
              <div className="space-y-4 max-w-3xl">
                {claims.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                    <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 mb-1">No claims filed yet</h3>
                    <p className="text-xs text-slate-500 mb-4">When you file an ownership claim on a found item, it will show up here.</p>
                    <Link to="/browse" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">
                      Browse Found Items
                    </Link>
                  </div>
                ) : (
                  claims.map((claim) => (
                    <div
                      key={claim.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Link
                            to={`/items/${claim.item_public_id}`}
                            className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {claim.item_title}
                          </Link>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Report ID: {claim.item_public_id} • Filed on {new Date(claim.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={claim.status} type="claim" />
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                        <strong className="block text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                          Your Proof Submission:
                        </strong>
                        {claim.private_claim_details}
                      </div>

                      {claim.finder_notes && (
                        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900">
                          <strong className="block text-blue-700 uppercase tracking-wider text-[10px] mb-1">
                            Finder's Response:
                          </strong>
                          {claim.finder_notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. MESSAGES / CONTACT REQUESTS */}
            {activeTab === 'messages' && (
              <div className="space-y-4 max-w-3xl">
                {contacts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 mb-1">No messages yet</h3>
                    <p className="text-xs text-slate-500">In-app inquiries sent or received regarding reports will appear here.</p>
                  </div>
                ) : (
                  contacts.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {c.is_sender ? 'Sent to:' : 'Received from:'}
                          </span>
                          <span className="text-sm font-bold text-slate-900 ml-1.5">
                            {c.is_sender ? c.recipient_name : c.requester_name}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">
                        Regarding Item:{' '}
                        <Link
                          to={`/items/${c.item_public_id}`}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          {c.item_title} ({c.item_public_id})
                        </Link>
                      </p>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                        {c.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 5. SAVED FAVORITES */}
            {activeTab === 'favorites' && (
              <div>
                {favorites.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
                    <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 mb-1">No saved items</h3>
                    <p className="text-xs text-slate-500 mb-4">Click the heart icon on any listing to bookmark it.</p>
                    <Link to="/browse" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">
                      Browse Directory
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 max-w-3xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <h3 className="font-bold text-slate-900 text-base">Notifications Center</h3>
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <CheckCheck className="w-4 h-4" /> Mark all read
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-center py-10 text-xs text-slate-400">No notifications on record.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`py-4 transition-colors ${!n.is_read ? 'bg-blue-50/40 px-3 rounded-xl' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                        {n.link_url && (
                          <Link
                            to={n.link_url}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline mt-2"
                          >
                            Go to details <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 7. SETTINGS */}
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
                {/* Profile Form */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8">
                  <h3 className="font-bold text-slate-900 text-base mb-4">Campus Profile Settings</h3>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Full Display Name
                      </label>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Student ID / Roll Number
                      </label>
                      <input
                        type="text"
                        value={collegeId}
                        onChange={(e) => setCollegeId(e.target.value)}
                        placeholder="e.g. CSE-2023-042"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Default Campus Facility
                      </label>
                      <select
                        value={campusId}
                        onChange={(e) => setCampusId(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      >
                        <option value="">No Campus Preference</option>
                        {campuses.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Contact Preference
                      </label>
                      <select
                        value={contactPref}
                        onChange={(e) => setContactPref(e.target.value as 'in_app' | 'email' | 'phone')}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      >
                        <option value="in_app">In-App Messages (Recommended)</option>
                        <option value="email">Campus Email</option>
                        <option value="phone">Direct Phone</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20"
                    >
                      {settingsSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </form>
                </div>

                {/* Password Change Form */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8">
                  <h3 className="font-bold text-slate-900 text-base mb-4">Change Password</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currPassword}
                        onChange={(e) => setCurrPassword(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        New Password (min 6 characters)
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={pwdSaving}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md"
                    >
                      {pwdSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
