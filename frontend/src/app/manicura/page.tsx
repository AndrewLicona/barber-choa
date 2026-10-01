// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { ManicuraNav } from '@/components/ManicuraNav';
import { ManicuraMobileBottomNav } from '@/components/ManicuraMobileBottomNav';
import { ServiceCard } from '@/components/ServiceCard';
import { BookingModal } from '@/components/BookingModal';
import { GalleryGrid } from '@/components/GalleryGrid';
import { INITIAL_GALLERY } from '@/data/initialData';
import { Service, Worker } from '@/types/database';
import { Sparkles, Calendar, Heart, ShieldCheck, Phone, CheckCircle2, Star, Award, Clock } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/whatsapp';

export default function ManicuraPage() {
  const [nailServices, setNailServices] = useState<Service[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const nailGallery = INITIAL_GALLERY.filter((g) => g.business_type === 'manicura');

  const loadData = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;

    try {
      const [workersRes, servicesRes] = await Promise.all([
        sb.from('workers').select('*').eq('business_type', 'manicura').eq('is_active', true).order('display_order'),
        sb.from('services').select('*').eq('business_type', 'manicura').eq('is_active', true).order('display_order'),
      ]);

      if (workersRes.data && workersRes.data.length > 0) {
        setWorkers(workersRes.data as Worker[]);
      }
      if (servicesRes.data) {
        setNailServices(servicesRes.data as Service[]);
      }
    } catch (err) {
      console.error('Error cargando datos de manicura:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const sb = getSupabase();
    if (!sb) return;

    const channel = sb
      .channel('manicura-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [loadData]);

  const handleOpenBooking = (service?: Service, worker?: Worker) => {
    setSelectedService(service || nailServices[0] || null);
    if (worker) {
      setSelectedWorker(worker);
    }
    setIsBookingOpen(true);
  };

  const businessPhone = '+573009876543';

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2] text-stone-800 pb-20 md:pb-6">
      <ManicuraNav
        onOpenBooking={() => handleOpenBooking()}
        phone={businessPhone}
      />

      {/* Hero Header Aesthetic */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-rose-100 bg-gradient-to-b from-[#fdfbf9] to-[#faf7f2]">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-200/30 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              {/* Logo Oficial LM Nails */}
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
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-stone-600 max-w-xl leading-relaxed">
                  Uñas limpias, resistentes y con acabados de alta costura. Descubre nuestro catálogo visual y reserva tu cita con nuestras especialistas certificadas.
                </p>

                {/* Badges de calidad */}
                <div className="mt-3.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[10px] sm:text-xs font-semibold text-stone-600">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-rose-200 text-rose-700 shadow-sm">
                    <ShieldCheck className="w-3 h-3 text-rose-500" />
                    Autoclave Grado Médico
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-rose-200 text-rose-700 shadow-sm">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    3 Especialistas VIP
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-rose-200 text-rose-700 shadow-sm">
                    <Heart className="w-3 h-3 text-pink-500" />
                    Durabilidad 21+ días
                  </span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-end gap-2.5 sm:gap-3 shrink-0">
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
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-12 sm:space-y-16">
        {/* Sección: Equipo de Especialistas */}
        <section id="especialistas" className="scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-rose-600 block mb-1">
                Equipo Profesional
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-stone-900 tracking-tight font-serif">
                Nuestras Especialistas en Uñas
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Elige con quién deseas atenderte y reserva tu horario exclusivo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {workers.map((w) => (
              <div
                key={w.id}
                className="group relative bg-white rounded-3xl p-5 border border-rose-100 hover:border-rose-300 shadow-sm hover:shadow-xl hover:shadow-rose-500/5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-3.5">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-rose-200 shadow-md shrink-0">
                      <img
                        src={w.avatar_url || '/logo_lmnail.jpg'}
                        alt={w.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-stone-900 truncate font-serif">
                          {w.name}
                        </h3>
                      </div>
                      <span className="inline-block text-[10px] font-semibold text-rose-600 uppercase tracking-wider font-mono">
                        Nail Artist Especialista
                      </span>
                      <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Disponible para Citas</span>
                      </p>
                    </div>
                  </div>

                  {w.bio && (
                    <p className="text-xs text-stone-600 leading-relaxed mb-4 line-clamp-2">
                      {w.bio}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-rose-50 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-stone-400 font-mono">
                    Lun - Sáb • 9:00 - 18:00
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(undefined, w)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs tracking-wider transition-colors border border-rose-200/80 active:scale-95 cursor-pointer"
                  >
                    Agendar con ella
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sección: Lista de Servicios & Precios */}
        <section id="servicios" className="scroll-mt-20">
          <div className="mb-6 sm:mb-8">
            <span className="text-xs font-bold tracking-wider uppercase text-rose-600 block mb-1">
              Carta de Tratamientos
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-stone-900 tracking-tight font-serif">
              Nuestros Servicios Exclusivos
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Todos nuestros servicios incluyen limpieza clínica con torno y productos hipoalergénicos certificados.
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400 font-mono animate-pulse">
              CARGANDO SERVICIOS...
            </div>
          ) : nailServices.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-stone-200 bg-white">
              <p className="text-sm text-stone-500">No hay servicios disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2.5 sm:gap-5">
              {nailServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onSelect={(s) => handleOpenBooking(s)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Sección: Galería Visual Estilo Instagram */}
        <section id="catalogo" className="scroll-mt-20">
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

          <GalleryGrid items={nailGallery} />
        </section>

        {/* Compromiso de Bioseguridad */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 font-serif">Protocolo de Bioseguridad y Esterilización</h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Instrumentos esterilizados en autoclave médica grado quirúrgico. Limas y buffers 100% desechables por cliente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenBooking()}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold tracking-wider uppercase transition-all shrink-0 cursor-pointer"
          >
            Reservar Ahora
          </button>
        </section>
      </div>

      {/* Footer Nails */}
      <footer className="border-t border-rose-100 bg-white py-8 px-4 text-center text-xs text-stone-500 font-mono">
        <p>LM NAILS & SPA STUDIO • {new Date().getFullYear()} • MAESTRÍA & ALTA COSTURA</p>
      </footer>

      {/* Dock Inferior de Navegación Móvil (App Feel para Manicura) */}
      <ManicuraMobileBottomNav onOpenBooking={() => handleOpenBooking()} />

      {/* Modal de Reserva de Cita */}
      <BookingModal
        service={selectedService}
        services={nailServices}
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedWorker(null);
        }}
        defaultWorkerId={selectedWorker?.id || workers[0]?.id}
      />
    </div>
  );
}
