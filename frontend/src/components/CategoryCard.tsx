import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  count?: number;
  isSelected?: boolean;
  onClick: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  icon: Icon,
  isSelected = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`group flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
          : 'bg-white border-slate-200/80 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md'
      }`}
    >
      <div
        className={`p-3 rounded-xl mb-2.5 transition-colors ${
          isSelected
            ? 'bg-white/20 text-white'
            : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
        }`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-sm font-semibold tracking-tight">{name}</span>
    </button>
  );
};
