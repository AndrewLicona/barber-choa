// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useFetch } from '@/hooks/use-api';
import { GalleryGrid } from '@/components/GalleryGrid';
import { Sparkles, Calendar, Heart, ShieldCheck, Phone, CheckCircle2, Star, Award, Clock } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/whatsapp';

export default function ManicuraGalleryPage() {
  const { data: portfolio, loading, error } = useFetch('/portfolio/public/business/manicura', {
    method: 'GET',
    headers: {},
  });

  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleOpenBooking = (service?: any) => {
    setSelectedService(service || (portfolio?.[0]?.service || null));
    setIsBookingOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-24">
        <p className="text-stone-400 font-mono animate-pulse">CARGANDO GALERÍA...</p>
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

  const businessPhone = '+573009876543';

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2] text-stone-800 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-rose-100 bg-gradient-to-b from-[#fdfbf9] to-[#faf7f2]">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-200/30 blur-[130px] rounded-full pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-3xl overflow-hidden ring-4 ring-rose-200 shadow-2xl shadow-rose-200/80 bg-white flex-shrink-0">
                <img
                  src="/logo_lmnail.jpg"
                  alt="LM Nails & Spa"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>LM NAILS & SPA STUDIO • ALTA COSTURA</span>
                </div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-stone-900 leading-tight font-serif">
                  Manicura Rusa, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-amber-600 font-sans">
                    Soft Gel & Nail Art
                  </span>
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-stone-600">
                  Uñas limpias, resistentes y con acabados de alta costura. Descubre nuestro catálogo visual y reserva tu cita con nuestras especialistas certificadas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenBooking()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Reservar Cita Online</span>
              </button>

              <a
                href={`https://wa.me/${formatPhoneNumber(businessPhone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        <section id="catalogo" className="scroll-mt-20 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 sm:mb-6">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-rose-600 block mb-1">
                Catálogo de Tendencias
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-stone-900 tracking-tight font-serif">
                Inspiración & Trabajos Recientes
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Haz click en cualquier diseño para ampliarlo o seleccionar el servicio correspondiente.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
              <span className="text-[11px] sm:text-xs">100% fotos reales de nuestras clientas</span>
            </div>
          </div>

          <GalleryGrid items={portfolio || []} />
        </section>
      </div>
    </div>
  );
}