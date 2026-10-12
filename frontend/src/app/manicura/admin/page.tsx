// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { nestJSFetch, getNestJSToken, getNestJSUser, nestJSLogout } from '@/lib/auth-context';
import { Worker, Service, Schedule } from '@/types/database';
import { ToggleRight, ToggleLeft, CheckCircle2, AlertCircle, RefreshCw, ImageIcon, Edit2, Trash2, UserPlus, UserCheck, Plus, Clock, AtSign, MapPin, Phone, TrendingUp, Activity as ActivityIcon } from 'lucide-react';
import { Toast } from '@/components/ui/Toast';

export default function ManicuraAdminPage() {
  const router = useRouter();

const {
    sessionLoading,
    isAuthenticated,
    userEmail,
    loading,
    toastMessage,
    appointments,
    workers,
    services,
    schedules,
    settings,
    business,
    showToast,
    loadBusinessData,
    deleteWorker,
    savePortfolioItem,
    deletePortfolioItem,
    updateScheduleDay,
    copyScheduleToWeek,
    saveSettings,
  } = useManicuraAdmin();

  useEffect(() => {
    if (isAuthenticated) loadBusinessData();
  }, [isAuthenticated, loadBusinessData]);

  const now = new Date();
  const upcomingAppts = appointments.filter(a => new Date(a.start_time) >= now);
  const pastAppts = appointments.filter(a => new Date(a.start_time) < now);
  const activeWorkers = workers.filter(w => w.is_active);
  const activeServices = services.filter(s => s.is_active);

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#0d090d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
          <p className="text-pink-200/60 text-sm tracking-widest uppercase">Verificando acceso…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0d090d] text-white flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0d090d]/95 border-b border-pink-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href="/manicura" className="p-2 rounded-xl text-pink-300/70 hover:text-white hover:bg-pink-950/50 border border-pink-500/20 transition-colors shrink-0">
              <ActivityIcon className="w-4 h-4" />
            </a>
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden ring-2 border-pink-500/40 ring-pink-500/40 shadow-lg shadow-pink-950/60 bg-black shrink-0">
              <img src="/logo_lmnail.jpg" alt="LM Nails Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white font-serif tracking-tight truncate">
                  LM Nails <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 font-sans font-bold">& Spa</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest bg-pink-950 text-pink-300 border border-pink-500/30 uppercase font-mono">
                  ADMIN SPA
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-pink-300/60 font-mono truncate max-w-[160px] sm:max-w-xs">
                {userEmail}
              </p>
            </div>
          </div>
