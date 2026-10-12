'use client';

import { Worker, Schedule } from '@/types/database';
import { Calendar, Clock, MapPin, ExternalLink, Scissors, Star, Shield, MapPin as MapPinIcon } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/whatsapp';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BarberCardProps {
  worker: Worker;
  variant?: 'compact' | 'full' | 'profile';
  onBook?: (worker: Worker) => void;
  showBookButton?: boolean;
  businessType?: 'barberia' | 'manicura';
}

const DAY_SHORT: Record<number, string> = {
  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié',
  4: 'Jue', 5: 'Vie', 6: 'Sáb',
};

interface BarberCardProps {
  worker: Worker;
  variant?: 'compact' | 'full' | 'profile';
  onBook?: (worker: Worker) => void;
  showBookButton?: boolean;
  businessType?: 'barberia' | 'manicura';
}

export function BarberCard({
  worker,
  variant = 'full',
  onBook,
  showBookButton = true,
  businessType = 'barberia',
}: BarberCardProps) {
  const router = useRouter();
  const isCompact = variant === 'compact';

  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onBook) onBook(worker);
    else router.push(`/barberia/barbero/${worker.id}?book=true`);
  };

  if (isCompact) {
    return (
      <Link
        href={`/barberia/barbero/${worker.id}`}
        className="p-3 rounded-xl bg-[#121216] border border-white/10 flex items-center justify-between gap-3 hover:border-amber-500/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-lg overflow-hidden ring-1 ring-white/10 shrink-0">
            {worker.avatar_url ? (
              <Image
                src={worker.avatar_url}
                alt={worker.name}
                fill
                className="object-cover"
                sizes="44px"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-amber-500 to-rose-500">
                <span className="text-xl font-bold text-white">
                  {worker.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{worker.name}</h4>
            <p className="text-[11px] text-zinc-400 font-mono line-clamp-1">
              {worker.bio || 'Especialista en cortes & barba'}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // Helper para agrupar horarios
  const getScheduleGroups = (schedules?: Schedule[]) => {
    if (!schedules) return [];
    const active = schedules.filter(s => s.is_active);
    if (active.length === 0) return [];
    const grouped = active.reduce((acc, s) => {
      const key = `${s.start_time}-${s.end_time}`;
      if (!acc[key]) acc[key] = { days: [], time: `${s.start_time} - ${s.end_time}` };
      acc[key].days.push(s.day_of_week);
      return acc;
    }, {} as Record<string, { days: number[], time: string }>);
    return Object.entries(grouped).map(([key, { days, time }]) => ({
      time,
      days: days.sort((a, b) => a - b).map(d => DAY_SHORT[d]).join(' · ')
    }));
  };

  // Render avatar
  let avatarContent;
  if (worker.avatar_url) {
    avatarContent = (
      <Image
        src={worker.avatar_url}
        alt={worker.name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    );
  } else {
    avatarContent = (
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-rose-500 to-amber-500 flex items-center justify-center">
        <span className="text-6xl font-bold text-white/90">
          {worker.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/barberia/barbero/${worker.id}`}
      className="group block relative rounded-2xl overflow-hidden border border-white/10 bg-[#121216] hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/10"
    >
      {/* Imagen de portada - más cuadrada (aspect-square) */}
      <div className="relative aspect-square overflow-hidden">
        {renderAvatar(worker)}
        
        {/* Badge activo */}
        {worker.is_active && (
          <div className="absolute top-3 right-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-ping" />
          </div>
        )}

        </div>

      {/* Contenido minimalista: solo nombre + botón */}
      <div className="p-4 space-y-3">
        {/* Nombre y tag */}
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-luxury text-lg font-bold text-white truncate">
            {worker.name}
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
            BARBERO
          </span>
        </div>

        {/* Botón reservar principal (siempre visible al final) */}
        <span 
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onBook?.(worker); }}
          className="w-full py-2.5 rounded-xl gold-button text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer block"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Reservar Cita</span>
        </span>
      </div>
    </Link>
  );
}

function renderAvatar(worker: Worker) {
  if (worker.avatar_url) {
    return (
      <Image
        src={worker.avatar_url}
        alt={worker.name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    );
  }
  
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-rose-500 to-amber-500 flex items-center justify-center">
      <span className="text-6xl font-bold text-white/90">
        {worker.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}