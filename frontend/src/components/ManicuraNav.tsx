'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Shield, Heart } from 'lucide-react';

export function ManicuraNav() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/manicura/admin');

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl border-b border-rose-200/60 bg-[#faf7f2]/90">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        {/* Logo Oficial LM Nails */}
        <Link href="/manicura" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl overflow-hidden ring-2 ring-rose-300 shadow-md group-hover:ring-rose-400 transition-all bg-white flex-shrink-0">
            <img
              src="/logo_lmnail.jpg"
              alt="LM Nails & Spa"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-sm sm:text-base text-stone-900 group-hover:text-rose-600 transition-colors leading-none">
              LM NAILS <span className="text-rose-500">& SPA</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-stone-500 tracking-widest uppercase font-mono mt-0.5">
              HAUTE COUTURE NAILS
            </span>
          </div>
        </Link>

        {/* Enlaces de Manicura */}
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/manicura"
            className="text-xs font-semibold tracking-wider text-stone-600 hover:text-stone-900 transition-colors"
          >
            Catálogo & Citas
          </Link>

          <Link
            href="/manicura/admin"
            className={`flex items-center gap-1.5 text-xs font-bold tracking-wider py-1.5 px-3 rounded-xl transition-all ${
              isAdmin
                ? 'text-rose-700 bg-rose-100 border border-rose-300 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-transparent'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            <span>Admin LM Nails</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
