import React from 'react';
import { Sparkles, Frame, KeyRound, Coffee } from 'lucide-react';

export default function CategoryFilter({ categories, activeCategory, onSelectCategory, counts }) {
  const getCategoryIcon = (id) => {
    switch (id) {
      case 'amigurumis':
        return <span className="text-base">🧶</span>;
      case 'quadros':
        return <Frame className="w-4 h-4" />;
      case 'chaveiros':
        return <KeyRound className="w-4 h-4" />;
      case 'casa':
        return <Coffee className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-3 pt-1 gap-2.5 sm:gap-3.5 no-scrollbar scroll-smooth">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const count = counts[cat.id] ?? 0;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 border shadow-sm group ${
              isActive
                ? 'bg-pastel-terracotta text-white border-pastel-terracotta shadow-soft-hover scale-105'
                : 'bg-white hover:bg-cream-100 text-charcoal border-[#EFE7DC] hover:border-pastel-peachDark/50'
            }`}
          >
            <span
              className={`transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'text-white' : 'text-pastel-terracotta'
              }`}
            >
              {getCategoryIcon(cat.id)}
            </span>
            <span>{cat.label}</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                isActive
                  ? 'bg-white/25 text-white'
                  : 'bg-cream-200 text-charcoal-muted group-hover:bg-pastel-peach'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
