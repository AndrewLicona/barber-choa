'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Heart, Calendar, Shield, User } from 'lucide-react';

interface ManicuraMobileBottomNavProps {
  onOpenBooking?: () => void;
}

export function ManicuraMobileBottomNav({ onOpenBooking }: ManicuraMobileBottomNavProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/manicura/admin');
  const isPublic = pathname === '/manicura';

  const scrollTo = (id: string) => {
    if (isPublic) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.location.href = `/manicura#${id}`;
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fffbf9]/95 backdrop-blur-2xl border-t border-rose-200/80 px-2 py-1.5 shadow-[0_-10px_25px_rgba(244,114,182,0.15)] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
        {/* Catálogo de Tendencias */}
        <button
          onClick={() => scrollTo('catalogo')}
          className="flex flex-col items-center justify-center py-1.5 text-stone-500 hover:text-rose-600 transition-colors group"
        >
          <Sparkles className="w-5 h-5 text-stone-400 group-hover:text-rose-500 transition-colors" />
          <span className="text-[10px] font-medium tracking-tight mt-1 text-stone-500 group-hover:text-rose-600">
            Diseños
          </span>
        </button>

        {/* Servicios */}
        <button
          onClick={() => scrollTo('servicios')}
          className="flex flex-col items-center justify-center py-1.5 text-stone-500 hover:text-rose-600 transition-colors group"
        >
          <Heart className="w-5 h-5 text-stone-400 group-hover:text-rose-500 transition-colors" />
          <span className="text-[10px] font-medium tracking-tight mt-1 text-stone-500 group-hover:text-rose-600">
            Servicios
          </span>
        </button>

        {/* Action Button: Agendar Cita (Elevado & Destacado) */}
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 flex items-center justify-center shadow-xl shadow-rose-500/35 ring-2 ring-white active:scale-95 transition-transform">
            <Calendar className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          <span className="text-[9px] font-bold tracking-wider text-rose-600 mt-1 uppercase">
            Agendar
          </span>
        </button>

        {/* Especialista */}
        <button
          onClick={() => scrollTo('especialista')}
          className="flex flex-col items-center justify-center py-1.5 text-stone-500 hover:text-rose-600 transition-colors group"
        >
          <User className="w-5 h-5 text-stone-400 group-hover:text-rose-500 transition-colors" />
          <span className="text-[10px] font-medium tracking-tight mt-1 text-stone-500 group-hover:text-rose-600">
            Especialista
          </span>
        </button>

        {/* Admin */}
        <Link
          href="/manicura/admin"
          className={`flex flex-col items-center justify-center py-1.5 transition-colors ${
            isAdmin ? 'text-rose-600' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">
            Admin
          </span>
        </Link>
      </div>
    </nav>
  );
}
