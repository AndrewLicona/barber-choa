'use client';

import React, { useState } from 'react';
import { Camera, X, Sparkles, Calendar } from 'lucide-react';
import { PortfolioItem } from '@/types/database';

interface PortfolioGalleryProps {
  items: PortfolioItem[];
  onSelectServiceToBook?: () => void;
}

export function PortfolioGallery({ items, onSelectServiceToBook }: PortfolioGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PortfolioItem | null>(null);

  return (
    <section id="portafolio" className="mt-14 pt-10 border-t border-white/[0.08] scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] font-mono tracking-[0.2em] text-[#d4af37] uppercase font-bold flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            PORTAFOLIO EXCLUSIVO
          </span>
          <h2 className="font-luxury text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase mt-1">
            Nuestros Trabajos & <span className="gold-gradient-text">Estilos</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 max-w-lg">
            Degradados precisos, perfilado de barba al detalle y acabados de alta barbería tradicional.
          </p>
        </div>
        {items.length > 0 && (
          <span className="text-xs font-mono text-[#f3e5ab] bg-white/[0.04] border border-[#d4af37]/30 px-3 py-1 rounded-xl self-start sm:self-auto">
            {items.length} Fotos disponibles
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-white/[0.08] bg-[#121216]/40">
          <Camera className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-zinc-300">Galería en actualización</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Muy pronto compartiremos las fotos de los últimos cortes y diseños realizados por nuestros maestros barberos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedPhoto(item)}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-black/60 border border-white/[0.08] hover:border-[#d4af37]/50 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#d4af37]/10"
            >
              <img
                src={item.image_url}
                alt={item.title || 'Corte Barber Choa'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-xs sm:text-sm font-bold text-white leading-tight drop-shadow-md truncate">
                  {item.title || 'Trabajo Barber Choa'}
                </p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-black/60 text-[#f3e5ab] border border-[#d4af37]/30 backdrop-blur-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal de Foto */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-lg w-full bg-[#121216] border border-[#d4af37]/40 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative aspect-[4/5] sm:aspect-square w-full bg-black overflow-hidden">
              <img
                src={selectedPhoto.image_url}
                alt={selectedPhoto.title || 'Foto de portafolio'}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-5">
              <h3 className="text-base font-bold text-white font-luxury">
                {selectedPhoto.title || 'Trabajo Exclusivo Barber Choa'}
              </h3>
              {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedPhoto.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[#f3e5ab] border border-[#d4af37]/30"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <p className="text-xs text-zinc-400">¿Quieres este estilo?</p>
                <button
                  onClick={() => {
                    setSelectedPhoto(null);
                    onSelectServiceToBook?.();
                  }}
                  className="gold-button px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar Cita</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
