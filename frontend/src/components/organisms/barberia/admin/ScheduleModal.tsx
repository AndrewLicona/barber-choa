'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Worker, Schedule, DAY_NAMES } from '@/types/database';
import { Copy, Clock } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  schedules: Schedule[];
  onSaveSchedule: (
    workerId: string,
    dayOfWeek: number,
    data: { start_time: string; end_time: string; is_active: boolean },
  ) => Promise<void>;
  onCopyWeek: (workerId: string) => Promise<void>;
  onError?: (msg: string) => void;
}

export function ScheduleModal({
  isOpen,
  onClose,
  worker,
  schedules,
  onSaveSchedule,
  onCopyWeek,
  onError,
}: ScheduleModalProps) {
  const [copying, setCopying] = useState(false);
  const [savingDay, setSavingDay] = useState<number | null>(null);

  if (!worker) return null;

  const workerSchedules = schedules.filter((s) => s.worker_id === worker.id);

  const handleDayChange = async (
    day: number,
    data: { start_time: string; end_time: string; is_active: boolean },
  ) => {
    setSavingDay(day);
    try {
      await onSaveSchedule(worker.id, day, data);
    } catch (err: any) {
      onError?.(err?.message || 'Error al guardar horario');
    } finally {
      setSavingDay(null);
    }
  };

  const handleCopy = async () => {
    setCopying(true);
    try {
      await onCopyWeek(worker.id);
    } finally {
      setCopying(false);
    }
  };

  const days = [1, 2, 3, 4, 5, 6, 0]; // Lunes a Domingo

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Horarios: ${worker.name}`}
      subtitle="Configura los días y turnos de atención para citas"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#d4af37]" />
            <span className="text-xs text-zinc-300">
              ¿Mismo horario toda la semana?
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            isLoading={copying}
            leftIcon={<Copy className="w-3.5 h-3.5" />}
          >
            Copiar Lunes a toda la semana
          </Button>
        </div>

        <div className="divide-y divide-white/[0.08]">
          {days.map((dayNum) => {
            const sch = workerSchedules.find((s) => s.day_of_week === dayNum) || {
              day_of_week: dayNum,
              start_time: '09:00',
              end_time: '18:00',
              is_active: dayNum !== 0,
            };

            const isSaving = savingDay === dayNum;

            return (
              <div
                key={dayNum}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 w-32">
                  <span className="text-xs font-bold text-white uppercase">
                    {DAY_NAMES[dayNum] || `Día ${dayNum}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={sch.is_active}
                      onChange={(e) =>
                        handleDayChange(dayNum, {
                          start_time: sch.start_time,
                          end_time: sch.end_time,
                          is_active: e.target.checked,
                        })
                      }
                      className="accent-[#d4af37] rounded"
                    />
                    <span>Abierto</span>
                  </label>

                  {sch.is_active && (
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={sch.start_time}
                        onChange={(e) =>
                          handleDayChange(dayNum, {
                            start_time: e.target.value,
                            end_time: sch.end_time,
                            is_active: true,
                          })
                        }
                        className="px-2 py-1 text-xs rounded bg-zinc-900 border border-white/10 text-white font-mono"
                      />
                      <span className="text-zinc-500 text-xs">-</span>
                      <input
                        type="time"
                        value={sch.end_time}
                        onChange={(e) =>
                          handleDayChange(dayNum, {
                            start_time: sch.start_time,
                            end_time: e.target.value,
                            is_active: true,
                          })
                        }
                        className="px-2 py-1 text-xs rounded bg-zinc-900 border border-white/10 text-white font-mono"
                      />
                    </div>
                  )}

                  {isSaving && (
                    <span className="text-[10px] text-[#d4af37] font-mono animate-pulse">
                      Guardando...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end">
          <Button variant="gold" size="sm" onClick={onClose}>
            Listo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
