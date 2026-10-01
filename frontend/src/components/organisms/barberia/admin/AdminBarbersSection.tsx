'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Clock, Trash2, Phone, CheckCircle, Shield } from 'lucide-react';
import { Worker, Schedule } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { BarberModal } from './BarberModal';
import { ScheduleModal } from './ScheduleModal';

interface AdminBarbersSectionProps {
  workers: Worker[];
  schedules: Schedule[];
  onSaveBarber: (
    worker: Worker | null,
    data: {
      name: string;
      phone: string;
      bio?: string;
      avatar_url?: string;
      accepts_appointments: boolean;
    },
  ) => Promise<{ credentials?: { email: string; password: string } } | void>;
  onToggleActive: (worker: Worker) => Promise<void>;
  onDeleteRequest: (worker: Worker) => void;
  onSaveSchedule: (
    workerId: string,
    dayOfWeek: number,
    data: { start_time: string; end_time: string; is_active: boolean },
  ) => Promise<void>;
  onCopyWeekSchedule: (workerId: string) => Promise<void>;
  isAdmin?: boolean;
  onError?: (msg: string) => void;
}

export function AdminBarbersSection({
  workers,
  schedules,
  onSaveBarber,
  onToggleActive,
  onDeleteRequest,
  onSaveSchedule,
  onCopyWeekSchedule,
  isAdmin = true,
  onError,
}: AdminBarbersSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [scheduleWorker, setScheduleWorker] = useState<Worker | null>(null);

  const openNew = () => {
    setEditingWorker(null);
    setIsModalOpen(true);
  };

  const openEdit = (w: Worker) => {
    setEditingWorker(w);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-luxury text-lg font-bold text-white">
            Equipo de Barberos ({workers.length})
          </h3>
          <p className="text-xs text-zinc-400">
            Administra especialistas, disponibilidad de citas y horarios
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="gold"
            size="sm"
            onClick={openNew}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nuevo Barbero
          </Button>
        )}
      </div>

      {workers.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-[#121216]">
          <p className="text-xs text-zinc-400">No hay barberos registrados.</p>
          {isAdmin && (
            <Button variant="gold" size="sm" onClick={openNew} className="mt-3">
              Crear el primer barbero
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08] flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex-shrink-0">
                  <img
                    src={worker.avatar_url || '/logo_barberchoa.jpg'}
                    alt={worker.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-luxury text-base font-bold text-white truncate">
                      {worker.name}
                    </h4>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                        worker.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {worker.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 font-mono mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>{worker.phone || 'Sin teléfono'}</span>
                  </p>

                  {worker.bio && (
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                      {worker.bio}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 border border-white/5">
                      {worker.accepts_appointments ? '📅 Acepta Citas' : '💈 Solo Turnos en Fila'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                <button
                  onClick={() => onToggleActive(worker)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                    worker.is_active
                      ? 'text-zinc-400 border-white/10 hover:bg-white/5'
                      : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  }`}
                >
                  {worker.is_active ? 'Desactivar' : 'Activar'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setScheduleWorker(worker)}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 border border-white/5 transition-colors"
                    title="Configurar Horarios"
                  >
                    <Clock className="w-4 h-4 text-[#d4af37]" />
                  </button>
                  <button
                    onClick={() => openEdit(worker)}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 border border-white/5 transition-colors"
                    title="Editar Barbero"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => onDeleteRequest(worker)}
                      className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-white/5 border border-white/5 transition-colors"
                      title="Eliminar Barbero"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear / editar barbero */}
      <BarberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        worker={editingWorker}
        onSave={onSaveBarber}
        onError={onError}
      />

      {/* Modal horarios */}
      <ScheduleModal
        isOpen={!!scheduleWorker}
        onClose={() => setScheduleWorker(null)}
        worker={scheduleWorker}
        schedules={schedules}
        onSaveSchedule={onSaveSchedule}
        onCopyWeek={onCopyWeekSchedule}
        onError={onError}
      />
    </div>
  );
}
