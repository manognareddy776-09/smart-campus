import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  FileQuestion,
  PlusCircle,
  Laptop,
  CreditCard,
  Wallet,
  ShoppingBag,
  BookOpen,
  Key,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Zap,
  Users,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';
import { ItemSummary } from '../types';
import { ItemCard } from '../components/ItemCard';
import { CategoryCard } from '../components/CategoryCard';

const CATEGORIES = [
  { name: 'Electronics', icon: Laptop },
  { name: 'ID Cards', icon: CreditCard },
  { name: 'Wallets', icon: Wallet },
  { name: 'Bags', icon: ShoppingBag },
  { name: 'Books', icon: BookOpen },
  { name: 'Keys', icon: Key },
  { name: 'Accessories', icon: Sparkles },
  { name: 'Other', icon: HelpCircle },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentItems, setRecentItems] = useState<ItemSummary[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecent();
  }, [filterType]);

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const res = await api.listItems({
        report_type: filterType === 'all' ? undefined : filterType,
        page_size: 6,
        sort: 'newest'
      });
      setRecentItems(res.items);
    } catch (err) {
      console.error('Failed to load recent items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-20 lg:py-28">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold mb-6 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Smart Similarity Algorithm Powered</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Lost something on <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">campus?</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
              Search reported items, share what you've lost, and help your campus community reunite people with their belongings securely and quickly.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
              <Link
                to="/report/lost"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all hover:scale-102"
              >
                <FileQuestion className="w-5 h-5" />
                Report Lost Item
              </Link>
              <Link
                to="/browse?report_type=found"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-lg shadow-black/10 transition-all hover:scale-102"
              >
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                Browse Found Items
              </Link>
            </div>

            {/* HERO SEARCH BOX */}
            <form
              onSubmit={handleSearchSubmit}
              className="relative max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-2"
            >
              <div className="flex items-center flex-1 px-3">
                <Search className="w-5 h-5 text-slate-300 shrink-0 mr-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search keys, ID card, Dell laptop, Block A cafeteria..."
                  className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md transition-colors shrink-0"
              >
                Search
              </button>
            </form>
          </div>

          {/* Quick stats highlight */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-slate-800 text-center text-xs text-slate-400 font-medium">
            <div>
              <span className="block text-xl font-extrabold text-white mb-0.5">100%</span>
              Private Verification
            </div>
            <div>
              <span className="block text-xl font-extrabold text-white mb-0.5">&lt; 24h</span>
              Average Match Speed
            </div>
            <div>
              <span className="block text-xl font-extrabold text-white mb-0.5">Multi-Campus</span>
              Extensible Structure
            </div>
            <div>
              <span className="block text-xl font-extrabold text-white mb-0.5">Encrypted</span>
              Proof of Ownership
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY EXPLORER */}
      <section className="py-16 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Browse by Category
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Filter quickly through frequent campus loss categories.
              </p>
            </div>
            <Link
              to="/browse"
              className="mt-3 sm:mt-0 text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group"
            >
              View all listings
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.name}
                name={cat.name}
                icon={cat.icon}
                onClick={() => navigate(`/browse?category=${encodeURIComponent(cat.name)}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* RECENT LISTINGS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Recent Campus Reports
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Latest approved belongings reported across all academic blocks.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterType('lost')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'lost'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              Lost Only
            </button>
            <button
              onClick={() => setFilterType('found')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'found'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Found Only
            </button>
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading recent reports...</p>
          </div>
        ) : recentItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No items found</h3>
            <p className="text-xs text-slate-500 mb-4">No reports recorded in this filter view yet.</p>
            <Link
              to="/report/lost"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
            >
              Submit First Report
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white font-bold text-slate-800 text-sm shadow-sm hover:shadow transition-all"
          >
            Explore Complete Directory
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-400/20">
              Simple &amp; Safe Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3 mb-4">
              How Campus Lost &amp; Found Works
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Designed with student privacy in mind. No public disclosure of serial numbers, personal phone numbers, or passwords.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-slate-800/60 rounded-2xl p-8 border border-slate-700/60 relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-extrabold text-lg flex items-center justify-center mb-6">
                  01
                </div>
                <h3 className="text-xl font-bold mb-3">Report Lost or Found</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  Quickly describe the belonging, location, and date. Upload a clear photo. If you found something, keep secret identifiers private.
                </p>
              </div>
              <div className="text-xs text-blue-300 font-semibold flex items-center gap-1 pt-4 border-t border-slate-700/60">
                <ShieldCheck className="w-4 h-4" /> Validated Form Fields
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-800/60 rounded-2xl p-8 border border-slate-700/60 relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 font-extrabold text-lg flex items-center justify-center mb-6">
                  02
                </div>
                <h3 className="text-xl font-bold mb-3">Smart Match &amp; Search</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  Our transparent algorithm instantly compares lost items with found items based on categories, TF-IDF description terms, dates, and campuses.
                </p>
              </div>
              <div className="text-xs text-purple-300 font-semibold flex items-center gap-1 pt-4 border-t border-slate-700/60">
                <Zap className="w-4 h-4" /> Normalized 0-100% Score
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-800/60 rounded-2xl p-8 border border-slate-700/60 relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-lg flex items-center justify-center mb-6">
                  03
                </div>
                <h3 className="text-xl font-bold mb-3">Private Claim &amp; Return</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  Submit a private proof of ownership. The finder reviews the details, accepts the claim, and coordinates a safe handover at campus security.
                </p>
              </div>
              <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1 pt-4 border-t border-slate-700/60">
                <Users className="w-4 h-4" /> Secure In-App Coordination
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
