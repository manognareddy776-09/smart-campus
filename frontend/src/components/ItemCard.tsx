import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Building2, 
  Laptop, 
  CreditCard, 
  Wallet, 
  ShoppingBag, 
  BookOpen, 
  Key, 
  Sparkles, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { ItemSummary } from '../types';
import { StatusBadge } from './StatusBadge';

export const getCategoryIcon = (category: string) => {
  const norm = category.toLowerCase();
  if (norm.includes('electronic') || norm.includes('phone') || norm.includes('laptop')) return Laptop;
  if (norm.includes('card') || norm.includes('id')) return CreditCard;
  if (norm.includes('wallet') || norm.includes('purse')) return Wallet;
  if (norm.includes('bag') || norm.includes('backpack')) return ShoppingBag;
  if (norm.includes('book') || norm.includes('notebook')) return BookOpen;
  if (norm.includes('key')) return Key;
  if (norm.includes('accessor') || norm.includes('watch') || norm.includes('bottle')) return Sparkles;
  return HelpCircle;
};

interface ItemCardProps {
  item: ItemSummary;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const CategoryIcon = getCategoryIcon(item.category);
  const formattedDate = new Date(item.event_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const isLost = item.report_type === 'lost';

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Card Header & Thumbnail */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden flex items-center justify-center">
        {item.image_path ? (
          <img
            src={item.image_path}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-6">
            <div className={`p-4 rounded-2xl mb-2 ${isLost ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
              <CategoryIcon className="w-9 h-9" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.category}</span>
          </div>
        )}

        {/* Floating Report Type Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
              isLost
                ? 'bg-rose-600/90 text-white border border-rose-500'
                : 'bg-emerald-600/90 text-white border border-emerald-500'
            }`}
          >
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
        </div>

        {/* Public ID */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-900/75 text-white backdrop-blur-md">
            {item.public_id}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Status & Category */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              <CategoryIcon className="w-3.5 h-3.5 text-slate-500" />
              {item.category}
            </span>
            <StatusBadge status={item.status} />
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
            {item.title}
          </h3>

          {/* Location & Date */}
          <div className="space-y-1.5 text-xs text-slate-600 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{item.general_location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{isLost ? 'Lost around:' : 'Found around:'} {formattedDate}</span>
            </div>
            {item.campus_name && (
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate text-slate-500">{item.campus_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Reported {new Date(item.created_at).toLocaleDateString()}
          </span>
          <Link
            to={`/items/${item.public_id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group-hover:translate-x-0.5 duration-200"
          >
            Details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
