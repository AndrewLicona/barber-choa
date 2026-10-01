// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { LiveQueueItem, Worker, Appointment, Service } from '@/types/database';
import { getSupabase } from '@/lib/supabase/client';
import { Clock, Users, UserCheck, CheckCircle2, X, CalendarDays, Scissors } from 'lucide-react';

interface Props {
  barbers?: Worker[];
  businessType?: string;
  businessSlug?: string;
}

type Tab = 'queue' | 'appointments';

export function LiveQueueWidget({ barbers, businessType = 'barberia', businessSlug }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('queue');

  // — Fila en vivo —
  const [queue, setQueue] = useState<LiveQueueItem[]>([]);
  const [allBarbers, setAllBarbers] = useState<Worker[]>(barbers || []);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // — Citas agendadas —
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // — Modal de anotarse —
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<{ position: number; workerName: string; estimatedWait: number } | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const sb = getSupabase();

  const barberData = allBarbers.find((b) => b.id === selectedBarberId) || null;
  const inService = queue.find((q) => q.status === 'in_service' || q.status === 'IN_SERVICE');
  const waitingList = queue.filter((q) => q.status === 'waiting' || q.status === 'WAITING');
  const totalWaiting = waitingList.length;
  const estimatedWait = totalWaiting * 25 + (inService ? 15 : 0);

  // Cargar barberos
  useEffect(() => {
    if (barbers && barbers.length > 0) {
      setAllBarbers(barbers);
      return;
    }
    const loadBarbers = async () => {
      const { data } = await sb
        .from('workers')
        .select('*')
        .eq('business_type', businessType)
        .eq('is_active', true)
        .order('created_at');
      if (data && data.length > 0) setAllBarbers(data as Worker[]);
    };
    loadBarbers();
  }, [businessType, barbers]);

  // Seleccionar primer barbero
  useEffect(() => {
    if (allBarbers.length === 0) return;
    if (!selectedBarberId) {
      const liveBarber = allBarbers.find((b) => !b.accepts_appointments);
      setSelectedBarberId(liveBarber?.id || allBarbers[0].id);
    }
  }, [allBarbers]);

  // Fetch fila en vivo
  const fetchQueue = useCallback(async () => {
    if (!selectedBarberId) return;
    const { data, error } = await sb
      .from('live_queue')
      .select('*')
      .eq('worker_id', selectedBarberId)
      .in('status', ['WAITING', 'IN_SERVICE'])
      .order('position', { ascending: true });
    if (!error && data) setQueue(data as LiveQueueItem[]);
    setLoading(false);
  }, [selectedBarberId]);

  useEffect(() => {
    if (!selectedBarberId) return;
    fetchQueue();
    const channel = sb
      .channel(`queue-${selectedBarberId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_queue' }, fetchQueue)
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [selectedBarberId, fetchQueue]);

  // Fetch citas agendadas
  const fetchAppointments = useCallback(async () => {
    if (!selectedBarberId) return;
    setLoadingAppts(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await sb
      .from('appointments')
      .select('*, worker:workers(name, avatar_url), service:services(title)')
      .eq('worker_id', selectedBarberId)
      .gte('appointment_date', today)
      .in('status', ['PENDING', 'CONFIRMED'])
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true });
    if (data) setAppointments(data as any[]);
    setLoadingAppts(false);
  }, [selectedBarberId]);

  useEffect(() => {
    if (activeTab === 'appointments') fetchAppointments();
  }, [activeTab, selectedBarberId, fetchAppointments]);

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !barberData) return;
    setIsSubmitting(true);
    setJoinError(null);

    const slug = businessSlug || businessType;
    const cleanPhone = clientPhone.trim().replace(/\s+/g, '').replace(/^\+57/, '').replace(/^57/, '');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    try {
      const res = await fetch(`${apiUrl}/appointments/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: slug,
          workerId: barberData.id,
          clientName: clientName.trim(),
          clientPhone: `+57${cleanPhone}`,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || 'No se pudo registrar en la fila.');

      setJoinSuccess({
        position: payload.position,
        workerName: payload.workerName,
        estimatedWait: payload.estimatedWaitMinutes,
      });
      setClientName('');
      setClientPhone('');
      await fetchQueue();
    } catch (err: any) {
      setJoinError(err.message || 'Error al anotarse en la fila.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (loading || !barberData) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#101014] p-6 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-2/3 mb-3" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    );
  }

  const formatApptDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/25 bg-[#101014] shadow-2xl">
      <div className="absolute top-0 right-1/3 w-64 h-24 bg-[#d4af37]/8 blur-3xl rounded-full pointer-events-none" />

      {/* ── Header con selector de barbero ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden ring-1 ring-[#d4af37]/40 bg-black flex-shrink-0">
            <img src={barberData?.avatar_url || '/logo_barberchoa.jpg'} alt={barberData?.name} className="w-full h-full object-cover" />
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#101014]" />
          </div>
          <div>
            {allBarbers.length > 1 ? (
              <select
                value={selectedBarberId}
                onChange={(e) => setSelectedBarberId(e.target.value)}
                className="bg-black/60 border border-[#d4af37]/30 text-[#f3e5ab] text-xs font-mono rounded-lg px-2 py-1 pr-6 focus:outline-none focus:border-[#d4af37] appearance-none cursor-pointer"
              >
                {allBarbers.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-luxury font-bold text-sm text-white">{barberData?.name}</h3>
                <span className="text-[9px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  En Vivo
                </span>
              </div>
            )}
            <p className="text-[11px] text-zinc-400 mt-0.5">Atención por orden de llegada</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-xl border border-white/[0.06]">
          <Users className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="text-xs font-bold text-white">{totalWaiting} en fila</span>
          <span className="text-zinc-600 mx-1">|</span>
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-mono text-[#f3e5ab]">~{estimatedWait} min</span>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-white/[0.07]">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'queue'
              ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-[#d4af37]/5'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Fila en Vivo</span>
          {totalWaiting > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#d4af37]/20 text-[#f3e5ab] text-[9px] font-bold">{totalWaiting}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'appointments'
              ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-[#d4af37]/5'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Citas Agendadas</span>
        </button>
      </div>

      {/* ── Tab: Fila en Vivo ─────────────────────────────────────────────────── */}
      {activeTab === 'queue' && (
        <div className="p-4 sm:p-6 space-y-4">
          {/* En el sillón */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 text-[#d4af37] flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37] block">Atendiendo ahora:</span>
                <p className="text-sm font-bold text-white">
                  {inService ? inService.client_name : 'Sillón libre • Pasa directo'}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-black/40 text-zinc-400 border border-white/5 shrink-0">
              {inService ? 'En corte ✂️' : 'Disponible 💈'}
            </span>
          </div>

          {/* Lista en espera */}
          <div>
            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">Próximos turnos</h4>
            {waitingList.length === 0 ? (
              <div className="text-center py-5 border border-dashed border-white/[0.08] rounded-xl bg-black/20">
                <p className="text-xs text-zinc-400">No hay clientes esperando.</p>
                <p className="text-[11px] text-[#f3e5ab] mt-0.5">¡Llega ahora y serás el primero!</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {waitingList.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/30 border border-white/[0.04] text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded bg-white/5 text-[#d4af37] font-mono font-bold flex items-center justify-center text-[10px]">
                        #{idx + 1}
                      </span>
                      <span className="text-zinc-200 font-medium">{item.client_name}</span>
                    </div>
                    <span className="text-zinc-500 font-mono text-[11px]">~{(idx + 1) * 25} min</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón anotarse */}
          <button
            onClick={() => { setShowJoinModal(true); setJoinSuccess(null); setJoinError(null); }}
            className="w-full py-3 px-4 rounded-xl gold-button text-xs font-bold uppercase tracking-wider text-center"
          >
            Anotarme en la Fila
          </button>
        </div>
      )}

      {/* ── Tab: Citas Agendadas ──────────────────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <div className="p-4 sm:p-6">
          {loadingAppts ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/[0.08] rounded-xl bg-black/20">
              <CalendarDays className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">No hay citas agendadas próximas.</p>
              <p className="text-[11px] text-[#f3e5ab] mt-0.5">¡Reserva una desde el catálogo!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-start justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-black/30 border border-white/[0.06]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{appt.client_name}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      {appt.service?.title || 'Servicio'} · {appt.start_time?.slice(0, 5)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono font-bold text-[#f3e5ab] block">
                      {formatApptDate(appt.appointment_date)}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        appt.status === 'CONFIRMED'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {appt.status === 'CONFIRMED' ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Anotarse en la fila ──────────────────────────────────────── */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full sm:max-w-md bg-[#121216] border border-[#d4af37]/30 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl">
            <button onClick={() => setShowJoinModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>

            {joinSuccess ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 bg-[#d4af37]/20 text-[#d4af37]">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="font-luxury text-lg font-bold text-white mb-1">¡Estás en la fila!</h3>
                {joinSuccess.position === 0 ? (
                  <p className="text-sm text-emerald-400 font-semibold mb-1">¡Eres el siguiente! Pasa directamente.</p>
                ) : (
                  <p className="text-sm text-zinc-300 mb-1">
                    Turno <span className="font-bold text-[#d4af37]">#{joinSuccess.position}</span> con{' '}
                    <span className="font-bold">{joinSuccess.workerName}</span>
                  </p>
                )}
                <p className="text-xs text-zinc-400 mb-5">Espera aproximada: ~{joinSuccess.estimatedWait} min</p>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="py-2.5 px-6 rounded-xl gold-button text-xs font-bold uppercase tracking-wider"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-luxury text-lg font-bold text-white mb-1">Anotarme con {barberData.name}</h3>
                <p className="text-xs text-zinc-400 mb-5">
                  Ingresa tu nombre y celular para reservar tu lugar en la fila.
                </p>
                <form onSubmit={handleJoinQueue} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                      Tu Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Daniel Gómez"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37] text-xs transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                      Celular / WhatsApp *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 bg-black/60 border-white/10 text-[#d4af37] text-xs font-semibold select-none">+57</span>
                      <input
                        type="tel"
                        required
                        placeholder="300 123 4567"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-r-xl bg-black/50 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37] text-xs transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">Te avisaremos cuando falte 1 turno.</p>
                  </div>
                  {joinError && (
                    <p className="rounded-xl bg-red-500/10 p-3 text-xs text-red-300">{joinError}</p>
                  )}
                  <div className="pt-1 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowJoinModal(false)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 rounded-xl gold-button text-xs font-bold uppercase tracking-wider shadow-md disabled:opacity-50"
                    >
                      {isSubmitting ? 'Guardando...' : 'Confirmar Turno'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
