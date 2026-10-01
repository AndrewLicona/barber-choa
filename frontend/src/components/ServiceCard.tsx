'use client';

import { Service } from '@/types/database';
import { formatCurrency } from '@/lib/whatsapp';
import { Clock, ChevronRight } from 'lucide-react';

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
      <div className="flex flex-col h-full justify-between">
        <div>
          {/* Foto del Servicio */}
          {service.image_url ? (
            <div className="relative w-full h-28 sm:h-44 overflow-hidden bg-black/40">
              <img
                src={service.image_url}
                alt={service.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101625] via-transparent to-black/30" />
              
              {/* Badges sobre la imagen */}
              <div className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 right-1.5 sm:right-2.5 flex items-center justify-between gap-1">
                <span
                  className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full backdrop-blur-md truncate max-w-[65%] ${
                    isBarber
                      ? 'bg-black/70 text-[#f3e5ab] border border-[#d4af37]/40'
                      : 'bg-white/90 text-rose-600 border border-rose-200'
                  }`}
                >
                  {service.category || (isBarber ? 'Barbería' : 'Manicura')}
                </span>

                <div
                  className={`flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-full backdrop-blur-md shrink-0 ${
                    isBarber ? 'bg-black/70 text-zinc-200 border border-white/15' : 'bg-white/90 text-stone-600 border border-stone-200'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#d4af37]" />
                  <span>{service.duration_minutes}m</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-2.5 px-2.5 sm:pt-4 sm:px-5">
              <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
                <span
                  className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                    isBarber
                      ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20'
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}
                >
                  {service.category || (isBarber ? 'Barbería' : 'Manicura')}
                </span>

                <div
                  className={`flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[11px] font-mono font-medium ${
                    isBarber ? 'text-zinc-400' : 'text-stone-500'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#d4af37]" />
                  <span>{service.duration_minutes}m</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-2.5 sm:p-5">
            {/* Title & Description */}
            <h3
              className={`text-xs sm:text-base font-bold tracking-tight mb-1 group-hover:translate-x-0.5 transition-transform line-clamp-1 sm:line-clamp-none ${
                isBarber ? 'text-white' : 'text-stone-900'
              }`}
            >
              {service.title}
            </h3>

            {service.description && (
              <p
                className={`hidden sm:block text-xs leading-relaxed line-clamp-2 mb-3 sm:mb-4 ${
                  isBarber ? 'text-zinc-400' : 'text-stone-600'
                }`}
              >
                {service.description}
              </p>
            )}
          </div>
        </div>

        {/* Price & CTA Button */}
        <div className="p-2.5 sm:p-5 pt-0 sm:pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 sm:pt-3 border-t border-dashed border-white/10 gap-1.5 sm:gap-2">
            <div>
              <span
                className={`hidden sm:block text-[9px] uppercase font-bold tracking-wider ${
                  isBarber ? 'text-zinc-500' : 'text-stone-400'
                }`}
              >
                Precio
              </span>
              <span
                className={`text-xs sm:text-base font-extrabold tracking-tight ${
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
              className={`w-full sm:w-auto shrink-0 flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-md active:scale-95 ${
                isBarber
                  ? 'gold-button text-black'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
              }`}
            >
              <span>Reservar</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
