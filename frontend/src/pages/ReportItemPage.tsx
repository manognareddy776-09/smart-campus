import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileQuestion,
  PlusCircle,
  Upload,
  X,
  AlertCircle,
  ShieldAlert,
  Calendar,
  MapPin,
  Building2,
  Tag,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { api } from '../api/client';
import { Campus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CATEGORIES = [
  'Electronics',
  'ID Cards',
  'Wallets',
  'Bags',
  'Books',
  'Keys',
  'Accessories',
  'Other'
];

export const ReportItemPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Determine initial type from URL
  const initialType = location.pathname.includes('found') ? 'found' : 'lost';
  const [reportType, setReportType] = useState<'lost' | 'found'>(initialType);

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [generalLocation, setGeneralLocation] = useState('');
  const [campusId, setCampusId] = useState(user?.campus_id || '');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [preferredContact, setPreferredContact] = useState('in_app');

  // Image Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getCampuses().then((res) => {
      setCampuses(res);
      if (!campusId && res.length > 0) {
        setCampusId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Size check (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image file size must not exceed 5MB', 'error');
        return;
      }
      // Format check
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast('Only JPG, PNG, and WEBP image formats are supported', 'error');
        return;
      }

      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      showToast('Item title must be at least 3 characters', 'error');
      return;
    }

    if (description.trim().length < 5) {
      showToast('Detailed description must be at least 5 characters', 'error');
      return;
    }

    if (!generalLocation.trim()) {
      showToast('Please provide a specific campus location', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create item report
      const createdItem = await api.createItem({
        title: title.trim(),
        description: description.trim(),
        category,
        report_type: reportType,
        general_location: generalLocation.trim(),
        campus_id: campusId || undefined,
        event_date: new Date(eventDate).toISOString(),
        preferred_contact: preferredContact,
      });

      // 2. If photo selected, upload image
      if (selectedFile) {
        try {
          await api.uploadItemImage(createdItem.public_id, selectedFile);
        } catch (imgErr: any) {
          showToast(`Report created, but image upload failed: ${imgErr.message}`, 'error');
        }
      }

      showToast(`${reportType === 'lost' ? 'Lost' : 'Found'} item report posted successfully!`, 'success');
      navigate(`/items/${createdItem.public_id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Type Toggle Tabs */}
        <div className="flex rounded-2xl bg-slate-200/80 p-1.5 mb-8 shadow-inner">
          <button
            type="button"
            onClick={() => setReportType('lost')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              reportType === 'lost'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            Report Lost Belonging
          </button>
          <button
            type="button"
            onClick={() => setReportType('found')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              reportType === 'found'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Report Found Belonging
          </button>
        </div>

        {/* Guidance Banner */}
        {reportType === 'found' ? (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">Found Item Security Guidance:</strong>
              Do not publish full student ID roll numbers, serial numbers, passwords, or secret marks in the public description. Keep unique identifiers private so claimants can prove authentic ownership!
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">Lost Item Best Practice:</strong>
              Provide clear details about color, brand, approximate time, and campus location. Our smart algorithm will actively match your report with recently found items!
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            {reportType === 'lost' ? 'What belonging did you lose?' : 'What item did you find?'}
          </h2>
          <p className="text-xs text-slate-500 mb-8">
            Complete the fields below to publish a verified report across the university network.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Item Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  reportType === 'lost'
                    ? 'e.g. Navy Blue Herschel Backpack, Student ID Card, Casio Calculator'
                    : 'e.g. Found Blue Backpack in Library, Black Wallet near Counter'
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Category & Campus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Category <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Campus Facility <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={campusId}
                    onChange={(e) => setCampusId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location & Approximate Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Campus Location / Building <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={generalLocation}
                    onChange={(e) => setGeneralLocation(e.target.value)}
                    placeholder="e.g. Central Library 2nd floor, Cafeteria Table 4"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Approximate Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  reportType === 'lost'
                    ? 'Mention colors, stickers, brand names, or distinctive traits...'
                    : 'Describe general physical appearance. Remember: keep confidential IDs or serial numbers unlisted.'
                }
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Item Photo (Optional)
              </label>

              {imagePreview ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-w-sm">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/20 rounded-2xl p-6 text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-bold text-blue-600 block mb-0.5">
                    Click to browse and upload photo
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Supports JPG, PNG, WEBP up to 5MB
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Preferred Contact Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Preferred Contact Channel
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferredContact('in_app')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    preferredContact === 'in_app'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  In-App Message (Safest)
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredContact('email')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    preferredContact === 'email'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Campus Email
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredContact('phone')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    preferredContact === 'phone'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Phone / Text
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-7 py-3 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center gap-2 ${
                  reportType === 'lost'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                }`}
              >
                {submitting ? 'Publishing Report...' : `Publish ${reportType === 'lost' ? 'Lost' : 'Found'} Report`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
