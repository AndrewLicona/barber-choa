// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Service, Worker } from '@/types/database';
import { getSupabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/whatsapp';
import { X, CheckCircle2, ChevronRight, Calendar, Clock, Scissors } from 'lucide-react';

interface Props {
  service: Service | null;
  services?: Service[];
  isOpen: boolean;
  onClose: () => void;
  defaultWorkerId?: string;
}

export function BookingModal({ service, services = [], isOpen, onClose, defaultWorkerId }: Props) {
  const [currentService, setCurrentService] = useState<Service | null>(service || (services.length > 0 ? services[0] : null));
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(defaultWorkerId || '');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookedInfo, setBookedInfo] = useState<{ workerName: string; date: string; time: string; service: string; phone: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Sincronizar servicio cuando cambian los props
  useEffect(() => {
    if (service) {
      setCurrentService(service);
    } else if (services.length > 0 && !currentService) {
      setCurrentService(services[0]);
    }
  }, [service, services]);

  // Sincronizar barbero por defecto
  useEffect(() => {
    if (defaultWorkerId) {
      setSelectedWorkerId(defaultWorkerId);
    }
  }, [defaultWorkerId, isOpen]);

  // Cargar workers reales desde la API pública o Supabase
  useEffect(() => {
    if (!isOpen) return;
    const bType = currentService?.business_type || 'barberia';
    const sb = getSupabase();
    sb.from('workers')
      .select('*')
      .eq('business_type', bType)
      .eq('accepts_appointments', true)
      .eq('is_active', true)
      .order('created_at')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setWorkers(data as Worker[]);
          if (!selectedWorkerId || !data.some((w) => w.id === selectedWorkerId)) {
            setSelectedWorkerId(defaultWorkerId || data[0].id);
          }
        }
      });
  }, [isOpen, currentService?.business_type, defaultWorkerId]);

  // Cargar disponibilidad real desde el backend (excluye horas ya tomadas)
  useEffect(() => {
    if (!isOpen || !currentService || !selectedWorkerId) return;
    const selectedDate = new Date();
    selectedDate.setDate(selectedDate.getDate() + selectedDateIndex);
    const date = [
      selectedDate.getFullYear(),
      String(selectedDate.getMonth() + 1).padStart(2, '0'),
      String(selectedDate.getDate()).padStart(2, '0'),
    ].join('-');
    const controller = new AbortController();
    setLoadingAvailability(true);
    setBookingError(null);
    setSelectedTime('');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    fetch(
      `${apiUrl}/appointments/availability?businessSlug=${currentService.business_type}&serviceId=${currentService.id}&workerId=${selectedWorkerId}&date=${date}`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'No fue posible consultar disponibilidad.');
        setAvailableTimes(payload.slots || []);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setAvailableTimes([]);
          setBookingError(error.message || 'No fue posible consultar disponibilidad.');
        }
      })
      .finally(() => setLoadingAvailability(false));
    return () => controller.abort();
  }, [isOpen, currentService, selectedWorkerId, selectedDateIndex]);

  if (!isOpen) return null;

  const activeService = currentService || service || services[0];
  if (!activeService) return null;

  const isBarber = activeService.business_type === 'barberia';
  const availableDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  const selectedWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !selectedWorker || !selectedTime) return;
    setIsSubmitting(true);
    setBookingError(null);

    const chosenDate = availableDates[selectedDateIndex];
    const date = [
      chosenDate.getFullYear(),
      String(chosenDate.getMonth() + 1).padStart(2, '0'),
      String(chosenDate.getDate()).padStart(2, '0'),
    ].join('-');
    const cleanPhone = clientPhone.trim().replace(/\s+/g, '').replace(/^\+57/, '').replace(/^57/, '');
    const formattedPhone = `+57 ${cleanPhone}`;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const response = await fetch(`${apiUrl}/appointments/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessSlug: activeService.business_type,
        serviceId: activeService.id,
        workerId: selectedWorker.id,
        date,
        startTime: selectedTime,
        clientName: clientName.trim(),
        clientPhone: `+57${cleanPhone}`,
        notes: notes.trim() || undefined,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setBookingError(payload.message || 'No fue posible registrar la cita. Intenta con otro horario.');
      setAvailableTimes((prev) => prev.filter((t) => t !== selectedTime));
      setSelectedTime('');
      setIsSubmitting(false);
      return;
    }

    const dateLabel = chosenDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    setBookedInfo({
      workerName: selectedWorker.name,
      date: dateLabel,
      time: selectedTime,
      service: activeService.title,
      phone: formattedPhone,
    });
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setBookedInfo(null);
    setClientName('');
    setClientPhone('');
    setNotes('');
    setSelectedTime('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full min-h-screen sm:min-h-0 sm:h-auto sm:max-w-lg sm:my-8 rounded-none sm:rounded-3xl p-5 sm:p-7 shadow-2xl border flex flex-col justify-between overflow-y-auto pb-16 sm:pb-7 ${
          isBarber
            ? 'bg-[#0f1523] border-[#d4af37]/30 text-white'
            : 'bg-white border-rose-200 text-stone-800'
        }`}
      >
        <button
          onClick={handleReset}
          className={`absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full transition-colors z-10 ${
            isBarber
              ? 'bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white'
              : 'bg-stone-100 hover:bg-stone-200 text-stone-500'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            {/* Header del servicio seleccionado */}
            <div className="flex items-start gap-3.5 pr-8 mb-5">
              {activeService.image_url && (
                <img
                  src={activeService.image_url}
                  alt={activeService.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-1 ring-[#d4af37]/30 flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1 ${
                    isBarber
                      ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20'
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}
                >
                  {isBarber ? '💈 Reservar Cita - Barbería' : '💅 Reservar Cita - Manicura'}
                </span>
                <h3 className="text-base sm:text-xl font-extrabold tracking-tight leading-snug">{activeService.title}</h3>
                <p className={`text-xs mt-0.5 font-mono ${isBarber ? 'text-[#f3e5ab]' : 'text-rose-600'}`}>
                  ⏱️ {activeService.duration_minutes} min • 💵 {formatCurrency(activeService.price)}
                </p>
              </div>
            </div>

            {/* Selector de Servicio si hay más de uno disponible */}
            {services && services.length > 1 && (
              <div className="mb-5 p-3 rounded-2xl bg-black/30 border border-white/10">
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isBarber ? 'text-zinc-300' : 'text-stone-700'}`}>
                  Cambiar Servicio
                </label>
                <select
                  value={activeService.id}
                  onChange={(e) => {
                    const found = services.find((s) => s.id === e.target.value);
                    if (found) setCurrentService(found);
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                    isBarber
                      ? 'bg-[#141b2e] border-[#d4af37]/40 text-[#f3e5ab] focus:border-[#d4af37]'
                      : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-rose-400'
                  }`}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                      {s.title} — {formatCurrency(s.price)} ({s.duration_minutes} min)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Selector de Profesional */}
              {workers.length > 0 && (
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isBarber ? 'text-zinc-300' : 'text-stone-700'}`}>
                    1. Selecciona el Profesional
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {workers.map((w) => (
                      <button
                        type="button"
                        key={w.id}
                        onClick={() => setSelectedWorkerId(w.id)}
                        className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border text-left transition-all ${
                          selectedWorkerId === w.id
                            ? isBarber
                              ? 'bg-[#d4af37]/15 border-[#d4af37] text-white shadow-md'
                              : 'bg-rose-50 border-rose-400 text-rose-950 shadow-md'
                            : isBarber
                            ? 'bg-black/30 border-white/10 text-zinc-300 hover:border-white/20'
                            : 'bg-stone-50 border-stone-200 text-stone-600'
                        }`}
                      >
                        <img src={w.avatar_url || '/logo_barberchoa.jpg'} alt={w.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <p className="text-xs font-bold">{w.name}</p>
                          <p className={`text-[10px] ${isBarber ? 'text-zinc-400' : 'text-stone-500'}`}>
                            {w.bio || (w.business_type === 'barberia' ? 'Barbero Profesional' : 'Nail Artist')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector Fecha */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isBarber ? 'text-zinc-300' : 'text-stone-700'}`}>
                  2. Elige el Día
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {availableDates.map((date, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setSelectedDateIndex(idx)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-14 py-2.5 rounded-2xl border text-center transition-all ${
                        selectedDateIndex === idx
                          ? isBarber
                            ? 'bg-[#d4af37] text-black font-extrabold border-[#c5a059] shadow-md'
                            : 'bg-rose-500 text-white font-extrabold border-rose-600 shadow-md'
                          : isBarber
                          ? 'bg-black/40 border-white/10 text-zinc-300'
                          : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      <span className="text-[10px] uppercase">{date.toLocaleDateString('es-CO', { weekday: 'short' })}</span>
                      <span className="text-base font-bold my-0.5">{date.getDate()}</span>
                      <span className="text-[9px] uppercase opacity-80">{date.toLocaleDateString('es-CO', { month: 'short' })}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector Hora */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isBarber ? 'text-zinc-300' : 'text-stone-700'}`}>
                  3. Elige la Hora
                </label>
                {loadingAvailability ? (
                  <p className="py-3 text-xs text-zinc-400 animate-pulse">Consultando horarios disponibles...</p>
                ) : availableTimes.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-current/20 p-3 text-xs opacity-70">
                    No hay horarios disponibles para esta fecha. Prueba otro día o profesional.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableTimes.map((time) => (
                      <button
                        type="button"
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                          selectedTime === time
                            ? isBarber
                              ? 'bg-[#d4af37] text-black font-bold border-[#c5a059]'
                              : 'bg-rose-500 text-white font-bold border-rose-600'
                            : isBarber
                            ? 'bg-black/30 border-white/10 text-zinc-300 hover:border-[#d4af37]/50'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-rose-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Datos del cliente */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isBarber ? 'text-zinc-300' : 'text-stone-700'}`}>
                    Tu Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Daniel Gómez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      isBarber
                        ? 'bg-black/40 border-white/10 text-white placeholder-zinc-500 focus:border-[#d4af37]'
                        : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-rose-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isBarber ? 'text-zinc-300' : 'text-stone-700'}`}>
                    Tu Celular *
                  </label>
                  <div className="flex">
                    <span className={`inline-flex items-center px-3 rounded-l-xl border border-r-0 text-sm font-semibold select-none ${
                      isBarber
                        ? 'bg-black/60 border-white/10 text-[#d4af37]'
                        : 'bg-stone-100 border-stone-200 text-stone-600'
                    }`}>+57</span>
                    <input
                      type="tel"
                      required
                      placeholder="300 123 4567"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-r-xl border text-sm focus:outline-none transition-colors ${
                        isBarber
                          ? 'bg-black/40 border-white/10 text-white placeholder-zinc-500 focus:border-[#d4af37]'
                          : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-rose-400'
                      }`}
                    />
                  </div>
                  <p className={`text-[10px] mt-1 ${isBarber ? 'text-zinc-500' : 'text-stone-400'}`}>
                    Te contactaremos a este número para confirmar tu cita.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                {bookingError && (
                  <p className="mb-3 rounded-xl bg-red-500/10 p-3 text-xs text-red-300">{bookingError}</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || workers.length === 0 || !selectedTime || !clientName.trim() || !clientPhone.trim()}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                    isBarber
                      ? 'bg-[#d4af37] hover:bg-[#e5c358] text-black shadow-[#d4af37]/25 disabled:opacity-50'
                      : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 disabled:opacity-50'
                  }`}
                >
                  <span>{isSubmitting ? 'Reservando...' : 'Confirmar Reserva'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Pantalla de confirmación EN PLATAFORMA */
          <div className="text-center py-6">
            <div
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
                isBarber ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight mb-2">¡Cita Confirmada!</h3>
            <p className={`text-sm max-w-sm mx-auto mb-6 ${isBarber ? 'text-zinc-300' : 'text-stone-600'}`}>
              Hola <span className="font-bold">{clientName}</span>, tu cita quedó registrada.
            </p>

            {bookedInfo && (
              <div
                className={`rounded-2xl p-4 mb-6 text-left space-y-2 ${
                  isBarber ? 'bg-white/[0.04] border border-[#d4af37]/20' : 'bg-stone-50 border border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isBarber ? 'text-[#d4af37]' : 'text-rose-500'}`} />
                  <span className="text-xs font-semibold">{bookedInfo.service}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                  <span className={`text-xs capitalize ${isBarber ? 'text-zinc-300' : 'text-stone-700'}`}>{bookedInfo.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                  <span className={`text-xs font-mono ${isBarber ? 'text-zinc-300' : 'text-stone-700'}`}>
                    {bookedInfo.time} con <strong>{bookedInfo.workerName}</strong>
                  </span>
                </div>
              </div>
            )}

            <p
              className={`text-[11px] mb-5 ${isBarber ? 'text-zinc-500' : 'text-stone-400'}`}
            >
              📱 Te contactaremos al <strong>{bookedInfo?.phone || clientPhone}</strong> para confirmar.
            </p>

            <button
              type="button"
              onClick={handleReset}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all ${
                isBarber
                  ? 'bg-[#d4af37] hover:bg-[#e5c358] text-black'
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              Volver al catálogo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
