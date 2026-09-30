// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import { canManageBusiness } from '@/lib/access-control';
import { Scissors, Sparkles, User2, Shield, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, LogOut, ArrowRight } from 'lucide-react';

export default function AdminSelectorPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setCheckingSession(false);
      return;
    }

    const timer = setTimeout(() => setCheckingSession(false), 1500);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentSession(session);
      setCheckingSession(false);
    }).catch(() => {
      setCheckingSession(false);
    }).finally(() => {
      clearTimeout(timer);
    });

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Error de conexión con el servicio de autenticación.');
      setLoading(false);
      return;
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials') || error.message.toLowerCase().includes('invalid credentials')) {
          setErrorMsg('Correo o contraseña incorrectos. Verifica tus credenciales.');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.session?.user) {
        setCurrentSession(data.session);

        // Consultar rol en user_business_access
        const { data: accessList } = await supabase
          .from('user_business_access')
          .select('role, is_active, business:businesses(slug)')
          .eq('auth_user_id', data.session.user.id)
          .eq('is_active', true);

        if (accessList && accessList.length > 0) {
          const isSuper = accessList.some((a: any) => a.role === 'SUPERADMIN');
          const hasBarberia = accessList.some((a: any) => {
            const b = Array.isArray(a.business) ? a.business[0] : a.business;
            return a.role === 'ADMIN' && b?.slug === 'barberia';
          });
          const hasManicura = accessList.some((a: any) => {
            const b = Array.isArray(a.business) ? a.business[0] : a.business;
            return a.role === 'ADMIN' && b?.slug === 'manicura';
          });
          const isWorker = accessList.some((a: any) => a.role === 'WORKER');

          if (isSuper || hasBarberia) {
            router.push('/barberia/admin');
            return;
          }
          if (hasManicura) {
            router.push('/manicura/admin');
            return;
          }
          if (isWorker) {
            router.push('/portal');
            return;
          }
        }

        // Si no tiene registro en user_business_access pero se logueó
        router.push('/barberia/admin');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al intentar iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
      setCurrentSession(null);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center mb-8 max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shield className="w-8 h-8 text-[#d4af37]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          Acceso Administrativo
        </h1>
        <p className="text-sm text-white/60">
          Inicia sesión para ingresar al panel de gestión de tu negocio.
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md mb-12">
        {/* Formulario de Login Unificado */}
        {currentSession ? (
          <div className="bg-[#121216] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sesión activa como: <strong className="font-mono">{currentSession.user?.email}</strong></span>
            </div>
            <p className="text-xs text-white/60">
              Selecciona el panel al que deseas ingresar o cierra sesión para cambiar de cuenta:
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/barberia/admin"
                className="py-2.5 px-4 rounded-xl gold-button text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>Barber Choa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/manicura/admin"
                className="py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <span>LM Nails</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors pt-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <div className="bg-[#121216] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@barberchoa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-[#d4af37] transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl gold-button text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                <span>{loading ? 'Verificando credenciales...' : 'Iniciar Sesión'}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Accesos directos por negocio */}
      <div className="relative z-10 w-full max-w-4xl">
        <p className="text-center text-xs uppercase tracking-widest text-zinc-500 mb-6 font-semibold">
          O ingresa directamente al portal específico
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Barber Choa */}
          <Link
            href="/barberia/login"
            className="group p-6 rounded-2xl bg-[#110e06]/80 border border-amber-500/20 hover:border-amber-500/50 transition-all hover:shadow-xl hover:shadow-amber-900/20 text-center backdrop-blur-sm"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600/30 to-yellow-600/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Scissors className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-base font-bold text-white mb-1 font-serif">Barber Choa Studio</h2>
            <p className="text-[11px] text-amber-300/60 mb-3">
              Panel exclusivo Barbería
            </p>
            <div className="px-3 py-1.5 rounded-lg bg-amber-900/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider border border-amber-500/20 inline-block">
              Login Barbería
            </div>
          </Link>

          {/* LM Nails */}
          <Link
            href="/manicura/login"
            className="group p-6 rounded-2xl bg-[#0d090d]/80 border border-pink-500/20 hover:border-pink-500/50 transition-all hover:shadow-xl hover:shadow-pink-900/20 text-center backdrop-blur-sm"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-600/30 to-rose-600/20 border border-pink-500/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-7 h-7 text-pink-400" />
            </div>
            <h2 className="text-base font-bold text-white mb-1 font-serif">LM Nails & Spa</h2>
            <p className="text-[11px] text-pink-300/60 mb-3">
              Panel exclusivo Spa de Uñas
            </p>
            <div className="px-3 py-1.5 rounded-lg bg-pink-900/30 text-pink-300 text-[11px] font-bold uppercase tracking-wider border border-pink-500/20 inline-block">
              Login Manicura
            </div>
          </Link>

          {/* Portal Trabajadores */}
          <Link
            href="/portal/login"
            className="group p-6 rounded-2xl bg-[#0a0c0f]/80 border border-indigo-500/20 hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-900/20 text-center backdrop-blur-sm"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600/30 to-cyan-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <User2 className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-base font-bold text-white mb-1">Portal Especialistas</h2>
            <p className="text-[11px] text-indigo-300/60 mb-3">
              Agenda personal de barberos y manicuristas
            </p>
            <div className="px-3 py-1.5 rounded-lg bg-indigo-900/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider border border-indigo-500/20 inline-block">
              Login Especialista
            </div>
          </Link>
        </div>
      </div>

      <p className="relative z-10 mt-10 text-[10px] text-white/30 text-center">
        Los permisos se asignan por negocio; una cuenta de dueño puede administrar ambas marcas.
      </p>
    </div>
  );
}
