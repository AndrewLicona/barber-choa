// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import { nestJSLogin, nestJSLogout, getNestJSToken, getNestJSUser } from '@/lib/auth-context';
import {
  Scissors,
  Sparkles,
  User2,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  LogOut,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

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
    const token = getNestJSToken();
    const nestUser = getNestJSUser();

    if (!supabase) {
      if (token && nestUser) {
        setCurrentSession({ user: nestUser });
      }
      setCheckingSession(false);
      return;
    }

    const timer = setTimeout(() => setCheckingSession(false), 1500);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          setCurrentSession(session);
        } else if (token && nestUser) {
          setCurrentSession({ user: nestUser });
        }
        setCheckingSession(false);
      })
      .catch(() => {
        if (token && nestUser) {
          setCurrentSession({ user: nestUser });
        }
        setCheckingSession(false);
      })
      .finally(() => {
        clearTimeout(timer);
      });

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const supabase = getSupabase();
    const cleanEmail = email.trim().toLowerCase();

    let authenticated = false;
    let targetRoute = '/barberia/admin';

    // 1. Try NestJS login
    try {
      const nestUser = await nestJSLogin(cleanEmail, password);
      if (nestUser) {
        authenticated = true;
        setCurrentSession({ user: nestUser });
        if (nestUser.role?.includes('WORKER')) {
          targetRoute = '/barberia/admin'; // workers can manage their queue
        }
      }
    } catch (nestErr: any) {
      console.warn('NestJS auth note:', nestErr?.message);
    }

    // 2. Try Supabase login
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data?.session?.user) {
          authenticated = true;
          setCurrentSession(data.session);

          // Check user_business_access
          const { data: accessList } = await supabase
            .from('user_business_access')
            .select('role, is_active, business:businesses(slug)')
            .eq('auth_user_id', data.session.user.id)
            .eq('is_active', true);

          if (accessList && accessList.length > 0) {
            const hasManicuraOnly =
              accessList.some((a: any) => {
                const b = Array.isArray(a.business) ? a.business[0] : a.business;
                return b?.slug === 'manicura';
              }) &&
              !accessList.some((a: any) => {
                const b = Array.isArray(a.business) ? a.business[0] : a.business;
                return b?.slug === 'barberia' || a.role === 'SUPERADMIN';
              });

            if (hasManicuraOnly) {
              targetRoute = '/manicura/admin';
            }
          }
        }
      } catch (sbErr: any) {
        console.warn('Supabase auth note:', sbErr?.message);
      }
    }

    setLoading(false);

    if (authenticated) {
      router.push(targetRoute);
    } else {
      setErrorMsg('Correo o contraseña incorrectos. Verifica tus credenciales de acceso.');
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
      nestJSLogout();
      setCurrentSession(null);
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090c] text-white flex flex-col items-center justify-center py-10 px-4 sm:px-6 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-[#d4af37]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Volver a Inicio */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors z-20"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Volver a Inicio</span>
      </Link>

      <div className="relative z-10 text-center mb-6 max-w-lg">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-7 h-7 text-[#d4af37]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1.5 font-luxury">
          Panel de Administración
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Inicia sesión para gestionar turnos, barberos, servicios y configuración.
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md mb-8">
        {/* Formulario de Login Unificado */}
        {currentSession ? (
          <div className="bg-[#121216] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-center">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">
                Sesión activa: <strong className="font-mono">{currentSession.user?.email}</strong>
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Selecciona el panel al que deseas ingresar:
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                href="/barberia/admin"
                className="py-2.5 px-3 rounded-xl gold-button text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>Barber Choa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/manicura/admin"
                className="py-2.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-colors"
              >
                <span>LM Nails</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors pt-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <div className="bg-[#121216] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
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
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-600 text-sm sm:text-xs focus:outline-none focus:border-[#d4af37] transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
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
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-600 text-sm sm:text-xs focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl gold-button text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2"
              >
                <Shield className="w-4 h-4" />
                <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Accesos directos por negocio */}
      <div className="relative z-10 w-full max-w-3xl">
        <p className="text-center text-[11px] uppercase tracking-widest text-zinc-500 mb-4 font-mono font-semibold">
          Acceso rápido por sede
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Barber Choa */}
          <Link
            href="/barberia/login"
            className="group p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all flex items-center gap-3.5"
          >
            <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-white mb-0.5">Barber Choa Admin</h2>
              <p className="text-[11px] text-zinc-400">Turnos en vivo, barberos y servicios</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          </Link>

          {/* LM Nails */}
          <Link
            href="/manicura/login"
            className="group p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-rose-500/20 hover:border-rose-500/50 transition-all flex items-center gap-3.5"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-rose-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-white mb-0.5">LM Nails Admin</h2>
              <p className="text-[11px] text-zinc-400">Citas de manicura y portafolio de spa</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
