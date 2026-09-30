// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import { canManageBusiness } from '@/lib/access-control';
import { Shield, Lock, Mail, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function ManicuraLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setCheckingSession(false);
      return;
    }

    const timer = setTimeout(() => {
      setCheckingSession(false);
    }, 1500);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const canManage = await canManageBusiness(supabase, 'manicura');
          if (canManage) {
            router.push('/manicura/admin');
            return;
          }
        } catch {
          // Si no puede gestionar, permitimos que vea el formulario
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Error de configuración del cliente Supabase.');
      setLoading(false);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials') || error.message.toLowerCase().includes('invalid credentials')) {
            setErrorMsg('Correo o contraseña incorrectos. Verifica tus credenciales de LM Nails & Spa.');
          } else {
            setErrorMsg(error.message);
          }
        } else if (data.session) {
          router.push('/manicura/admin');
          router.refresh();
        }
      } else {
        if (password.length < 6) {
          setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes('user already registered')) {
            setErrorMsg('Este correo ya está registrado. Por favor inicia sesión.');
          } else {
            setErrorMsg(error.message);
          }
        } else {
          if (data.session) {
            router.push('/manicura/admin');
            router.refresh();
          } else {
            const loginRes = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });

            if (loginRes.data.session) {
              router.push('/manicura/admin');
              router.refresh();
            } else {
              setSuccessMsg('Cuenta creada exitosamente. Ya puedes iniciar sesión.');
              setMode('login');
            }
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0d090d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
          <p className="text-pink-200/60 text-sm tracking-widest uppercase">Verificando acceso a LM Nails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d090d] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <Link
            href="/manicura"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-pink-400/80 hover:text-pink-300 transition-colors py-1.5 px-4 rounded-full bg-pink-950/40 border border-pink-500/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a LM Nails
          </Link>
        </div>

        <div className="text-center">
          <div className="relative inline-block mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo_lmnail.jpg"
              alt="LM Nails & Spa"
              className="w-20 h-20 rounded-full object-cover border-2 border-pink-500/40 shadow-xl shadow-pink-500/10 mx-auto"
            />
            <div className="absolute -bottom-1 -right-1 bg-pink-500 text-white p-1 rounded-full border border-pink-900 shadow">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
            LM Nails & Spa
          </h2>
          <p className="text-xs uppercase tracking-widest text-pink-400 font-medium mt-1">
            Panel de Administración Exclusivo
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="bg-[#170e17]/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-pink-500/20">
          
          {/* Las cuentas administrativas se aprovisionan de forma controlada. */}
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-pink-500/15">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-pink-400" />
              <span className="text-xs uppercase tracking-wider text-pink-200/80 font-medium">
                {mode === 'login' ? 'Iniciar Sesión' : 'Registro de Administrador'}
              </span>
            </div>
            <span className="text-[11px] text-pink-300/50">Acceso autorizado</span>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400/50">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lmnails.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-pink-500/20 rounded-xl text-white placeholder-pink-300/30 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400/50">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-black/40 border border-pink-500/20 rounded-xl text-white placeholder-pink-300/30 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-pink-400/50 hover:text-pink-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-700 hover:from-pink-500 hover:via-rose-500 hover:to-purple-600 text-white font-semibold text-sm shadow-lg shadow-pink-900/30 border border-pink-400/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{mode === 'login' ? 'Entrar al Panel LM Nails' : 'Completar Registro'}</span>
                </>
              )}
            </button>
          </form>

          {/* Info Footer */}
          <div className="mt-6 pt-5 border-t border-pink-500/10 text-center">
            <p className="text-[11px] text-pink-300/50 leading-relaxed">
              Acceso restringido para administración de citas, manicuristas y configuración de <span className="text-pink-300 font-medium">LM Nails & Spa Studio</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
