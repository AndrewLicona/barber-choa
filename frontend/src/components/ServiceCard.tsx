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
      className={`group relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 ${
        isBarber
          ? 'bg-[#101625] hover:bg-[#141b2e] border border-white/10 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5'
          : 'bg-white hover:bg-stone-50 border border-stone-200/90 hover:border-rose-400 hover:shadow-xl hover:shadow-rose-500/5'
      }`}
    >
      <div>
        {/* Category & Duration Tag */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              isBarber
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}
          >
            {service.category || (isBarber ? 'Barbería' : 'Manicura')}
          </span>

          <div
            className={`flex items-center gap-1 text-xs font-mono font-medium ${
              isBarber ? 'text-gray-400' : 'text-stone-500'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{service.duration_minutes} min</span>
          </div>
        </div>

        {/* Title & Description */}
        <h3
          className={`text-lg font-bold tracking-tight mb-2 group-hover:translate-x-0.5 transition-transform ${
            isBarber ? 'text-white' : 'text-stone-900'
          }`}
        >
          {service.title}
        </h3>

        {service.description && (
          <p
            className={`text-xs leading-relaxed line-clamp-3 mb-6 ${
              isBarber ? 'text-gray-400' : 'text-stone-600'
            }`}
          >
            {service.description}
          </p>
        )}
      </div>

      {/* Price & CTA Button */}
      <div className="flex items-center justify-between pt-4 border-t border-dashed border-white/10">
        <div>
          <span
            className={`text-[10px] uppercase font-bold tracking-wider block ${
              isBarber ? 'text-gray-500' : 'text-stone-400'
            }`}
          >
            Inversión
          </span>
          <span
            className={`text-lg font-extrabold tracking-tight ${
              isBarber ? 'text-amber-400' : 'text-rose-600'
            }`}
          >
            {formatCurrency(service.price)}
          </span>
        </div>

        <button
          onClick={() => onSelect(service)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
            isBarber
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
              : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
          }`}
        >
          <span>Reservar</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
