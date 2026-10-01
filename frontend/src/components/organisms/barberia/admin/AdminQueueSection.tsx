'use client';

import React, { useState } from 'react';
import { UserCheck, Users, CheckCircle2, UserPlus, Phone, X, AlertCircle } from 'lucide-react';
import { LiveQueueItem, Worker } from '@/types/database';
import { generateQueueAlertWhatsAppLink } from '@/lib/whatsapp';
import { Button } from '@/components/ui/Button';

interface AdminQueueSectionProps {
  queue: LiveQueueItem[];
  workers: Worker[];
  onAdvanceQueue: () => Promise<void>;
  onAddWalkIn: (name: string, phone?: string) => Promise<void>;
  onRemoveQueueItem: (id: string) => Promise<void>;
}

export function AdminQueueSection({
  queue,
  workers,
  onAdvanceQueue,
  onAddWalkIn,
  onRemoveQueueItem,
}: AdminQueueSectionProps) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const inService = queue.find((q) => q.status?.toLowerCase() === 'in_service');
  const waitingList = queue.filter((q) => q.status?.toLowerCase() === 'waiting');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    setIsAdding(true);
    try {
      await onAddWalkIn(clientName.trim(), clientPhone.trim() || undefined);
      setClientName('');
      setClientPhone('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAdvance = async () => {
    setIsAdvancing(true);
    try {
      await onAdvanceQueue();
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado Actual y Acciones Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Turno en Atención */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-[#d4af37]/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-ping" />
          </div>

          <span className="text-[10px] font-mono tracking-widest uppercase text-[#d4af37] font-bold block mb-1">
            EN ATENCIÓN AHORA
          </span>

          {inService ? (
            <div>
              <h3 className="font-luxury text-2xl font-bold text-white tracking-wide">
                {inService.client_name}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Barbero:{' '}
                <span className="text-zinc-200 font-semibold">
                  {inService.worker?.name ||
                    workers.find((w) => w.id === inService.worker_id)?.name ||
                    'Barber Choa'}
                </span>
              </p>
              {inService.client_phone && (
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  📞 {inService.client_phone}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <Button
                  variant="gold"
                  size="sm"
                  onClick={handleAdvance}
                  isLoading={isAdvancing}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Finalizar & Avanzar Siguiente
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <UserCheck className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">No hay cliente en el sillón actualmente</p>
              {waitingList.length > 0 && (
                <Button
                  variant="gold"
                  size="sm"
                  onClick={handleAdvance}
                  isLoading={isAdvancing}
                  className="mt-3"
                >
                  Llamar al Primer Cliente
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Formulario Agregar Cliente Presencial */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08]">
          <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 font-bold block mb-1">
            AGREGAR CLIENTE A LA FILA
          </span>
          <h3 className="font-luxury text-lg font-bold text-white mb-3">
            Cliente en Puerta / Walk-in
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Nombre del cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#d4af37]/60"
              />
            </div>
            <div>
              <input
                type="tel"
                placeholder="Teléfono WhatsApp (opcional)"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#d4af37]/60"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={isAdding}
              leftIcon={<UserPlus className="w-4 h-4 text-[#d4af37]" />}
              className="w-full"
            >
              Agregar a la Fila
            </Button>
          </form>
        </div>
      </div>

      {/* Lista de Espera */}
      <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-luxury text-base sm:text-lg font-bold text-white">
              Próximos en Espera ({waitingList.length})
            </h3>
            <p className="text-xs text-zinc-400">
              Fila visible en tiempo real para todos los clientes
            </p>
          </div>
        </div>

        {waitingList.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            No hay clientes esperando en este momento.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {waitingList.map((item, idx) => {
              const barberName =
                item.worker?.name ||
                workers.find((w) => w.id === item.worker_id)?.name ||
                'Barber Choa';
              const alertLink = item.client_phone
                ? generateQueueAlertWhatsAppLink({
                    clientName: item.client_name,
                    position: idx + 1,
                    barberName,
                    clientPhone: item.client_phone,
                  })
                : '#';

              return (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-white/[0.05] border border-white/10 font-mono font-bold text-white flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">{item.client_name}</p>
                      <p className="text-[11px] text-zinc-400">
                        Barbero: <span className="text-zinc-300">{barberName}</span>
                        {item.client_phone && ` • 📞 ${item.client_phone}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.client_phone && (
                      <a
                        href={alertLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                        title="Enviar aviso por WhatsApp"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span className="hidden sm:inline">Avisar WhatsApp</span>
                      </a>
                    )}
                    <button
                      onClick={() => onRemoveQueueItem(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                      title="Retirar turno"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
