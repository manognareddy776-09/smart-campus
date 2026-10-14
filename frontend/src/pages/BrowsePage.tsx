import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  RefreshCw,
  FolderOpen,
  ArrowUpDown,
  Building2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client';
import { ItemSummary, Campus, PaginatedItems } from '../types';
import { ItemCard } from '../components/ItemCard';

const CATEGORIES = [
  'All Categories',
  'Electronics',
  'ID Cards',
  'Wallets',
  'Bags',
  'Books',
  'Keys',
  'Accessories',
  'Other'
];

export const BrowsePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search filter states initialized from URL parameters
  const [keyword, setKeyword] = useState<string>(searchParams.get('q') || '');
  const [reportType, setReportType] = useState<string>(searchParams.get('report_type') || 'all');
  const [category, setCategory] = useState<string>(searchParams.get('category') || 'All Categories');
  const [campusId, setCampusId] = useState<string>(searchParams.get('campus_id') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [sortOrder, setSortOrder] = useState<string>(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [data, setData] = useState<PaginatedItems>({
    items: [],
    total: 0,
    page: 1,
    page_size: 12,
    total_pages: 1
  });
  const [loading, setLoading] = useState(true);

  // Fetch campus list once
  useEffect(() => {
    api.getCampuses().then(setCampuses).catch(console.error);
  }, []);

  // Sync state to URL params
  const syncParams = (newPage = page) => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (reportType !== 'all') params.set('report_type', reportType);
    if (category !== 'All Categories') params.set('category', category);
    if (campusId) params.set('campus_id', campusId);
    if (statusFilter) params.set('status', statusFilter);
    if (sortOrder !== 'newest') params.set('sort', sortOrder);
    if (newPage > 1) params.set('page', newPage.toString());

    setSearchParams(params, { replace: true });
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.listItems({
        q: keyword.trim() || undefined,
        report_type: reportType === 'all' ? undefined : reportType,
        category: category === 'All Categories' ? undefined : category,
        campus_id: campusId || undefined,
        status: statusFilter || undefined,
        sort: sortOrder,
        page,
        page_size: 12
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    syncParams(page);
  }, [reportType, category, campusId, statusFilter, sortOrder, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchItems();
    syncParams(1);
  };

  const clearAllFilters = () => {
    setKeyword('');
    setReportType('all');
    setCategory('All Categories');
    setCampusId('');
    setStatusFilter('');
    setSortOrder('newest');
    setPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters =
    keyword.trim() !== '' ||
    reportType !== 'all' ||
    category !== 'All Categories' ||
    campusId !== '' ||
    statusFilter !== '' ||
    sortOrder !== 'newest';

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Browse Campus Items</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search verified lost reports and found belongings across college facilities.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-8">
          {/* Main search and report type tabs */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center pb-5 border-b border-slate-100">
            {/* Search input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search title, description, or campus building..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Search
              </button>
            </form>

            {/* Type buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => { setReportType('all'); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  reportType === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => { setReportType('lost'); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  reportType === 'lost'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                Lost Items
              </button>
              <button
                type="button"
                onClick={() => { setReportType('found'); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  reportType === 'found'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Found Items
              </button>
            </div>
          </div>

          {/* Secondary filter dropdowns */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Campus */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Campus Facility
              </label>
              <select
                value={campusId}
                onChange={(e) => { setCampusId(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Campuses</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Any Status</option>
                <option value="open">Active Listing</option>
                <option value="claimed">Under Claim</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Sort Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Active filter pills & clear button */}
          {hasActiveFilters && (
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-semibold text-slate-500">Active filters:</span>
                {keyword && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium border border-blue-200 flex items-center gap-1">
                    "{keyword}"
                    <button onClick={() => setKeyword('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {reportType !== 'all' && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                    Type: {reportType}
                    <button onClick={() => setReportType('all')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {category !== 'All Categories' && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                    {category}
                    <button onClick={() => setCategory('All Categories')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {statusFilter && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>

              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>
          )}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6 text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-800">{data.items.length}</strong> of{' '}
            <strong className="text-slate-800">{data.total}</strong> matching listings
          </span>
          <span>Page {data.page} of {data.total_pages || 1}</span>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-semibold">Filtering campus reports...</p>
          </div>
        ) : data.items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center max-w-lg mx-auto shadow-sm">
            <FolderOpen className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No reports matched your criteria</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Try adjusting or clearing your keyword, location, or category filters.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Reset All Filters
              </button>
              <Link
                to="/report/lost"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Report Lost Belonging
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {data.total_pages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: data.total_pages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                  page === num
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page >= data.total_pages}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
