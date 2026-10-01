'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Worker } from '@/types/database';

interface BarberModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  onSave: (worker: Worker | null, data: {
    name: string;
    phone: string;
    bio?: string;
    avatar_url?: string;
    accepts_appointments: boolean;
  }) => Promise<void>;
  onError?: (msg: string) => void;
}

export function BarberModal({
  isOpen,
  onClose,
  worker,
  onSave,
  onError,
}: BarberModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [acceptsAppts, setAcceptsAppts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (worker) {
      setName(worker.name);
      setPhone(worker.phone);
      setBio(worker.bio || '');
      setAvatarUrl(worker.avatar_url || '');
      setAcceptsAppts(worker.accepts_appointments);
    } else {
      setName('');
      setPhone('');
      setBio('');
      setAvatarUrl('');
      setAcceptsAppts(true);
    }
  }, [worker, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      onError?.('Ingresa el nombre y teléfono del barbero');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(worker, {
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        accepts_appointments: acceptsAppts,
      });
      onClose();
    } catch (err: any) {
      onError?.(err?.message || 'Error al guardar barbero');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={worker ? 'Editar Barbero' : 'Nuevo Barbero'}
      subtitle="Datos del especialista y disponibilidad de citas"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Imagen del barbero con ImageUploader unificado */}
        <ImageUploader
          label="Foto de Perfil"
          folder="avatars"
          value={avatarUrl}
          onChange={setAvatarUrl}
          aspectRatio="square"
          onError={onError}
        />

        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
            Nombre del Barbero *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Carlos Choa"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#d4af37]/60"
          />
        </div>

        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
            Teléfono WhatsApp *
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej. +57 300 123 4567"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#d4af37]/60"
          />
        </div>

        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
            Especialidad o Breve Biografía
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Especialista en degradados a navaja, barba y perfilado..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#d4af37]/60 resize-none"
          />
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
          <div>
            <p className="text-xs font-bold text-white">Acepta Citas Agendadas</p>
            <p className="text-[11px] text-zinc-400">
              Permite que los clientes reserven turnos programados con este barbero.
            </p>
          </div>
          <input
            type="checkbox"
            checked={acceptsAppts}
            onChange={(e) => setAcceptsAppts(e.target.checked)}
            className="w-4 h-4 accent-[#d4af37] rounded"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="gold" size="sm" isLoading={isSaving}>
            {worker ? 'Guardar Cambios' : 'Crear Barbero'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
