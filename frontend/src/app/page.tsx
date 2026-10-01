import Link from 'next/link';
import { ArrowRight, CalendarDays, MapPin, Scissors, Sparkles, Shield, Clock, Award, Star } from 'lucide-react';

const experiences = [
  {
    href: '/barberia',
    label: 'Barber Choa',
    eyebrow: 'Maestría & Navaja Tradicional',
    tagline: 'Fila en Vivo & Turnos al Instante',
    description:
      'Cortes de autor, degradados a navaja, perfilado de barba y toalla caliente. Llega sin cita y consulta tu turno en tiempo real o agenda con tu barbero favorito.',
    logo: '/logo_barberchoa.jpg',
    logoAlt: 'Logo Barber Choa',
    icon: Scissors,
    action: 'Ingresar a Barber Choa',
    directQueueAction: 'Ver Fila en Vivo',
    cardClass:
      'border-[#d4af37]/30 bg-gradient-to-b from-[#141419] to-[#0e0e12] hover:border-[#d4af37]/70 hover:shadow-2xl hover:shadow-[#d4af37]/10',
    iconClass: 'bg-[#d4af37]/15 text-[#f3e5ab] ring-[#d4af37]/35',
    actionClass: 'gold-button text-black font-bold shadow-lg',
    accentClass: 'text-[#d4af37]',
    badge: 'Turnos en Vivo',
  },
  {
    href: '/manicura',
    label: 'LM Nails & Spa',
    eyebrow: 'Nail Art & Cuidado Integral',
    tagline: 'Diseños Exclusivos con Cita Previa',
    description:
      'Manicura rusa, acrílicas, spa de manos y pies con los mejores acabados y productos de alta gama. Explora el portafolio y reserva tu espacio con anticipación.',
    logo: '/logo_lmnail.jpg',
    logoAlt: 'Logo LM Nails & Spa',
    icon: Sparkles,
    action: 'Ingresar a LM Nails',
    directQueueAction: 'Agendar Cita',
    cardClass:
      'border-rose-300/30 bg-gradient-to-b from-[#181116] to-[#0e0e12] hover:border-rose-400/60 hover:shadow-2xl hover:shadow-rose-500/10',
    iconClass: 'bg-rose-500/15 text-rose-300 ring-rose-400/30',
    actionClass: 'bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-lg shadow-rose-500/20',
    accentClass: 'text-rose-400',
    badge: 'Citas Programadas',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090c] text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Luces de fondo ambientales */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Contenedor central */}
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 py-4 sm:py-8 w-full relative z-10">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-[#d4af37]/50 bg-black flex-shrink-0">
              <img
                src="/logo_barberchoa.jpg"
                alt="Choa Studio"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-xs font-mono font-bold tracking-[0.2em] text-white uppercase block leading-none">
                Choa Studio
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Barbería & Spa</span>
            </div>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all"
          >
            <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Panel Admin</span>
          </Link>
        </header>

        {/* Hero Section */}
        <section className="flex flex-1 flex-col justify-center py-8 sm:py-14 text-center">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-mono text-zinc-300">
              <Star className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
              <span>Experiencia Premium en Cuidado Personal</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase font-luxury">
              Elige Tu <span className="gold-gradient-text">Experiencia</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base leading-relaxed text-zinc-400 max-w-xl mx-auto px-2">
              Dos marcas exclusivas en un mismo local. Selecciona el servicio que buscas para ver turnos en vivo, catálogo y reservas.
            </p>
          </div>

          {/* Cards de Experiencias */}
          <div className="mt-8 sm:mt-12 grid w-full max-w-5xl mx-auto grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 text-left">
            {experiences.map((experience) => {
              const Icon = experience.icon;
              return (
                <article
                  key={experience.href}
                  className={`group relative flex flex-col justify-between rounded-3xl border p-5 sm:p-7 transition-all duration-300 hover:-translate-y-1 ${experience.cardClass}`}
                >
                  <div>
                    {/* Header de la tarjeta */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={experience.logo}
                          alt={experience.logoAlt}
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover shadow-md ring-1 ring-white/10"
                        />
                        <div>
                          <span className={`text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider block ${experience.accentClass}`}>
                            {experience.eyebrow}
                          </span>
                          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                            {experience.label}
                          </h2>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-zinc-300 shrink-0">
                        {experience.badge}
                      </span>
                    </div>

                    {/* Tagline & Descripción */}
                    <p className="mt-4 text-xs font-semibold text-zinc-200">
                      {experience.tagline}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                      {experience.description}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row gap-2.5">
                    <Link
                      href={experience.href}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs uppercase tracking-wider transition-transform active:scale-95 ${experience.actionClass}`}
                    >
                      <span>{experience.action}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Quick Info Bar */}
          <div className="mt-8 sm:mt-12 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center gap-2.5 text-xs text-zinc-400">
              <MapPin className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span>Atención en un mismo local</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center gap-2.5 text-xs text-zinc-400">
              <Clock className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span>Turnos en vivo sin esperas</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center gap-2.5 text-xs text-zinc-400">
              <Award className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span>Especialistas certificados</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.06] pt-4 pb-2 text-center sm:text-left text-xs text-zinc-500 font-mono">
          <span>© {new Date().getFullYear()} Choa Studio. Todos los derechos reservados.</span>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/barberia" className="hover:text-zinc-300 transition-colors">Barbería</Link>
            <Link href="/manicura" className="hover:text-zinc-300 transition-colors">Manicura</Link>
            <Link href="/admin" className="text-[#d4af37] hover:underline">Acceso Administrativo</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
