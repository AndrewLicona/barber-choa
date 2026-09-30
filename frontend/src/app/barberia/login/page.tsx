// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { nestJSLogin, getNestJSToken, getNestJSUser } from '@/lib/auth-context';
import { Shield, Lock, Mail, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, Scissors } from 'lucide-react';

export default function BarberiaLoginPage() {
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
    // Verificar si ya tiene sesión NestJS activa
    const token = getNestJSToken();
    const user = getNestJSUser();
    if (token && user) {
      router.push('/barberia/admin');
      return;
    }
    setCheckingSession(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const user = await nestJSLogin(cleanEmail, password);
      if (user) {
        router.push('/barberia/admin');
        router.refresh();
      }
    } catch (err: any) {
      if (err.message.includes('incorrectos') || err.message.includes('Unauthorized')) {
        setErrorMsg('Correo o contraseña incorrectos.');
      } else {
        setErrorMsg(err.message || 'Error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080a] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-mono">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#08080a] p-4 text-zinc-100 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#d4af37]/10 blur-3xl rounded-full pointer-events-none" />

      {/* Regresar a Barbería */}
      <Link
        href="/barberia"
        className="absolute top-6 left-6 text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Volver a Barbería Choa</span>
      </Link>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo Card Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden ring-1 ring-[#d4af37]/40 shadow-xl bg-black mx-auto mb-3">
            <img
              src="/logo_barberchoa.jpg"
              alt="Barber Choa"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="font-luxury text-xl font-bold uppercase tracking-tight text-white">
            BARBER <span className="text-[#d4af37]">CHOA</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {mode === 'login' ? 'Acceso Exclusivo • Dueño de Barbería' : 'Registrar Cuenta de Barbería'}
          </p>
        </div>

        {/* Card Formulario */}
        <div className="bg-[#121216] border border-[#d4af37]/25 rounded-2xl p-6 shadow-2xl space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-[#d4af37] transition-colors font-mono"
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
              className="w-full py-3 rounded-xl gold-button text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
            >
              <Scissors className="w-4 h-4" />
              <span>
                {loading
                  ? 'Verificando...'
                  : mode === 'login'
                  ? 'Ingresar a Panel Barbería'
                  : 'Crear Acceso Barbería'}
              </span>
            </button>
          </form>

          {/* Las cuentas administrativas se aprovisionan de forma controlada. */}
          <div className="pt-2 border-t border-white/5 text-center">
            <p className="text-xs text-zinc-500">¿Necesitas acceso? Solicítalo al dueño de Choa Studio.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
