'use client';

import { useState } from 'react';
import { GalleryItem } from '@/types/database';
import { Sparkles, Eye } from 'lucide-react';

interface Props {
  items: GalleryItem[];
}

export function GalleryGrid({ items }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null);

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))];

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <div>
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat || 'all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            {cat === 'all' ? 'Todos los Diseños' : cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveImage(item)}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-stone-100 cursor-pointer shadow-sm hover:shadow-lg transition-all"
          >
            <img
              src={item.image_url}
              alt={item.title || 'Diseño de uñas'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
              loading="lazy"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                {item.category}
              </span>
              <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                {item.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox preview modal */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          >
            <img
              src={activeImage.image_url}
              alt={activeImage.title || 'Diseño'}
              className="w-full max-h-[70vh] object-cover"
            />
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                  {activeImage.category}
                </span>
                <h4 className="text-base font-bold">{activeImage.title}</h4>
              </div>
              <button
                onClick={() => setActiveImage(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
