'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Shield, Calendar, Phone } from 'lucide-react';

interface ManicuraNavProps {
  onOpenBooking?: () => void;
  phone?: string;
}

export function ManicuraNav({ onOpenBooking, phone }: ManicuraNavProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/manicura/admin');

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl border-b border-rose-200/70 bg-[#fffdfb]/90 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Logo Oficial LM Nails */}
        <Link href="/manicura" className="flex items-center gap-3 group shrink-0">
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden ring-2 ring-rose-300/80 shadow-md shadow-rose-200/50 group-hover:ring-rose-400 group-hover:scale-105 transition-all bg-white flex-shrink-0">
            <img
              src="/logo_lmnail.jpg"
              alt="LM Nails & Spa"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-sm sm:text-base text-stone-900 group-hover:text-rose-600 transition-colors leading-none font-serif">
                LM NAILS <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 font-sans font-bold">& SPA</span>
              </span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-rose-400" />
            </div>
            <span className="text-[9px] sm:text-[10px] text-stone-500 tracking-[0.2em] uppercase font-mono mt-0.5">
              STUDIO DE ALTA COSTURA
            </span>
          </div>
        </Link>

        {/* Enlaces de Navegación (Desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#catalogo"
            className="text-xs font-semibold tracking-wider text-stone-600 hover:text-rose-600 transition-colors"
          >
            Diseños & Tendencias
          </a>

          <a
            href="#servicios"
            className="text-xs font-semibold tracking-wider text-stone-600 hover:text-rose-600 transition-colors"
          >
            Servicios & Precios
          </a>

          <a
            href="#especialistas"
            className="text-xs font-semibold tracking-wider text-stone-600 hover:text-rose-600 transition-colors"
          >
            Especialistas
          </a>
        </nav>

        {/* Acciones de la Cabecera */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón Reservar Cita en Navbar */}
          {onOpenBooking && (
            <button
              type="button"
              onClick={onOpenBooking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Reservar</span>
            </button>
          )}

          {/* Link Admin */}
          <Link
            href="/manicura/admin"
            className={`flex items-center gap-1.5 text-xs font-bold tracking-wider py-1.5 px-2.5 sm:px-3 rounded-xl transition-all ${
              isAdmin
                ? 'text-rose-700 bg-rose-100 border border-rose-300 shadow-sm'
                : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50/60 border border-transparent'
            }`}
            title="Panel de Administración LM Nails"
          >
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
