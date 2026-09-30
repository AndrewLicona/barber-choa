import Link from 'next/link';
import { ArrowRight, CalendarDays, MapPin, Scissors, Sparkles } from 'lucide-react';

const experiences = [
  { href: '/barberia', label: 'Barber Choa', eyebrow: 'Barbería & turnos en vivo', description: 'Cortes, barba y una atención precisa para quienes prefieren llegar, consultar su turno o agendar con un barbero.', logo: '/logo_barberchoa.jpg', logoAlt: 'Logo Barber Choa', icon: Scissors, action: 'Entrar a Barber Choa', cardClass: 'border-[#d4af37]/30 bg-[#121216] hover:border-[#d4af37]/70', iconClass: 'bg-[#d4af37]/15 text-[#f3e5ab] ring-[#d4af37]/35', actionClass: 'bg-[#d4af37] text-black hover:bg-[#e6c764]', accentClass: 'text-[#d4af37]' },
  { href: '/manicura', label: 'LM Nails & Spa', eyebrow: 'Nail art & citas', description: 'Manicura, spa y diseños personalizados. Explora el portafolio y reserva tu espacio con anticipación.', logo: '/logo_lmnail.jpg', logoAlt: 'Logo LM Nails & Spa', icon: Sparkles, action: 'Entrar a LM Nails', cardClass: 'border-rose-200 bg-[#fffdfb] hover:border-rose-400', iconClass: 'bg-rose-100 text-rose-600 ring-rose-200', actionClass: 'bg-rose-500 text-white hover:bg-rose-600', accentClass: 'text-rose-500' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0d0d10] px-4 py-6 text-zinc-100 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4 py-3">
          <span className="text-xs font-mono uppercase tracking-[0.24em] text-zinc-400">Choa Studio</span>
          <Link href="/admin" className="text-xs font-semibold text-zinc-400 transition-colors hover:text-white">Acceso privado</Link>
        </header>

        <section className="flex flex-1 flex-col justify-center py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Un mismo lugar, dos experiencias</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">Elige cómo quieres consentirte.</h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">Selecciona la marca que buscas para ver únicamente sus servicios, profesionales, agenda y trabajos.</p>
          </div>

          <div className="mx-auto mt-10 grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
            {experiences.map((experience) => {
              const Icon = experience.icon;
              return (
                <article key={experience.href} className={`group rounded-3xl border p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 sm:p-8 ${experience.cardClass}`}>
                  <div className="flex items-start justify-between gap-4">
                    <img src={experience.logo} alt={experience.logoAlt} className="h-16 w-16 rounded-2xl object-cover shadow-md" />
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${experience.iconClass}`}><Icon className="h-5 w-5" /></div>
                  </div>
                  <p className={`mt-8 text-[11px] font-bold uppercase tracking-[0.18em] ${experience.accentClass}`}>{experience.eyebrow}</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-current">{experience.label}</h2>
                  <p className="mt-3 min-h-12 text-sm leading-relaxed text-zinc-400">{experience.description}</p>
                  <Link href={experience.href} className={`mt-7 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold uppercase tracking-wide transition-colors ${experience.actionClass}`}>
                    {experience.action}<ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-5 text-center text-xs text-zinc-500 sm:flex-row sm:text-left">
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Atención en un mismo local</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Reserva o consulta tu turno desde aquí</span>
        </footer>
      </div>
    </main>
  );
}
