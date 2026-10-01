'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    image_url: string;
    tags: string[];
  }) => Promise<void>;
  onError?: (msg: string) => void;
}

export function PortfolioModal({
  isOpen,
  onClose,
  onSave,
  onError,
}: PortfolioModalProps) {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = imageUrl.trim().replace(/^['"\s]+|['",;\s]+$/g, '');
    if (!cleanUrl) {
      onError?.('Sube o ingresa la URL de la imagen');
      return;
    }

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim() || 'Trabajo Barber Choa',
        image_url: cleanUrl,
        tags,
      });
      setTitle('');
      setImageUrl('');
      setTagsStr('');
      onClose();
    } catch (err: any) {
      onError?.(err?.message || 'Error al guardar foto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Foto al Portafolio"
      subtitle="Sube una fotografía de corte, barba o estilo realizado"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Imagen del portafolio con ImageUploader unificado */}
        <ImageUploader
          label="Foto del Trabajo / Corte"
          folder="portfolio"
          value={imageUrl}
          onChange={setImageUrl}
          aspectRatio="portrait"
          onError={onError}
        />

        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
            Título o Estilo (opcional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Low Fade + Diseño Lateral"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#d4af37]/60"
          />
        </div>

        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
            Etiquetas / Tags (separadas por coma)
          </label>
          <input
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="fade, degrade, navaja, barba"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#d4af37]/60"
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            Aparecerán como badges en la galería pública (#fade, #barba).
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="gold" size="sm" isLoading={isSaving}>
            Guardar en Portafolio
          </Button>
        </div>
      </form>
    </Modal>
  );
}
