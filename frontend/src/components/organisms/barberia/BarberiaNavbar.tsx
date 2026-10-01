'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scissors, Shield, Phone, Sparkles, Calendar, Clock } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/whatsapp';

interface BarberiaNavbarProps {
  phone?: string;
  onOpenBooking?: () => void;
}

export function BarberiaNavbar({ phone, onOpenBooking }: BarberiaNavbarProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/barberia/admin');

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (pathname === '/barberia') {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-white/[0.08] bg-[#09090b]/90 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo Oficial */}
        <Link href="/barberia" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden ring-1 ring-[#d4af37]/40 shadow-lg group-hover:ring-[#d4af37] transition-all bg-black flex-shrink-0">
            <img
              src="/logo_barberchoa.jpg"
              alt="Barber Choa"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-luxury font-bold tracking-widest text-sm sm:text-base text-white group-hover:text-[#f3e5ab] transition-colors leading-none">
              BARBER <span className="text-[#d4af37]">CHOA</span>
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] text-zinc-400 tracking-[0.2em] uppercase font-mono">
                EN VIVO • STUDIO VIP
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <a
            href="#turnos"
            onClick={(e) => scrollToSection(e, 'turnos')}
            className="text-xs font-semibold tracking-wider text-zinc-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-all flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Turnos en Vivo</span>
          </a>

          <a
            href="#servicios"
            onClick={(e) => scrollToSection(e, 'servicios')}
            className="text-xs font-semibold tracking-wider text-zinc-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-all flex items-center gap-1.5"
          >
            <Scissors className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Servicios</span>
          </a>

          <a
            href="#portafolio"
            onClick={(e) => scrollToSection(e, 'portafolio')}
            className="text-xs font-semibold tracking-wider text-zinc-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Portafolio</span>
          </a>

          <Link
            href="/barberia/admin"
            className={`flex items-center gap-1.5 text-xs font-bold tracking-wider py-2 px-3 rounded-xl transition-all ${
              isAdmin
                ? 'text-[#d4af37] bg-[#d4af37]/20 border border-[#d4af37]/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>
        </nav>

        {/* Desktop CTA / Mobile WhatsApp Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {phone && (
            <a
              href={`https://wa.me/${formatPhoneNumber(phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[#d4af37]/30 text-xs font-semibold text-[#f3e5ab] transition-all flex items-center gap-1.5"
              title="WhatsApp de atención"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}

          {onOpenBooking && (
            <button
              onClick={onOpenBooking}
              className="hidden sm:flex gold-button px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Reservar Cita</span>
            </button>
          )}

          {/* Quick link to admin on mobile header */}
          <Link
            href="/barberia/admin"
            className={`md:hidden p-2 rounded-xl border transition-all ${
              isAdmin
                ? 'text-[#d4af37] bg-[#d4af37]/20 border-[#d4af37]/40'
                : 'text-zinc-400 border-white/10 hover:bg-white/5'
            }`}
            title="Panel de Administración"
          >
            <Shield className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
