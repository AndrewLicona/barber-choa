// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useFetch } from '@/hooks/use-api';
import { PortfolioGallery } from '@/components/organisms/barberia/PortfolioGallery';
import { Scissors, Phone, Shield } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/whatsapp';

export default function BarberiaGalleryPage() {
  const { data: portfolio, loading, error } = useFetch('/portfolio/public/business/barberia', {
    method: 'GET',
    headers: {},
  });

  const [selectedService, setSelectedService] = useState<any>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleOpenBooking = (service?: any) => {
    setSelectedService(service || portfolio?.[0] || null);
    setIsBookingOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-24">
        <p className="text-zinc-500 font-mono animate-pulse">CARGANDO GALERÍA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-24">
        <p className="text-red-500">Error cargando la galería</p>
      </div>
    );
  }

  const phone = portfolio?.[0]?.business?.phone || '+573001234567';

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 pb-20 md:pb-6">
      <div>
        <section className="relative pt-8 pb-10 sm:pt-10 sm:pb-12 px-4 sm:px-6 border-b border-white/[0.08] bg-gradient-to-b from-[#111115] to-[#09090b]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-1 ring-[#d4af37]/40 shadow-xl bg-black flex-shrink-0">
                <img
                  src="/logo_barberchoa.jpg"
                  alt="Logo Barber Choa"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-[0.2em] text-[#d4af37] uppercase font-bold">
                  BARBER CHOA • SERVICIOS & TURNOS
                </span>
                <h1 className="font-luxury text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase mt-1">
                  Maestría & Navaja <span className="gold-gradient-text">Tradicional</span>
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-lg">
                  Atención por orden de llegada con Turnos en Vivo o citas agendadas con nuestros barberos.
                </p>
              </div>
            </div>

            {phone && (
              <a
                href={`https://wa.me/${formatPhoneNumber(phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[#d4af37]/30 text-xs font-semibold text-[#f3e5ab] transition-all flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Directo</span>
              </a>
            )}
          </div>
        </section>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex-1 w-full">
          {portfolio && portfolio.length > 0 ? (
            <PortfolioGallery
              items={portfolio}
              onSelectServiceToBook={() => handleOpenBooking()}
            />
          ) : (
            <div className="p-8 text-center rounded-xl border border-dashed border-white/[0.07] bg-[#121216]/50">
              <Scissors className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-medium">No hay obras disponibles en este momento.</p>
              <p className="text-[11px] text-zinc-600 mt-1">El administrador puede agregarlas desde el panel.</p>
            </div>
          )}
        </main>

        <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-zinc-500 font-mono">
          BARBER CHOA • {new Date().getFullYear()} • MAESTRÍA & TRADICIÓN
        </footer>
      </div>
    </div>
  );
}