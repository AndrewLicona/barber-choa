'use client';

import { Service } from '@/types/database';
import { formatCurrency } from '@/lib/whatsapp';
import { Clock, Scissors, Sparkles, ChevronRight } from 'lucide-react';

interface Props {
  service: Service;
  onSelect: (service: Service) => void;
}

export function ServiceCard({ service, onSelect }: Props) {
  const isBarber = service.business_type === 'barberia';

  return (
    <div
      onClick={() => onSelect(service)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-300 cursor-pointer ${
        isBarber
          ? 'bg-[#101625] hover:bg-[#141b2e] border border-white/10 hover:border-[#d4af37]/50 hover:shadow-2xl hover:shadow-[#d4af37]/10'
          : 'bg-white hover:bg-stone-50 border border-stone-200/90 hover:border-rose-400 hover:shadow-xl hover:shadow-rose-500/5'
      }`}
    >
      <div>
        {/* Foto del Servicio (o banner estilizado) */}
        {service.image_url ? (
          <div className="relative w-full h-36 sm:h-48 overflow-hidden bg-black/40">
            <img
              src={service.image_url}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101625] via-transparent to-black/30" />
            
            {/* Badges sobre la imagen */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
              <span
                className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full backdrop-blur-md ${
                  isBarber
                    ? 'bg-black/70 text-[#f3e5ab] border border-[#d4af37]/40'
                    : 'bg-white/90 text-rose-600 border border-rose-200'
                }`}
              >
                {service.category || (isBarber ? 'Barbería' : 'Manicura')}
              </span>

              <div
                className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-medium px-2 py-0.5 rounded-full backdrop-blur-md ${
                  isBarber ? 'bg-black/70 text-zinc-200 border border-white/15' : 'bg-white/90 text-stone-600 border border-stone-200'
                }`}
              >
                <Clock className="w-3 h-3 text-[#d4af37]" />
                <span>{service.duration_minutes} min</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-4 px-4 sm:px-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isBarber
                    ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20'
                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}
              >
                {service.category || (isBarber ? 'Barbería' : 'Manicura')}
              </span>

              <div
                className={`flex items-center gap-1 text-[11px] font-mono font-medium ${
                  isBarber ? 'text-zinc-400' : 'text-stone-500'
                }`}
              >
                <Clock className="w-3 h-3 text-[#d4af37]" />
                <span>{service.duration_minutes} min</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-5">
          {/* Title & Description */}
          <h3
            className={`text-sm sm:text-base md:text-lg font-bold tracking-tight mb-1 sm:mb-1.5 group-hover:translate-x-0.5 transition-transform ${
              isBarber ? 'text-white' : 'text-stone-900'
            }`}
          >
            {service.title}
          </h3>

          {service.description && (
            <p
              className={`text-xs leading-relaxed line-clamp-2 mb-3 sm:mb-4 ${
                isBarber ? 'text-zinc-400' : 'text-stone-600'
              }`}
            >
              {service.description}
            </p>
          )}

          {/* Price & CTA Button */}
          <div className="flex items-center justify-between pt-3 border-t border-dashed border-white/10 gap-2">
            <div>
              <span
                className={`text-[9px] uppercase font-bold tracking-wider block ${
                  isBarber ? 'text-zinc-500' : 'text-stone-400'
                }`}
              >
                Precio
              </span>
              <span
                className={`text-base sm:text-lg font-extrabold tracking-tight ${
                  isBarber ? 'text-[#f3e5ab]' : 'text-rose-600'
                }`}
              >
                {formatCurrency(service.price)}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(service);
              }}
              className={`shrink-0 flex items-center gap-1 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                isBarber
                  ? 'gold-button text-black'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
              }`}
            >
              <span>Reservar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
