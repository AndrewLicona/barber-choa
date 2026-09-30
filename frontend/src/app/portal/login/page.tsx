'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail, Shield, User2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    const timer = setTimeout(() => setCheckingSession(false), 1500);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const { data: access } = await supabase
            .from('user_business_access')
            .select('role')
            .eq('auth_user_id', session.user.id)
            .eq('is_active', true)
            .eq('role', 'WORKER')
            .maybeSingle();
          if (access) {
            router.replace('/portal');
            return;
          }
        } catch {
          // Continuar al formulario si no tiene permiso
        }
      }
      setCheckingSession(false);
    }).catch(() => {
      setCheckingSession(false);
    }).finally(() => {
      clearTimeout(timer);
    });

    return () => clearTimeout(timer);
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await getSupabase().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setError('Correo o contraseña incorrectos. Solicita acceso al administrador si aún no tienes una cuenta.');
      setLoading(false);
      return;
    }
    router.replace('/portal');
    router.refresh();
  }

  if (checkingSession) return <div className="min-h-screen bg-[#0a0c0f]" />;

  return (
    <main className="min-h-screen bg-[#0a0c0f] px-4 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
        <Link href="/admin" className="mb-8 inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-300 transition-colors hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a accesos
        </Link>
        <section className="rounded-3xl border border-indigo-500/25 bg-[#111318] p-6 shadow-2xl sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-950">
              <User2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">Portal de especialistas</h1>
            <p className="mt-2 text-xs leading-relaxed text-indigo-200/60">Ingresa con la cuenta asignada por administración para ver solo tu agenda y disponibilidad.</p>
          </div>
          {error && <p className="mb-5 flex gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs font-semibold text-indigo-100">Correo electrónico
              <span className="relative mt-1.5 block"><Mail className="absolute left-3 top-3 h-4 w-4 text-indigo-300/50" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-indigo-500/20 bg-black/30 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-400" placeholder="tu.correo@ejemplo.com" /></span>
            </label>
            <label className="block text-xs font-semibold text-indigo-100">Contraseña
              <span className="relative mt-1.5 block"><Lock className="absolute left-3 top-3 h-4 w-4 text-indigo-300/50" /><input required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-indigo-500/20 bg-black/30 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-indigo-400" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-indigo-300/50">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span>
            </label>
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold transition-colors hover:bg-indigo-500 disabled:opacity-50"><Shield className="h-4 w-4" />{loading ? 'Verificando...' : 'Ingresar a mi portal'}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
