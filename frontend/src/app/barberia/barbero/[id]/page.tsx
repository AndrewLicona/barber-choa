// @ts-check
'use client';

import { useEffect, useState, use } from 'react';
import { useFetch } from '@/hooks/use-api';
import { Worker, PortfolioItem, Service, Schedule, Business } from '@/types/database';
import { Calendar, Clock, MapPin, ExternalLink, Scissors, Star, Shield, Navigation2 } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/whatsapp';
import Image from 'next/image';
import BarberMap from './BarberMap';

interface Props {
  params: Promise<{ id: string }>;
}

export default function BarberProfilePage({ params }: Props) {
  const { id } = use(params);
  const { data: worker, loading, error } = useFetch(`/workers/${id}`, {
    method: 'GET',
    headers: {},
  });

  const { data: portfolio, loading: portfolioLoading } = useFetch(`/portfolio/public/worker/${id}`, {
    method: 'GET',
    headers: {},
  });

  const { data: services, loading: servicesLoading } = useFetch(`/services/worker/${id}`, {
    method: 'GET',
    headers: {},
  });

  if (loading || !worker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-24">
        <p className="text-zinc-500 font-mono animate-pulse">CARGANDO PERFIL...</p>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-24">
        <p className="text-red-500">Trabajador no encontrado</p>
        <a href="/barberia" className="mt-4 text-xs text-[#d4af37] hover:underline">Volver a Barbería</a>
      </div>
    );
  }

  const businessType = worker.business_type || 'barberia';
  const isManicura = businessType === 'manicura';
  const primaryColor = isManicura ? 'rose-500' : 'amber-500';
  const bgColor = isManicura ? '#faf7f2' : '#09090b';
  const textColor = isManicura ? 'stone-800' : 'zinc-100';
  const cardBg = isManicura ? 'white' : '#121216';
  const borderColor = isManicura ? 'rose-200' : 'white/10';

  // Obtener horarios únicos ordenados
  const uniqueSchedules = worker.schedules
    ?.filter((s: Schedule) => s.is_active)
    .sort((a: Schedule, b: Schedule) => a.day_of_week - b.day_of_week)
    .reduce((acc: Record<string, { days: number[], time: string }>, s: Schedule) => {
      const key = `${s.start_time}-${s.end_time}`;
      if (!acc[key]) acc[key] = { days: [], time: `${s.start_time} - ${s.end_time}` };
      acc[key].days.push(s.day_of_week);
      return acc;
    }, {} as Record<string, { days: number[], time: string }>) || {};

  return (
    <div className={`min-h-screen bg-${bgColor} text-${textColor}`}>
      {/* Header compacto con info del barbero */}
      <header className={`relative py-8 md:py-12 bg-gradient-to-b from-${primaryColor}/10 to-transparent`}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden ring-4 ring-white/80 shadow-2xl bg-white flex-shrink-0">
                {worker.avatar_url ? (
                  <Image
                    src={worker.avatar_url}
                    alt={worker.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-amber-500 to-rose-500">
                    <span className="text-4xl font-bold text-white">
                      {worker.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-amber-300 block mb-1">
                  {businessType === 'manicura' ? 'LM NAILS & SPA' : 'BARBER CHOA'} • ESPECIALISTA
                </span>
                <h1 className="font-luxury text-3xl md:text-4xl font-bold tracking-tight text-white">
                  {worker.name}
                </h1>
                <p className="mt-1 text-sm md:text-base text-white/80 max-w-xl">
                  {worker.bio || `Especialista en ${isManicura ? 'manicura y uñas' : 'cortes y barba'} con atención personalizada`}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>{worker.business?.address || 'Dirección no disponible'}</span>
              </div>
              {worker.phone && (
                <a
                  href={`https://wa.me/${formatPhoneNumber(worker.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center gap-2"
                >
                  <span className="text-rose-400">💬</span>
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Mapa interactivo */}
        {(worker.business?.latitude && worker.business?.longitude) && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Navigation2 className="w-5 h-5 text-amber-500" />
                Ubicación
              </h2>
              <a
                href={`https://maps.google.com/?q=${worker.business?.latitude},${worker.business?.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Navigation2 className="w-3.5 h-3.5" />
                <span>Abrir en Google Maps</span>
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#121216]">
              <BarberMap
                latitude={worker.business!.latitude!}
                longitude={worker.business!.longitude!}
                title={worker.business?.name}
                address={worker.business?.address}
              />
            </div>
          </section>
        )}

        {/* Redes Sociales + Horarios */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Redes Sociales */}
          <div className={`p-6 rounded-2xl border border-${borderColor} bg-${cardBg}`}>
            <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Redes Sociales
            </h2>
            <div className="space-y-3">
              {worker.instagram_url && (
                <a
                  href={worker.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-pink-500 to-amber-500 flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                    📷
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Instagram</p>
                    <p className="text-xs text-white/60 truncate">{worker.instagram_url}</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-white/40 group-hover:text-white/60" />
                </a>
              )}
              {worker.facebook_url && (
                <a
                  href={worker.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <span className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                    📘
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Facebook</p>
                    <p className="text-xs text-white/60 truncate">{worker.facebook_url}</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-white/40 group-hover:text-white/60" />
                </a>
              )}
              {worker.tiktok_url && (
                <a
                  href={worker.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <span className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                    🎵
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">TikTok</p>
                    <p className="text-xs text-white/60 truncate">{worker.tiktok_url}</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-white/40 group-hover:text-white/60" />
                </a>
              )}
              {(!worker.instagram_url && !worker.facebook_url && !worker.tiktok_url) && (
                <p className="text-center text-white/40 py-8 text-sm">Sin redes sociales registradas</p>
              )}
            </div>
          </div>

          {/* Horarios */}
          <div className={`p-6 rounded-2xl border border-${borderColor} bg-${cardBg}`}>
            <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
              <Clock className="w-5 h-5 text-amber-500" />
              Horarios de Atención
            </h2>
            <div className="space-y-3">
              {Object.entries(uniqueSchedules).length > 0 ? (
                Object.entries(uniqueSchedules as Record<string, { days: number[], time: string }>).map(([key, { days, time }]) => (
                  <div key={key} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{time}</p>
                      <p className="text-xs text-white/60">
                        {days
                          .sort((a: number, b: number) => a - b)
                          .map((d: number) => DAY_SHORT[d])
                          .join(' · ')}
                      </p>
                    </div>
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                ))
              ) : (
                <p className="text-center text-white/40 py-8 text-sm">Horarios no configurados</p>
              )}
            </div>
          </div>
        </section>

        {/* Servicios */}
        {services && services.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Scissors className="w-6 h-6 text-amber-500" />
              Servicios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service: Service) => (
                <article
                  key={service.id}
                  className={`p-5 rounded-2xl border border-${borderColor} bg-${cardBg} hover:border-amber-500/50 transition-colors`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{service.title}</h3>
                      {service.category && (
                        <p className="text-xs text-white/50 mt-0.5">{service.category}</p>
                      )}
                    </div>
                    <span className="text-lg font-bold text-amber-500 shrink-0">
                      ${service.price.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mb-3 line-clamp-2">
                    {service.description || 'Sin descripción'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>⏱ {service.duration_minutes} min</span>
                    {service.buffer_minutes && (
                      <span>+ {service.buffer_minutes} min prep</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Portafolio */}
        {portfolio && portfolio.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500" />
              Portafolio
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {portfolio.map((item: PortfolioItem) => (
                <article
                  key={item.id}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-black/60 border border-white/10 hover:border-amber-500/50 transition-all"
                >
                  <Image
                    src={item.image_url}
                    alt={item.title || 'Trabajo de portafolio'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-sm font-bold text-white leading-tight truncate drop-shadow-md">
                      {item.title || 'Trabajo de portafolio'}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.tags.slice(0, 2).map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-black/60 text-amber-300 border border-amber-500/30 backdrop-blur-sm"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {!portfolio || portfolio.length === 0 && (
          <section className="mb-12">
            <div className={`p-8 text-center rounded-2xl border border-dashed border-${borderColor} bg-${cardBg}`}>
              <Scissors className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white/60">Portafolio en actualización</p>
              <p className="text-xs text-white/40 mt-1 max-w-md mx-auto">
                Muy pronto compartiremos las fotos de los últimos trabajos.
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className={`border-t border-${borderColor} py-8 px-6 text-center text-xs text-white/30 font-mono`}>
        <p>{businessType === 'manicura' ? 'LM NAILS & SPA STUDIO' : 'BARBER CHOA'} • {new Date().getFullYear()} • ESPECIALISTA</p>
      </footer>
    </div>
  );
}

// Helper: DAY_SHORT ya existe en types/database.ts, lo redeclaramos aquí para evitar import circular
const DAY_SHORT: Record<number, string> = {
  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié',
  4: 'Jue', 5: 'Vie', 6: 'Sáb',
};

function renderAvatar(worker: Worker) {
  if (worker.avatar_url) {
    return (
      <Image
        src={worker.avatar_url}
        alt={worker.name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    );
  }
  
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-rose-500 to-amber-500 flex items-center justify-center">
      <span className="text-6xl font-bold text-white/90">
        {worker.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}