'use client';

import React, { useState } from 'react';
import { Camera, Plus, Trash2 } from 'lucide-react';
import { PortfolioItem } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { PortfolioModal } from './PortfolioModal';

interface AdminPortfolioSectionProps {
  portfolio: PortfolioItem[];
  onSavePortfolioItem: (data: {
    title: string;
    image_url: string;
    tags: string[];
  }) => Promise<void>;
  onDeleteRequest: (item: PortfolioItem) => void;
  onError?: (msg: string) => void;
}

export function AdminPortfolioSection({
  portfolio,
  onSavePortfolioItem,
  onDeleteRequest,
  onError,
}: AdminPortfolioSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-luxury text-lg font-bold text-white">
            Portafolio y Galería ({portfolio.length})
          </h3>
          <p className="text-xs text-zinc-400">
            Sube fotos de tus mejores trabajos para atraer más clientes
          </p>
        </div>
        <Button
          variant="gold"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Agregar Foto
        </Button>
      </div>

      {portfolio.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-[#121216]">
          <Camera className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-400">No hay fotos en el portafolio todavía.</p>
          <Button
            variant="gold"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="mt-3"
          >
            Subir la primera foto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {portfolio.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-black/60 border border-white/[0.08] shadow-md flex flex-col justify-end"
            >
              <img
                src={item.image_url}
                alt={item.title || 'Foto de corte'}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              <button
                onClick={() => onDeleteRequest(item)}
                className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/70 hover:bg-red-500 text-white border border-white/10 transition-colors z-10"
                title="Eliminar foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <div className="relative p-3 z-10">
                <p className="text-xs font-bold text-white truncate">
                  {item.title || 'Corte Barber Choa'}
                </p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-[#f3e5ab] border border-[#d4af37]/30"
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

      {/* Modal subir foto */}
      <PortfolioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSavePortfolioItem}
        onError={onError}
      />
    </div>
  );
}
