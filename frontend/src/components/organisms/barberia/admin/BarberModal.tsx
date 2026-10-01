'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Worker } from '@/types/database';
import { Copy, CheckCircle2, KeyRound } from 'lucide-react';

interface BarberModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  onSave: (
    worker: Worker | null,
    data: {
      name: string;
      phone: string;
      bio?: string;
      avatar_url?: string;
      accepts_appointments: boolean;
    },
  ) => Promise<{ credentials?: { email: string; password: string } } | void>;
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
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);

  useEffect(() => {
    if (worker) {
      setName(worker.name);
      setPhone(worker.phone);
      setBio(worker.bio || '');
      setAvatarUrl(worker.avatar_url || '');
      setAcceptsAppts(worker.accepts_appointments);
    } else {
      setName('');
      setPhone('+57 ');
      setBio('');
      setAvatarUrl('');
      setAcceptsAppts(true);
    }
    setGeneratedCredentials(null);
    setCopiedField(null);
  }, [worker, isOpen]);

  const handleCopy = async (text: string, field: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback: select text
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      onError?.('Ingresa el nombre y teléfono del barbero');
      return;
    }

    setIsSaving(true);
    try {
      const result = await onSave(worker, {
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        accepts_appointments: acceptsAppts,
      });

      // If creating a new barber and credentials were returned, show them
      if (!worker && result && (result as any).credentials) {
        setGeneratedCredentials((result as any).credentials);
      } else {
        onClose();
      }
    } catch (err: any) {
      onError?.(err?.message || 'Error al guardar barbero');
    } finally {
      setIsSaving(false);
    }
  };

  // Show credentials screen after creation
  if (generatedCredentials) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Barbero Creado ✅"
        subtitle="Guarda estas credenciales — no se mostrarán de nuevo"
        maxWidth="md"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-[#d4af37] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#f3e5ab] mb-1">Credenciales de acceso del barbero</p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                El barbero puede ingresar con estas credenciales en{' '}
                <span className="text-[#d4af37] font-mono">/barberia/login</span> para gestionar su fila.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Email */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5">
                Correo electrónico
              </label>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono text-white break-all">
                  {generatedCredentials.email}
                </span>
                <button
                  onClick={() => handleCopy(generatedCredentials.email, 'email')}
                  className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  title="Copiar"
                >
                  {copiedField === 'email' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-zinc-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5">
                Contraseña
              </label>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono text-white tracking-widest">
                  {generatedCredentials.password}
                </span>
                <button
                  onClick={() => handleCopy(generatedCredentials.password, 'password')}
                  className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  title="Copiar"
                >
                  {copiedField === 'password' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-zinc-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end border-t border-white/10">
            <Button variant="gold" size="sm" onClick={onClose}>
              Entendido, cerrar
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

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

        {!worker && (
          <div className="p-3 rounded-xl bg-[#d4af37]/5 border border-[#d4af37]/20">
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              Se generarán credenciales de acceso automáticamente para este barbero.
            </p>
          </div>
        )}

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
