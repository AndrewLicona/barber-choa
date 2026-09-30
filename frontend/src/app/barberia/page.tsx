// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { BarberiaNav } from '@/components/BarberiaNav';
import { ServiceCard } from '@/components/ServiceCard';
import { BookingModal } from '@/components/BookingModal';
import { LiveQueueWidget } from '@/components/LiveQueueWidget';
import { Service, Worker } from '@/types/database';
import { Scissors, Phone, Shield } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/whatsapp';

export default function BarberiaPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [masterBarber, setMasterBarber] = useState<Worker | null>(null);
  const [collabBarbers, setCollabBarbers] = useState<Worker[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;

    try {
      const [workersRes, servicesRes] = await Promise.all([
        sb.from('workers').select('*').eq('business_type', 'barberia').eq('is_active', true).order('created_at'),
        sb.from('services').select('*').eq('business_type', 'barberia').eq('is_active', true).order('created_at'),
      ]);

      if (workersRes.data) {
        const workers = workersRes.data as Worker[];
        setWorkers(workers);
        setMasterBarber(workers.find(w => !w.accepts_appointments) || workers[0] || null);
        setCollabBarbers(workers.filter(w => w.accepts_appointments));
      }
      if (servicesRes.data) {
        setServices(servicesRes.data as Service[]);
      }
    } catch (err) {
      console.error('Error cargando datos de barbería:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const sb = getSupabase();
    if (!sb) return;

    // Escuchar cambios en tiempo real en servicios y barberos
    const channel = sb
      .channel('barberia-realtime')
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

  const phone = masterBarber?.phone || '';

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      <BarberiaNav />

      {/* Hero */}
      <section className="relative pt-10 pb-12 px-4 sm:px-6 border-b border-white/[0.08] bg-gradient-to-b from-[#111115] to-[#09090b]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-1 ring-[#d4af37]/40 shadow-xl bg-black flex-shrink-0">
              <img src="/logo_barberchoa.jpg" alt="Logo Barber Choa" className="w-full h-full object-cover" />
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
              target="_blank" rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[#d4af37]/30 text-xs font-semibold text-[#f3e5ab] transition-all flex items-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Directo</span>
            </a>
          )}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-xs text-zinc-500 font-mono animate-pulse tracking-widest">CARGANDO DATOS...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Widget Turnos + Barbero Colaborador */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4af37] block font-bold">Módulo en tiempo real</span>
                <h2 className="font-luxury text-xl font-bold text-white uppercase">Turnos en Vivo</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Consulta la disponibilidad antes de salir.</p>
              </div>

              {workers.length > 0 && <LiveQueueWidget barbers={workers} businessType="barberia" />}

              {collabBarbers.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">
                    Barberos con Cita Previa
                  </span>
                  {collabBarbers.map(b => (
                    <div key={b.id} className="p-4 rounded-xl bg-[#121216] border border-white/[0.08] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.avatar_url || '/logo_barberchoa.jpg'}
                          alt={b.name}
                          className="w-11 h-11 rounded-lg object-cover ring-1 ring-white/10"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white">{b.name}</h4>
                          <p className="text-[11px] text-zinc-400 font-mono">{b.phone || 'Sin teléfono'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedService(services[0] || null); setIsBookingOpen(true); }}
                        className="px-3 py-1.5 rounded-lg gold-button text-[11px] font-bold uppercase tracking-wider"
                      >
                        Agendar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Catálogo de Servicios */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4af37] block font-bold">Carta oficial</span>
                <h2 className="font-luxury text-xl font-bold text-white uppercase">Nuestros Cortes & Barba</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Navaja estéril por cliente, productos profesionales.</p>
              </div>

              {services.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-white/[0.07] bg-[#121216]/50">
                  <Scissors className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">No hay servicios disponibles en este momento.</p>
                  <p className="text-[11px] text-zinc-600 mt-1">El administrador puede agregarlos desde el panel.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map(s => (
                    <ServiceCard key={s.id} service={s} onSelect={srv => { setSelectedService(srv); setIsBookingOpen(true); }} />
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
        )}
      </main>

      <footer className="border-t border-white/[0.06] py-4 text-center text-xs text-zinc-500 font-mono">
        BARBER CHOA • {new Date().getFullYear()}
      </footer>

      <BookingModal
        service={selectedService}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        defaultWorkerId={collabBarbers[0]?.id}
      />
    </div>
  );
}
