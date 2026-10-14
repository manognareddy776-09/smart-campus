import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  Heart,
  Flag,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  Send,
  HelpCircle,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { api } from '../api/client';
import { ItemDetail, MatchResult, Claim } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/StatusBadge';
import { getCategoryIcon } from '../components/ItemCard';
import { ConfirmModal } from '../components/ConfirmModal';

export const ItemDetailPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [itemClaims, setItemClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimDetails, setClaimDetails] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('spam');
  const [flagDetails, setFlagDetails] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [markReturnedOpen, setMarkReturnedOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    general_location: ''
  });

  const fetchItemData = async () => {
    if (!publicId) return;
    setLoading(true);
    try {
      const data = await api.getItem(publicId);
      setItem(data);
      setEditForm({
        title: data.title,
        description: data.description,
        general_location: data.general_location
      });

      // Load smart matches
      try {
        const matchRes = await api.getItemMatches(publicId);
        setMatches(matchRes);
      } catch {
        // Continue if matches fail
      }

      // If owner or admin, load claims on this item
      if (data.is_owner || isAdmin) {
        try {
          const claimsRes = await api.getItemClaims(publicId);
          setItemClaims(claimsRes);
        } catch {
          // Continue
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load item report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemData();
  }, [publicId]);

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to save items to your favorites', 'info');
      navigate('/login');
      return;
    }
    if (!item) return;
    try {
      const res = await api.toggleFavorite(item.public_id, item.is_favorite);
      setItem({ ...item, is_favorite: res.is_favorite });
      showToast(res.is_favorite ? 'Item saved to favorites' : 'Removed from favorites', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error updating favorite', 'error');
    }
  };

  // Submit Claim
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (claimDetails.trim().length < 10) {
      showToast('Please provide detailed proof of ownership (minimum 10 characters)', 'error');
      return;
    }
    setClaimSubmitting(true);
    try {
      await api.submitClaim(item.public_id, { private_claim_details: claimDetails });
      setItem({ ...item, has_claimed: true });
      setClaimModalOpen(false);
      setClaimDetails('');
      showToast('Ownership claim submitted successfully. The finder has been notified.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit claim', 'error');
    } finally {
      setClaimSubmitting(false);
    }
  };

  // Send Contact Message
  const handleSendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (contactMessage.trim().length < 5) {
      showToast('Please enter a message of at least 5 characters', 'error');
      return;
    }
    setContactSubmitting(true);
    try {
      await api.sendContact(item.public_id, contactMessage.trim());
      setContactModalOpen(false);
      setContactMessage('');
      showToast('Message sent! View conversation history in your dashboard.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setContactSubmitting(false);
    }
  };

  // Submit Listing Flag
  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setFlagSubmitting(true);
    try {
      await api.flagItem(item.public_id, { reason: flagReason, details: flagDetails });
      setFlagModalOpen(false);
      setFlagDetails('');
      showToast('Listing flagged for moderator review. Thank you for keeping campus safe.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to flag listing', 'error');
    } finally {
      setFlagSubmitting(false);
    }
  };

  // Delete Listing
  const handleDeleteListing = async () => {
    if (!item) return;
    setDeleteSubmitting(true);
    try {
      await api.deleteItem(item.public_id);
      showToast('Listing deleted successfully', 'success');
      navigate('/browse');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete listing', 'error');
    } finally {
      setDeleteSubmitting(false);
      setDeleteConfirmOpen(false);
    }
  };

  // Mark Returned
  const handleMarkReturned = async () => {
    if (!item) return;
    try {
      await api.updateItem(item.public_id, { status: 'returned' });
      setItem({ ...item, status: 'returned' });
      setMarkReturnedOpen(false);
      showToast('Item marked as successfully returned to owner!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update item status', 'error');
    }
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    try {
      const updated = await api.updateItem(item.public_id, editForm);
      setItem(updated);
      setEditModalOpen(false);
      showToast('Report updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update report', 'error');
    }
  };

  // Claim status update by Finder
  const handleClaimStatusChange = async (claimId: string, newStatus: string) => {
    try {
      const updated = await api.updateClaimStatus(claimId, { status: newStatus });
      setItemClaims((prev) => prev.map((c) => (c.id === claimId ? updated : c)));
      showToast(`Claim marked as ${newStatus}`, 'success');
      if (newStatus === 'accepted') {
        setItem((prev) => (prev ? { ...prev, status: 'claimed' } : null));
      } else if (newStatus === 'completed') {
        setItem((prev) => (prev ? { ...prev, status: 'returned' } : null));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update claim status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading item report details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Item Not Found</h2>
        <p className="text-sm text-slate-600 mb-6">
          This report may have been removed, closed, or is awaiting moderation.
        </p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Directory
        </Link>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(item.category);
  const isLost = item.report_type === 'lost';

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-6">
          <Link to="/" className="hover:text-slate-800">Home</Link>
          <span>/</span>
          <Link to="/browse" className="hover:text-slate-800">Browse</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">{item.title}</span>
        </nav>

        {/* Top Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Column 1 & 2: Main Image and Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-8">
              {/* Image banner */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center mb-8 border border-slate-200">
                {item.image_path ? (
                  <img
                    src={item.image_path}
                    alt={item.title}
                    className="w-full h-full object-contain bg-slate-950/5"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <div className={`p-6 rounded-3xl mb-3 ${isLost ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                      <CategoryIcon className="w-14 h-14" />
                    </div>
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">{item.category}</span>
                    <span className="text-xs text-slate-400 mt-1">No photograph attached by reporter</span>
                  </div>
                )}

                <div className="absolute top-4 left-4 flex gap-2">
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md backdrop-blur-md ${
                      isLost
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isLost ? 'Lost Report' : 'Found Report'}
                  </span>
                </div>

                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900/80 text-white backdrop-blur-md">
                    {item.public_id}
                  </span>
                </div>
              </div>

              {/* Title & Status */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                      <CategoryIcon className="w-4 h-4 text-slate-500" />
                      {item.category}
                    </span>
                    <StatusBadge status={item.status} size="md" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {item.title}
                  </h1>
                </div>

                {/* Favorite & Flag Actions */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-3 rounded-xl border transition-all ${
                      item.is_favorite
                        ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title={item.is_favorite ? 'Saved to Favorites' : 'Save to Favorites'}
                  >
                    <Heart className={`w-5 h-5 ${item.is_favorite ? 'fill-rose-600' : ''}`} />
                  </button>

                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        showToast('Please sign in to report listings', 'info');
                        navigate('/login');
                        return;
                      }
                      setFlagModalOpen(true);
                    }}
                    className="p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                    title="Flag listing to moderators"
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="pt-6 border-t border-slate-100 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Report Description
                </h3>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>

              {/* Metadata Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Location</span>
                    <span className="font-semibold">{item.general_location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">
                      {isLost ? 'Approx. Date Lost' : 'Approx. Date Found'}
                    </span>
                    <span className="font-semibold">
                      {new Date(item.event_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Campus Facility</span>
                    <span className="font-semibold">{item.campus_name || 'Main Campus'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <User className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Reported By</span>
                    <span className="font-semibold">{item.owner_display_name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Claims section for Finder / Admin */}
            {(item.is_owner || isAdmin) && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Ownership Claims ({itemClaims.length})
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    Private verification submissions
                  </span>
                </div>

                {itemClaims.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl">
                    No ownership claims have been filed for this listing yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {itemClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sm text-slate-900">{claim.claimant_name}</span>
                            <span className="text-xs text-slate-400 ml-2">
                              {new Date(claim.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <StatusBadge status={claim.status} type="claim" />
                        </div>

                        {claim.private_claim_details && (
                          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700">
                            <span className="block font-bold text-slate-500 uppercase tracking-wider mb-1 text-[10px]">
                              Private Proof of Ownership:
                            </span>
                            {claim.private_claim_details}
                          </div>
                        )}

                        {claim.status === 'pending' && (item.is_owner || isAdmin) && (
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => handleClaimStatusChange(claim.id, 'accepted')}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                            >
                              Accept Claim
                            </button>
                            <button
                              onClick={() => handleClaimStatusChange(claim.id, 'rejected')}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                            >
                              Reject Claim
                            </button>
                          </div>
                        )}

                        {claim.status === 'accepted' && (item.is_owner || isAdmin) && (
                          <div className="pt-2">
                            <button
                              onClick={() => handleClaimStatusChange(claim.id, 'completed')}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                              Confirm Handover (Mark Complete)
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 3: Action Sidebar & Smart Matching */}
          <div className="space-y-6">
            {/* Primary Action Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7">
              <h3 className="font-bold text-slate-900 text-base mb-4">Actions &amp; Coordination</h3>

              {item.is_owner ? (
                /* Owner controls */
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
                    You created this report. You can modify its details or close it when resolved.
                  </div>

                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Report Details
                  </button>

                  {item.status !== 'returned' && (
                    <button
                      onClick={() => setMarkReturnedOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark as Returned
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Withdraw / Delete Report
                  </button>
                </div>
              ) : (
                /* Non-owner / Student controls */
                <div className="space-y-3.5">
                  {/* If found item -> Claim button */}
                  {!isLost && (
                    <div>
                      {item.has_claimed ? (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          You submitted a claim for this item.
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!isAuthenticated) {
                              showToast('Please log in to submit an ownership claim', 'info');
                              navigate('/login');
                              return;
                            }
                            setClaimModalOpen(true);
                          }}
                          disabled={item.status === 'returned'}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 font-bold text-xs text-white shadow-md shadow-blue-600/25 transition-all"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Claim This Item
                        </button>
                      )}
                      <p className="text-[11px] text-slate-400 mt-2 text-center">
                        Requires private proof of ownership details.
                      </p>
                    </div>
                  )}

                  {/* Contact Finder/Owner button */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        showToast('Please sign in to send messages', 'info');
                        navigate('/login');
                        return;
                      }
                      setContactModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contact {isLost ? 'Owner' : 'Finder'} Privately
                  </button>

                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
                    <p className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Campus Privacy Guarantee
                    </p>
                    <p>
                      Your direct phone and email remain private. Meet safely at campus security for all physical handovers.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Smart Matching Algorithm Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Smart Suggestions</h3>
                  <p className="text-[11px] text-slate-500">TF-IDF &amp; Proximity matching</p>
                </div>
              </div>

              {matches.length === 0 ? (
                <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-500">
                    No complementary active reports meet the similarity threshold yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {matches.slice(0, 3).map((match) => (
                    <div
                      key={match.item.id}
                      className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-blue-300 transition-colors bg-white shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-xs text-slate-900 line-clamp-1">
                          {match.item.title}
                        </span>
                        <span className="shrink-0 text-xs font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {match.match_score}%
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-1 mb-2.5">
                        <p className="truncate">📍 {match.item.general_location}</p>
                        {match.shared_characteristics.length > 0 && (
                          <p className="text-blue-600 font-medium truncate">
                            ✓ {match.shared_characteristics.join(' • ')}
                          </p>
                        )}
                      </div>

                      <Link
                        to={`/items/${match.item.public_id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Inspect Match <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CLAIM SUBMISSION MODAL */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Verify Ownership</h3>
                  <p className="text-xs text-slate-500">Item: {item.title}</p>
                </div>
              </div>
              <button onClick={() => setClaimModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="pt-4 space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Finder Protection Guideline:</strong> Detail identifiable features that only the genuine owner would know (e.g. phone lock screen wallpaper, specific brand of pencil inside, partial digits of ID, distinct scratch marks).
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Private Proof of Ownership <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={claimDetails}
                  onChange={(e) => setClaimDetails(e.target.value)}
                  placeholder="e.g., The notebook has my initials 'AC' in red ink on page 3. The inside zipper has a small USB stick..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20"
                >
                  {claimSubmitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTACT MESSAGE MODAL */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Send Private In-App Message</h3>
                  <p className="text-xs text-slate-500">To: {item.owner_display_name}</p>
                </div>
              </div>
              <button onClick={() => setContactModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSendContact} className="pt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Hi! I saw your report about the item. I believe I might know where it was moved..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {contactSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLAG LISTING MODAL */}
      {flagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Flag className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Report Inappropriate Listing</h3>
              </div>
              <button onClick={() => setFlagModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitFlag} className="pt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="spam">Commercial Spam / Advertising</option>
                  <option value="fake">Fake or Prank Report</option>
                  <option value="inappropriate">Offensive or Inappropriate Content</option>
                  <option value="privacy_violation">Exposes Full ID / Sensitive Private Info</option>
                  <option value="other">Other Campus Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Additional Details (Optional)</label>
                <textarea
                  rows={3}
                  value={flagDetails}
                  onChange={(e) => setFlagDetails(e.target.value)}
                  placeholder="Explain why this listing should be reviewed by moderators..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFlagModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={flagSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                >
                  {flagSubmitting ? 'Submitting...' : 'Flag Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Edit Report Details</h3>
              <button onClick={() => setEditModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="pt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">General Location</label>
                <input
                  type="text"
                  required
                  value={editForm.general_location}
                  onChange={(e) => setEditForm({ ...editForm, general_location: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODALS */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Withdraw Report"
        message="Are you sure you want to withdraw and delete this item report? This action cannot be reversed."
        confirmLabel="Yes, Delete Report"
        confirmVariant="danger"
        isLoading={deleteSubmitting}
        onConfirm={handleDeleteListing}
        onClose={() => setDeleteConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={markReturnedOpen}
        title="Mark Item Returned"
        message="Great news! Are you sure you wish to mark this belonging as returned to its owner? The listing status will be updated to Returned."
        confirmLabel="Confirm Handover"
        confirmVariant="primary"
        onConfirm={handleMarkReturned}
        onClose={() => setMarkReturnedOpen(false)}
      />
    </div>
  );
};
