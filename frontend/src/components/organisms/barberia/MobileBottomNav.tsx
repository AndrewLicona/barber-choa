'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scissors, Clock, Calendar, Sparkles, Shield } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenBooking?: () => void;
}

export function MobileBottomNav({ onOpenBooking }: MobileBottomNavProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/barberia/admin');
  const isPublic = pathname === '/barberia';

  const scrollTo = (id: string) => {
    if (isPublic) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.location.href = `/barberia#${id}`;
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-2xl border-t border-white/[0.08] px-2 py-1.5 shadow-[0_-10px_25px_rgba(0,0,0,0.8)] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
        {/* Turnos */}
        <button
          onClick={() => scrollTo('turnos')}
          className="flex flex-col items-center justify-center py-1.5 text-zinc-400 hover:text-white transition-colors group"
        >
          <Clock className="w-5 h-5 text-zinc-400 group-hover:text-[#d4af37] transition-colors" />
          <span className="text-[10px] font-mono tracking-tight mt-1 text-zinc-400 group-hover:text-zinc-200">
            Turnos
          </span>
        </button>

        {/* Cortes */}
        <button
          onClick={() => scrollTo('servicios')}
          className="flex flex-col items-center justify-center py-1.5 text-zinc-400 hover:text-white transition-colors group"
        >
          <Scissors className="w-5 h-5 text-zinc-400 group-hover:text-[#d4af37] transition-colors" />
          <span className="text-[10px] font-mono tracking-tight mt-1 text-zinc-400 group-hover:text-zinc-200">
            Cortes
          </span>
        </button>

        {/* Action Button: Agendar Cita (Elevated & Highlighted) */}
        <button
          onClick={() => {
            if (onOpenBooking) {
              onOpenBooking();
            } else {
              scrollTo('servicios');
            }
          }}
          className="relative -top-3 flex flex-col items-center justify-center"
          title="Reservar Cita Ahora"
        >
          <div className="w-12 h-12 rounded-2xl gold-button flex items-center justify-center shadow-xl shadow-[#d4af37]/30 ring-2 ring-black active:scale-95 transition-transform">
            <Calendar className="w-6 h-6 text-black stroke-[2.2]" />
          </div>
          <span className="text-[9px] font-bold tracking-wider text-[#f3e5ab] mt-1 uppercase">
            Agendar
          </span>
        </button>

        {/* Portafolio */}
        <button
          onClick={() => scrollTo('portafolio')}
          className="flex flex-col items-center justify-center py-1.5 text-zinc-400 hover:text-white transition-colors group"
        >
          <Sparkles className="w-5 h-5 text-zinc-400 group-hover:text-[#d4af37] transition-colors" />
          <span className="text-[10px] font-mono tracking-tight mt-1 text-zinc-400 group-hover:text-zinc-200">
            Galería
          </span>
        </button>

        {/* Admin */}
        <Link
          href="/barberia/admin"
          className={`flex flex-col items-center justify-center py-1.5 transition-colors ${
            isAdmin ? 'text-[#d4af37]' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px] font-mono tracking-tight mt-1">
            Admin
          </span>
        </Link>
      </div>
    </nav>
  );
}
