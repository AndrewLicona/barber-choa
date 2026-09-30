// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { LiveQueueItem, Worker } from '@/types/database';
import { getSupabase } from '@/lib/supabase/client';
import { Clock, Users, UserCheck, MessageSquare, X } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/whatsapp';

interface Props {
  barbers?: Worker[];
  businessType?: string;
}

export function LiveQueueWidget({ barbers, businessType = 'barberia' }: Props) {
  const [queue, setQueue] = useState<LiveQueueItem[]>([]);
  const [allBarbers, setAllBarbers] = useState<Worker[]>(barbers || []);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const sb = getSupabase();

  // Seleccionar barbero con clientes activos, o el primero
  const barberData = allBarbers.find(b => b.id === selectedBarberId) || null;
  const inService = queue.find(q => q.status === 'in_service');
  const waitingList = queue.filter(q => q.status === 'waiting');
  const totalWaiting = waitingList.length;
  const estimatedWait = totalWaiting * 25 + (inService ? 15 : 0);

  // Cargar todos los barberos del negocio
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
      if (data && data.length > 0) {
        setAllBarbers(data as Worker[]);
      }
    };
    loadBarbers();
  }, [businessType, barbers]);

  // Cuando cambian los barbers, seleccionar el que tiene clientes o el primero
  useEffect(() => {
    if (allBarbers.length === 0) return;
    const withClients = allBarbers.find(b => b.id === selectedBarberId && queue.some(q => q.worker_id === b.id && (q.status === 'in_service' || q.status === 'waiting')));
    if (!withClients) {
      // Priorizar el que tiene accepts_appointments = false (sillón vivo) o el primero
      const liveBarber = allBarbers.find(b => !b.accepts_appointments);
      setSelectedBarberId(liveBarber?.id || allBarbers[0].id);
    }
  }, [allBarbers]);

  const fetchQueue = async () => {
    if (!selectedBarberId) return;
    const { data } = await sb
      .from('live_queue')
      .select('*')
      .eq('worker_id', selectedBarberId)
      .in('status', ['waiting', 'in_service'])
      .order('position', { ascending: true });

    if (data) setQueue(data as LiveQueueItem[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedBarberId) return;
    fetchQueue();

    // Realtime subscription
    const channel = sb
      .channel(`queue-${selectedBarberId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_queue' }, fetchQueue)
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [selectedBarberId]);

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !barberData) return;
    setIsSubmitting(true);

    await sb.from('live_queue').insert({
      worker_id: barberData.id,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim() || null,
      status: inService ? 'waiting' : 'in_service',
      position: waitingList.length + 1,
      estimated_wait_minutes: estimatedWait,
    });

    setClientName('');
    setClientPhone('');
    setIsSubmitting(false);
    setShowJoinModal(false);
    await fetchQueue();
  };

  if (loading || !barberData) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#101014] p-6 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-2/3 mb-3" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/25 bg-[#101014] p-6 shadow-2xl">
      <div className="absolute top-0 right-1/3 w-64 h-24 bg-[#d4af37]/8 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-1 ring-[#d4af37]/40 bg-black flex-shrink-0">
            <img src={barberData?.avatar_url || '/logo_barberchoa.jpg'} alt={barberData?.name} className="w-full h-full object-cover" />
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#101014]" />
          </div>
          <div className="flex flex-col gap-1.5">
            {/* Selector de barbero */}
            {allBarbers.length > 1 && (
              <select
                value={selectedBarberId}
                onChange={e => setSelectedBarberId(e.target.value)}
                className="bg-black/60 border border-[#d4af37]/30 text-[#f3e5ab] text-xs font-mono rounded-lg px-2 py-1 pr-6 focus:outline-none focus:border-[#d4af37] appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='%23d4af37'%3E%3Cpath d='M0 0l5 6 5-6z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
              >
                {allBarbers.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            {allBarbers.length <= 1 && (
              <div className="flex items-center gap-2">
                <h3 className="font-luxury font-bold text-base text-white">{barberData?.name}</h3>
                <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  En Vivo
                </span>
              </div>
            )}
            <p className="text-xs text-zinc-400">{barberData?.accepts_appointments ? 'Agenda tu cita' : 'Atención por orden de llegada'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/50 px-3.5 py-2 rounded-xl border border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="text-xs font-bold text-white">{totalWaiting} en fila</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-mono text-[#f3e5ab]">~{estimatedWait} min</span>
          </div>
        </div>
      </div>

      {/* En el sillón */}
      <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 text-[#d4af37] flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37] block">Atendiendo ahora:</span>
            <p className="text-sm font-bold text-white">
              {inService ? inService.client_name : 'Sillón libre • Pasa directo'}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-black/40 text-zinc-400 border border-white/5">
          {inService ? 'En corte ✂️' : 'Disponible 💈'}
        </span>
      </div>

      {/* Lista en espera */}
      <div className="mt-4">
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

      {/* Botones */}
      <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={() => setShowJoinModal(true)}
          className="flex-1 py-3 px-4 rounded-xl gold-button text-xs font-bold uppercase tracking-wider text-center"
        >
          Anotarme en la Fila
        </button>
        <a
          href={`https://wa.me/${formatPhoneNumber(barberData.phone)}?text=${encodeURIComponent(
            `¡Hola ${barberData.name}! Estoy consultando el turno en vivo en Barber Choa. ¿Estás disponible?`
          )}`}
          target="_blank" rel="noopener noreferrer"
          className="py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span>WhatsApp</span>
        </a>
      </div>

      {/* Modal anotarse */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#121216] border border-[#d4af37]/30 rounded-2xl p-6 shadow-2xl">
            <button onClick={() => setShowJoinModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-luxury text-lg font-bold text-white mb-1">Anotarme con {barberData.name}</h3>
            <p className="text-xs text-zinc-400 mb-5">Ingresa tu nombre para asegurar tu lugar en la fila.</p>
            <form onSubmit={handleJoinQueue} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">Tu Nombre Completo *</label>
                <input type="text" required placeholder="Ej: Daniel Gómez" value={clientName} onChange={e => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37] text-xs transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">WhatsApp (Opcional)</label>
                <input type="tel" placeholder="Ej: 300 123 4567" value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37] text-xs transition-colors" />
                <p className="text-[10px] text-zinc-500 mt-1">Te avisaremos cuando falte 1 turno.</p>
              </div>
              <div className="pt-2 flex items-center gap-2.5">
                <button type="button" onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl gold-button text-xs font-bold uppercase tracking-wider shadow-md">
                  {isSubmitting ? 'Guardando...' : 'Confirmar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