<div className="flex items-center gap-2">
            <button onClick={() => router.push('/manicura/login')} className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 hover:text-red-100 text-xs font-medium transition-colors hover:bg-red-900/50 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
            <a href="/manicura" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-pink-950/40 border border-pink-500/30 text-pink-200 hover:text-white text-xs font-medium transition-colors hover:bg-pink-900/40">
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Sitio</span>
            </a>
            <button onClick={() => router.push('/manicura/login')} className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 hover:text-red-100 text-xs font-medium transition-colors hover:bg-red-900/50 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <Toast toast={toastMessage} onDismiss={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex border-b border-pink-500/20 mt-5 overflow-x-auto pb-0 gap-1 sm:gap-2 scrollbar-none">
          {[
            { key: 'dashboard', icon: ActivityIcon, label: 'Resumen' },
            { key: 'manicuristas', icon: Sparkles, label: `Especialistas (${workers.length})` },
            { key: 'services', icon: Heart, label: `Servicios (${services.length})` },
            { key: 'appointments', icon: Calendar, label: `Citas (${upcomingAppts.length})` },
            { key: 'settings', icon: Settings, label: 'Configuración' },
          ].map((tab) => (
            <button key={tab.key} className="flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer whitespace-nowrap">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Especialistas', value: workers.length, active: activeWorkers.length, icon: Sparkles, color: 'pink' },
              { label: 'Servicios', value: services.length, active: activeServices.length, icon: Heart, color: 'rose' },
              { label: 'Citas Próximas', value: upcomingAppts.length, active: null, icon: Calendar, color: 'purple' },
              { label: 'Total Citas', value: appointments.length, active: null, icon: TrendingUp, color: 'amber' },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-2xl bg-[#150d15]/60 border border-pink-500/20 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  {s.icon}
                  {s.active !== null && <span className="text-[10px] text-emerald-400 font-semibold">{s.active} activas</span>}
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{loading ? '—' : s.value}</p>
                  <p className="text-[11px] text-pink-300/60 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-[#150d15]/60 border border-pink-500/20">
            <h2 className="text-sm font-bold text-white font-serif mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-400" /> Próximas Citas
            </h2>
            {upcomingAppts.length === 0 ? (
              <p className="text-xs text-pink-300/50 text-center py-6">No hay citas próximas</p>
            ) : (
              <div className="space-y-2">
                {upcomingAppts.slice(0, 5).map((appt) => (
                  <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl bg-pink-950/20 border border-pink-500/10">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-600/30 flex items-center justify-center text-sm font-bold text-pink-200 shrink-0">
                      {appt.client_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{appt.client_name}</p>
                      <p className="text-xs text-pink-300/60 truncate">{appt.services?.title || 'Servicio'} · {appt.workers?.name || 'Cualquiera'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-mono text-pink-200/70">
                        {new Date(appt.start_time).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] font-mono text-pink-300/50">
                        {new Date(appt.start_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {upcomingAppts.length > 5 && (
                  <button className="w-full text-center text-xs text-pink-400 hover:text-pink-300 py-2 cursor-pointer">Ver todas las citas →</button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 rounded-2xl bg-gradient-to-br from-pink-950/60 to-purple-950/40 border border-pink-500/20 text-left hover:border-pink-500/40 transition-all cursor-pointer">
              <Sparkles className="w-5 h-5 text-pink-400 mb-2" />
              <p className="text-sm font-bold text-white">Gestionar Equipo</p>
              <p className="text-[11px] text-pink-300/60">{activeWorkers.length} especialistas activas</p>
            </button>
            <button className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/60 to-pink-950/40 border border-rose-500/20 text-left hover:border-rose-500/40 transition-all cursor-pointer">
              <Heart className="w-5 h-5 text-rose-400 mb-2" />
              <p className="text-sm font-bold text-white">Catálogo Servicios</p>
              <p className="text-[11px] text-pink-300/60">{activeServices.length} servicios activos</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function useManicuraAdmin() {
  const router = useRouter();
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [business, setBusiness] = useState<Record<string, any> | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => { setToastMessage(null); }, 4000);
  };

  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getNestJSToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return { ok: res.ok, json: () => res.json() };
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = getNestJSToken();
      const user = getNestJSUser();
      if (!token || !user) {
        setIsAuthenticated(false);
        router.replace('/manicura/login');
      } else {
        setIsAuthenticated(true);
        setUserEmail(user.email || 'Administradora LM Nails');
      }
      setSessionLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadBusinessData();
  }, [isAuthenticated, loadBusinessData]);

  const loadBusinessData = async () => {
    setLoading(true);
    try {
      const [workersRes, servicesRes, appointmentsRes, settingsRes] = await Promise.all([
        apiFetch('/admin/workers'),
        apiFetch('/admin/services'),
        apiFetch('/admin/appointments'),
        apiFetch('/admin/settings'),
      ]);

      if (workersRes.ok) setWorkers(await workersRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings || {});
        if (data.business) setBusiness(data.business);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    sessionLoading, isAuthenticated, userEmail, loading, toastMessage,
    appointments, workers, services, schedules, settings, business,
    showToast, loadBusinessData,
    toggleWorkerActive, deleteWorker,
    saveService, toggleServiceActive, deleteService,
    savePortfolioItem, deletePortfolioItem,
    updateScheduleDay, copyScheduleToWeek, saveSettings,
  };
}