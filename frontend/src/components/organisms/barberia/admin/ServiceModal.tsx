'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Service } from '@/types/database';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onSave: (service: Service | null, data: {
    title: string;
    price: number;
    duration_minutes: number;
    description?: string;
    image_url?: string;
  }) => Promise<void>;
  onError?: (msg: string) => void;
}

export function ServiceModal({
  isOpen,
  onClose,
  service,
  onSave,
  onError,
}: ServiceModalProps) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [desc, setDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (service) {
      setTitle(service.title);
      setPrice(String(service.price));
      setDuration(String(service.duration_minutes || 30));
      setDesc(service.description || '');
      setImageUrl(service.image_url || '');
    } else {
      setTitle('');
      setPrice('');
      setDuration('30');
      setDesc('');
      setImageUrl('');
    }
  }, [service, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      onError?.('Ingresa el nombre y precio del servicio');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(service, {
        title: title.trim(),
        price: Number(price),
        duration_minutes: Number(duration) || 30,
        description: desc.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      onError?.(err?.message || 'Error al guardar servicio');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={service ? 'Editar Servicio' : 'Nuevo Servicio'}
      subtitle="Datos del corte o tratamiento, foto y tarifa"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Imagen del servicio con ImageUploader unificado */}
        <ImageUploader
          label="Foto del Servicio / Corte"
          folder="services"
          value={imageUrl}
          onChange={setImageUrl}
          aspectRatio="video"
          onError={onError}
        />

        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
            Nombre del Servicio *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Corte Clásico + Barba VIP"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#d4af37]/60"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
              Precio (COP) *
            </label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="30000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#d4af37]/60 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
              Duración (Minutos)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#d4af37]/60 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
            Descripción y Detalles
          </label>
          <textarea
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Incluye lavado, toalla caliente y perfilado a navaja..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#d4af37]/60 resize-none"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="gold" size="sm" isLoading={isSaving}>
            {service ? 'Guardar Cambios' : 'Crear Servicio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
