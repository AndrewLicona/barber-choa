// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import { DAY_NAMES } from '@/types/database';
import {
  User2, Shield, Clock, Calendar, LogOut, RefreshCw,
  CheckCircle2, AlertCircle, ToggleLeft, ToggleRight,
  Scissors, Sparkles, ChevronRight, ArrowLeft
} from 'lucide-react';

interface PortalWorker {
  id: string;
  name: string;
  business_id: string;
  phone: string;
  bio: string | null;
  is_active: boolean;
  accepts_appointments: boolean;
}

interface ScheduleItem {
  id: string;
  worker_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_active: boolean;
}

interface AppointmentItem {
  id: string;
  client_name: string;
  client_phone: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  services?: { title: string; price: number };
}

export default function PortalPage() {
  const router = useRouter();
  const supabase = getSupabase();

  const [worker, setWorker] = useState<PortalWorker | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<'barberia' | 'manicura'>('barberia');
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'appointments'>('schedule');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => { setToastMessage(null); }, 4000);
  };

  // Resolve the authenticated worker instead of trusting browser localStorage.
  useEffect(() => {
    if (!supabase) return;
    const resolveWorker = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/portal/login');
        return;
      }
      const { data: access } = await supabase
        .from('user_business_access')
        .select('role, is_active')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .eq('role', 'WORKER')
        .maybeSingle();
      if (!access) {
        await supabase.auth.signOut();
        router.replace('/portal/login');
        return;
      }
      const { data: workerProfile } = await supabase
        .from('workers')
        .select('id, name, business_id, phone, bio, is_active, accepts_appointments, user:users!inner(auth_user_id)')
        .eq('user.auth_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      if (!workerProfile) {
        await supabase.auth.signOut();
        router.replace('/portal/login');
        return;
      }
      setWorker(workerProfile as PortalWorker);
    };
    resolveWorker();
  }, [router, supabase]);

  const loadData = useCallback(async () => {
    if (!supabase || !worker) return;
    setLoading(true);

    try {
      // Get business info
      const { data: biz } = await supabase
        .from('businesses')
        .select('name, business_type')
        .eq('id', worker.business_id)
        .maybeSingle();

      if (biz) {
        setBusinessName(biz.name);
        setBusinessType(biz.business_type as 'barberia' | 'manicura');
      }

      // Load schedules
      const { data: schData } = await supabase
        .from('schedules')
        .select('*')
        .eq('worker_id', worker.id)
        .order('day_of_week', { ascending: true });
      setSchedules(schData || []);

      // Load upcoming appointments
      const today = new Date().toISOString().split('T')[0];
      const { data: apptData } = await supabase
        .from('appointments')
        .select('*, services(title, price)')
        .eq('worker_id', worker.id)
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(30);
      setAppointments(apptData || []);

    } catch (err: any) {
      console.error('Error loading portal data:', err);
      showToast('Error al cargar datos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, worker]);

  useEffect(() => {
    if (worker) {
      loadData();
    }
  }, [worker, loadData]);

  const handleLogout = () => {
    supabase?.auth.signOut().finally(() => router.replace('/portal/login'));
  };

  const handleUpdateScheduleDay = async (
    dayOfWeek: number,
    field: 'is_active' | 'start_time' | 'end_time' | 'break_start' | 'break_end',
    value: any
  ) => {
    if (!supabase || !worker) return;

    try {
      const existing = schedules.find(
        s => s.worker_id === worker.id && s.day_of_week === dayOfWeek
      );

      if (existing) {
        const { error } = await supabase
          .from('schedules')
          .update({ [field]: value })
          .eq('id', existing.id);

        if (error) throw error;
        setSchedules(schedules.map(s => s.id === existing.id ? { ...s, [field]: value } : s));
      } else {
        const newSched: any = {
          worker_id: worker.id,
          day_of_week: dayOfWeek,
          start_time: '09:00',
          end_time: '18:00',
          is_active: true,
          [field]: value
        };
        const { data, error } = await supabase
          .from('schedules')
          .insert(newSched)
          .select()
          .single();

        if (error) throw error;
        if (data) setSchedules([...schedules, data]);
      }
      showToast('Horario actualizado correctamente.');
    } catch (err: any) {
      showToast('Error al actualizar horario.', 'error');
    }
  };

  // Theme colors based on business type
  const isBarberia = businessType === 'barberia';
  const accentColor = isBarberia ? 'amber' : 'pink';
  const bgTint = isBarberia ? '#0c0a06' : '#0d090d';

  if (!worker) {
    return (
      <div className="min-h-screen bg-[#0a0c0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-indigo-200/60 text-sm tracking-widest uppercase">Cargando portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col selection:bg-indigo-500 selection:text-white" style={{ backgroundColor: '#0a0c0f' }}>

      {/* Top Nav Bar */}
      <nav className="bg-[#111318]/90 backdrop-blur-xl border-b border-indigo-500/20 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm border border-indigo-400/40">
              {worker.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">{worker.name}</h1>
              <p className="text-[10px] text-indigo-300/60 font-mono">
                {businessName} • {isBarberia ? '💈 Barbero' : '💅 Manicurista'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 hover:text-white transition-colors"
              title="Refrescar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/40 border border-red-500/20 text-red-300 hover:text-red-100 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-16 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-xs font-semibold tracking-wide ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/90 border-red-500/40 text-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">

        {/* Welcome Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-cyan-950/20 border border-indigo-500/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-1">
            ¡Bienvenido, {worker.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-xs text-indigo-200/60">
            Desde aquí puedes gestionar tu disponibilidad semanal, revisar tu agenda de citas y configurar tus descansos. Todo en tiempo real.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-indigo-500/20 mb-6 gap-4">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-950/30 rounded-t-lg'
                : 'border-transparent text-indigo-200/50 hover:text-indigo-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Mi Horario Semanal</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'appointments'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-950/30 rounded-t-lg'
                : 'border-transparent text-indigo-200/50 hover:text-indigo-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mis Citas ({appointments.length})</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* HORARIO SEMANAL                                        */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Mi Disponibilidad</h3>
                <p className="text-xs text-indigo-300/60">
                  Activa o desactiva los días que trabajas. Ajusta las horas de entrada, salida y descanso.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const daySched = schedules.find(s => s.day_of_week === day);
                const isActive = daySched ? daySched.is_active : false;
                const startTime = daySched?.start_time || '09:00';
                const endTime = daySched?.end_time || '18:00';
                const breakStart = daySched?.break_start || '';
                const breakEnd = daySched?.break_end || '';

                return (
                  <div
                    key={day}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-indigo-950/20 border-indigo-500/30 shadow-lg shadow-indigo-950/30'
                        : 'bg-[#111318]/40 border-zinc-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-white">{DAY_NAMES[day]}</h4>
                      <button
                        onClick={() => handleUpdateScheduleDay(day, 'is_active', !isActive)}
                        className="cursor-pointer"
                        title={isActive ? 'Marcar como descanso' : 'Marcar como laborable'}
                      >
                        {isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-zinc-500" />
                        )}
                      </button>
                    </div>

                    {isActive ? (
                      <div className="space-y-3">
                        {/* Horario principal */}
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-indigo-300/50 font-semibold mb-1">
                            Jornada
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => handleUpdateScheduleDay(day, 'start_time', e.target.value)}
                              className="flex-1 bg-black/50 border border-indigo-500/20 rounded-lg px-2 py-1.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                            />
                            <span className="text-indigo-400/40 text-xs">a</span>
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => handleUpdateScheduleDay(day, 'end_time', e.target.value)}
                              className="flex-1 bg-black/50 border border-indigo-500/20 rounded-lg px-2 py-1.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Descanso / Almuerzo */}
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-indigo-300/50 font-semibold mb-1">
                            Descanso / Almuerzo (Opcional)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={breakStart}
                              onChange={(e) => handleUpdateScheduleDay(day, 'break_start', e.target.value || null)}
                              className="flex-1 bg-black/50 border border-indigo-500/15 rounded-lg px-2 py-1.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                              placeholder="Inicio"
                            />
                            <span className="text-indigo-400/40 text-xs">a</span>
                            <input
                              type="time"
                              value={breakEnd}
                              onChange={(e) => handleUpdateScheduleDay(day, 'break_end', e.target.value || null)}
                              className="flex-1 bg-black/50 border border-indigo-500/15 rounded-lg px-2 py-1.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                              placeholder="Fin"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2">
                        <span>🌴 Día de descanso</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* MIS CITAS                                              */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Mis Próximas Citas</h3>
              <p className="text-xs text-indigo-300/60">
                Reservaciones asignadas a ti. Desde aquí puedes revisar los detalles de cada cita.
              </p>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[#111318]/40 rounded-2xl border border-indigo-500/15">
                <Calendar className="w-10 h-10 text-indigo-500/40 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">No tienes citas pendientes</h3>
                <p className="text-xs text-indigo-300/50 mt-1 max-w-sm mx-auto">
                  Las citas que te asignen aparecerán aquí automáticamente. Asegúrate de mantener tu horario actualizado.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => {
                  const statusColors: Record<string, string> = {
                    PENDING: 'bg-yellow-950/60 text-yellow-300 border-yellow-500/30',
                    CONFIRMED: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
                    COMPLETED: 'bg-blue-950/60 text-blue-300 border-blue-500/30',
                    CANCELLED: 'bg-red-950/60 text-red-300 border-red-500/30',
                    NO_SHOW: 'bg-zinc-900 text-zinc-400 border-zinc-700',
                  };

                  const statusLabels: Record<string, string> = {
                    PENDING: 'Pendiente',
                    CONFIRMED: 'Confirmada',
                    COMPLETED: 'Completada',
                    CANCELLED: 'Cancelada',
                    NO_SHOW: 'No Asistió',
                  };

                  return (
                    <div
                      key={appt.id}
                      className="p-4 rounded-2xl bg-[#111318]/60 border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-white">{appt.client_name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[appt.status] || statusColors.PENDING}`}>
                            {statusLabels[appt.status] || appt.status}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-200/60 font-mono">
                          📱 {appt.client_phone}
                        </p>
                        {appt.services && (
                          <p className="text-xs text-indigo-300/80 mt-1">
                            {isBarberia ? '✂️' : '💅'} {appt.services.title} — <span className="font-bold text-white">${appt.services.price.toLocaleString()}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-white">
                          {new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs text-indigo-300/70 font-mono">
                          {appt.start_time} — {appt.end_time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-indigo-500/10 py-4 text-center">
        <p className="text-[10px] text-indigo-300/30">
          Portal de Especialistas • {businessName} • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
