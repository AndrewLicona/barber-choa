'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scissors, Shield, ArrowLeft } from 'lucide-react';

export function BarberiaNav() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/barberia/admin');

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl border-b border-white/[0.08] bg-[#09090b]/90">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        {/* Logo Oficial Barber Choa */}
        <Link href="/barberia" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-1 ring-[#d4af37]/40 shadow-lg group-hover:ring-[#d4af37] transition-all bg-black flex-shrink-0">
            <img
              src="/logo_barberchoa.jpg"
              alt="Barber Choa"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-luxury font-bold tracking-widest text-sm sm:text-base text-white group-hover:text-[#f3e5ab] transition-colors leading-none">
              BARBER <span className="text-[#d4af37]">CHOA</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-zinc-400 tracking-[0.2em] uppercase font-mono mt-0.5">
              MAESTRÍA & TRADICIÓN
            </span>
          </div>
        </Link>

        {/* Enlaces de Barbería */}
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/barberia"
            className="text-xs font-semibold tracking-wider text-zinc-400 hover:text-white transition-colors"
          >
            Servicios & Turnos
          </Link>

          <Link
            href="/barberia/admin"
            className={`flex items-center gap-1.5 text-xs font-bold tracking-wider py-1.5 px-3 rounded-xl transition-all ${
              isAdmin
                ? 'text-[#d4af37] bg-[#d4af37]/20 border border-[#d4af37]/40 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] border border-transparent'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Barbería</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
