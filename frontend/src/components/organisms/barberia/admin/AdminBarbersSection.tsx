'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Clock, Trash2, Phone, KeyRound, Copy, CheckCircle2, Shield } from 'lucide-react';
import { Worker, Schedule } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
  onGetCredentials?: (workerId: string) => Promise<{ email: string; password: string }>;
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
  onGetCredentials,
  isAdmin = true,
  onError,
}: AdminBarbersSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [scheduleWorker, setScheduleWorker] = useState<Worker | null>(null);

  // Modal para ver / restablecer credenciales
  const [credentialsModal, setCredentialsModal] = useState<{
    workerName: string;
    email: string;
    password?: string;
    isNew?: boolean;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);
  const [loadingCredsId, setLoadingCredsId] = useState<string | null>(null);

  const openNew = () => {
    setEditingWorker(null);
    setIsModalOpen(true);
  };

  const openEdit = (w: Worker) => {
    setEditingWorker(w);
    setIsModalOpen(true);
  };

  const handleSaveBarberWrapper = async (
    worker: Worker | null,
    data: {
      name: string;
      phone: string;
      bio?: string;
      avatar_url?: string;
      accepts_appointments: boolean;
    },
  ) => {
    const result = await onSaveBarber(worker, data);
    setIsModalOpen(false);

    const creds = (result as any)?.credentials;
    if (!worker && creds && creds.email) {
      setCredentialsModal({
        workerName: data.name,
        email: creds.email,
        password: creds.password,
        isNew: true,
      });
    }
    return result;
  };

  const handleShowCredentials = async (worker: Worker) => {
    if (!onGetCredentials) return;
    setLoadingCredsId(worker.id);
    try {
      const creds = await onGetCredentials(worker.id);
      if (creds && creds.email) {
        setCredentialsModal({
          workerName: worker.name,
          email: creds.email,
          password: creds.password,
          isNew: false,
        });
      } else {
        onError?.('No se pudieron obtener las credenciales');
      }
    } catch (err: any) {
      onError?.(err?.message || 'Error al obtener credenciales');
    } finally {
      setLoadingCredsId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-luxury text-lg font-bold text-white">
            Equipo de Barberos ({workers.length})
          </h3>
          <p className="text-xs text-zinc-400">
            Administra especialistas, disponibilidad de citas y credenciales de acceso para su fila
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
              className={`p-5 rounded-2xl border transition-all ${
                worker.is_active
                  ? 'bg-[#121216] border-white/10 hover:border-[#d4af37]/40'
                  : 'bg-[#121216]/50 border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black shrink-0">
                    <img
                      src={worker.avatar_url || '/logo_barberchoa.jpg'}
                      alt={worker.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {worker.is_active && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#121216] rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{worker.name}</h4>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        worker.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {worker.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[#d4af37]" />
                    <span>{worker.phone || 'Sin teléfono'}</span>
                  </p>

                  {worker.bio && (
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                      {worker.bio}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 border border-white/5">
                      {worker.accepts_appointments ? '📅 Acepta Citas' : '💈 Solo Turnos en Fila'}
                    </span>

                    {/* Botón de acceso a credenciales en la tarjeta */}
                    {isAdmin && onGetCredentials && (
                      <button
                        type="button"
                        onClick={() => handleShowCredentials(worker)}
                        disabled={loadingCredsId === worker.id}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#f3e5ab] text-[10px] font-mono border border-[#d4af37]/30 transition-colors"
                      >
                        <KeyRound className={`w-3 h-3 text-[#d4af37] ${loadingCredsId === worker.id ? 'animate-spin' : ''}`} />
                        <span>{loadingCredsId === worker.id ? 'Cargando...' : 'Ver / Restablecer Clave'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de acción inferior */}
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
        onSave={handleSaveBarberWrapper}
        onError={onError}
      />

      {/* Modal de Credenciales (Visible tras crear o al pulsar "Ver / Restablecer Clave") */}
      {credentialsModal && (
        <Modal
          isOpen={!!credentialsModal}
          onClose={() => setCredentialsModal(null)}
          title={credentialsModal.isNew ? '¡Barbero Creado Exitosamente! ✅' : `Credenciales: ${credentialsModal.workerName}`}
          subtitle={
            credentialsModal.isNew
              ? 'Guarda estas credenciales para que el barbero pueda acceder'
              : 'Datos de acceso para administrar la fila de turnos'
          }
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-[#d4af37] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#f3e5ab] mb-0.5">Acceso del Barbero a su Fila</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  El barbero puede ingresar con estos datos en{' '}
                  <span className="text-[#d4af37] font-mono">/barberia/login</span> para gestionar su propia fila de clientes.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                  Correo electrónico de acceso
                </label>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-mono text-white break-all">
                    {credentialsModal.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(credentialsModal.email);
                      setCopiedField('email');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    title="Copiar correo"
                  >
                    {copiedField === 'email' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>

              {credentialsModal.password && (
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                    Contraseña
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-mono text-white tracking-widest">
                      {credentialsModal.password}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(credentialsModal.password!);
                        setCopiedField('password');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      title="Copiar contraseña"
                    >
                      {copiedField === 'password' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-white/10">
              <Button variant="gold" size="sm" onClick={() => setCredentialsModal(null)}>
                Entendido, cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
