// @ts-nocheck
'use client';

import { useState } from 'react';
import { useBarberiaData } from '@/hooks/useBarberiaData';
import { BarberiaNavbar } from '@/components/organisms/barberia/BarberiaNavbar';
import { MobileBottomNav } from '@/components/organisms/barberia/MobileBottomNav';
import { PortfolioGallery } from '@/components/organisms/barberia/PortfolioGallery';
import { ServiceCard } from '@/components/ServiceCard';
import { BookingModal } from '@/components/BookingModal';
import { LiveQueueWidget } from '@/components/LiveQueueWidget';
import { Service } from '@/types/database';
import { Scissors, Phone, Shield } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/whatsapp';

export default function BarberiaPage() {
  const {
    services,
    workers,
    portfolio,
    masterBarber,
    collabBarbers,
    loading,
    phone,
    business,
  } = useBarberiaData();

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Worker | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleOpenBooking = (service?: Service, barber?: Worker) => {
    setSelectedService(service || services[0] || null);
    if (barber) {
      setSelectedBarber(barber);
    }
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 pb-20 md:pb-6">
      {/* Navbar Superior (PC + Mobile) */}
      <BarberiaNavbar
        phone={phone}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* Hero Section */}
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex-1 w-full">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-xs text-zinc-500 font-mono animate-pulse tracking-widest">
              CARGANDO DATOS...
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sección Turnos en Vivo + Barberos Colaboradores */}
              <div id="turnos" className="lg:col-span-5 space-y-6 scroll-mt-24">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4af37] block font-bold">
                    Módulo en tiempo real
                  </span>
                  <h2 className="font-luxury text-xl font-bold text-white uppercase">
                    Turnos en Vivo
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Consulta la disponibilidad y tu puesto en fila antes de salir.
                  </p>
                </div>

                {workers.length > 0 && (
                  <LiveQueueWidget barbers={workers} businessType="barberia" />
                )}

                {collabBarbers.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">
                      Barberos con Cita Previa
                    </span>
                    {collabBarbers.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-xl bg-[#121216] border border-white/[0.08] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={b.avatar_url || '/logo_barberchoa.jpg'}
                            alt={b.name}
                            className="w-11 h-11 rounded-lg object-cover ring-1 ring-white/10"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-white">{b.name}</h4>
                            <p className="text-[11px] text-zinc-400 font-mono line-clamp-1">
                              {b.bio || 'Especialista en cortes & barba'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenBooking(undefined, b)}
                          className="px-3 py-1.5 rounded-lg gold-button text-[11px] font-bold uppercase tracking-wider shrink-0"
                        >
                          Agendar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sección Catálogo de Cortes & Servicios */}
              <div id="servicios" className="lg:col-span-7 space-y-6 scroll-mt-24">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4af37] block font-bold">
                    Carta oficial
                  </span>
                  <h2 className="font-luxury text-xl font-bold text-white uppercase">
                    Nuestros Cortes & Barba
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Navaja estéril por cliente, productos profesionales y acabado premium.
                  </p>
                </div>

                {services.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-white/[0.07] bg-[#121216]/50">
                    <Scissors className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400 font-medium">
                      No hay servicios disponibles en este momento.
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-1">
                      El administrador puede agregarlos desde el panel.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4">
                    {services.map((s) => (
                      <ServiceCard
                        key={s.id}
                        service={s}
                        onSelect={(srv) => handleOpenBooking(srv)}
                      />
                    ))}
                  </div>
                )}

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3 mt-6">
                  <Shield className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Compromiso de Higiene</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Navajas nuevas por cliente, desinfección UV de herramientas y toallas calientes individuales.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección Portafolio / Galería de Estilos (Organism) */}
            <PortfolioGallery
              items={portfolio}
              onSelectServiceToBook={() => handleOpenBooking()}
            />
          </>
        )}
      </main>

      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-zinc-500 font-mono">
        BARBER CHOA • {new Date().getFullYear()} • MAESTRÍA & TRADICIÓN
      </footer>

      {/* Dock Inferior de Navegación Móvil (App Feel) */}
      <MobileBottomNav onOpenBooking={() => handleOpenBooking()} />

      {/* Modal de Agendamiento */}
      <BookingModal
        service={selectedService}
        services={services}
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedBarber(null);
        }}
        defaultWorkerId={selectedBarber?.id || collabBarbers[0]?.id}
      />
    </div>
  );
}
