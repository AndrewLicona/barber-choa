// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { ManicuraNav } from '@/components/ManicuraNav';
import { ServiceCard } from '@/components/ServiceCard';
import { BookingModal } from '@/components/BookingModal';
import { GalleryGrid } from '@/components/GalleryGrid';
import { INITIAL_GALLERY } from '@/data/initialData';
import { Service, Worker } from '@/types/database';
import { Sparkles, Calendar, Heart, ShieldCheck, Phone } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/whatsapp';

export default function ManicuraPage() {
  const [nailServices, setNailServices] = useState<Service[]>([]);
  const [nailArtist, setNailArtist] = useState<Worker | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const nailGallery = INITIAL_GALLERY.filter((g) => g.business_type === 'manicura');

  const loadData = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;

    try {
      const [workersRes, servicesRes] = await Promise.all([
        sb.from('workers').select('*').eq('business_type', 'manicura').eq('is_active', true).order('created_at'),
        sb.from('services').select('*').eq('business_type', 'manicura').eq('is_active', true).order('created_at'),
      ]);

      if (workersRes.data && workersRes.data.length > 0) {
        setNailArtist(workersRes.data[0] as Worker);
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

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  const phone = nailArtist?.phone || '+573009876543';

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2] text-stone-800">
      <ManicuraNav />

      {/* Hero Header Aesthetic */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-rose-100 bg-gradient-to-b from-[#fdfbf9] to-[#faf7f2]">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-200/30 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Logo Oficial LM Nails */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden ring-2 ring-rose-300 shadow-xl bg-white flex-shrink-0">
                <img
                  src="/logo_lmnail.jpg"
                  alt="LM Nails & Spa"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>LM Nails & Spa Studio</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900">
                  Manicura Rusa, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-amber-600">
                    Soft Gel & Nail Art
                  </span>
                </h1>
                <p className="mt-3 text-xs sm:text-sm text-stone-600 max-w-xl leading-relaxed">
                  Uñas limpias, resistentes y con acabados de alta costura. Descubre nuestro catálogo visual y reserva tu cita con confirmación directa a WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-3">
              <a
                href={`https://wa.me/${formatPhoneNumber(phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Consultar por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Catálogo Visual & Servicios */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-16">
        {/* Sección: Galería Visual Estilo Instagram */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-rose-600 block mb-1">
                Catálogo de Tendencias
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Inspiración & Trabajos Recientes
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Haz click en cualquier diseño para ampliarlo o seleccionar el servicio correspondiente.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>100% fotos reales de nuestras clientas</span>
            </div>
          </div>

          <GalleryGrid items={nailGallery} />
        </section>

        {/* Sección: Lista de Servicios & Precios */}
        <section>
          <div className="mb-8">
            <span className="text-xs font-bold tracking-wider uppercase text-rose-600 block mb-1">
              Servicios Exclusivos
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Elige tu Próximo Tratamiento
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {nailServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onSelect={handleSelectService}
                />
              ))}
            </div>
          )}
        </section>

        {/* Perfil de la Nail Artist & Higiene */}
        {nailArtist && (
          <section className="bg-white rounded-3xl p-8 sm:p-10 border border-rose-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <img
              src={nailArtist.avatar_url || '/logo_lmnail.jpg'}
              alt={nailArtist.name}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-rose-100 shadow-md"
            />
            <div className="flex-1 text-center md:text-left">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                Conoce a tu Especialista
              </span>
              <h3 className="text-2xl font-extrabold text-stone-900 mt-1">
                {nailArtist.name}
              </h3>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                {nailArtist.bio}
              </p>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  ✨ Esterilización autoclave médica
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  🌸 Limas y buffers desechables
                </span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer Nails */}
      <footer className="border-t border-rose-100 bg-white py-8 px-4 text-center text-xs text-stone-500">
        <p>© {new Date().getFullYear()} LM Nails & Spa Studio. Citas directas por WhatsApp.</p>
      </footer>

      {/* Modal de Reserva de Cita */}
      <BookingModal
        service={selectedService}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        defaultWorkerId={nailArtist?.id}
      />
    </div>
  );
}
