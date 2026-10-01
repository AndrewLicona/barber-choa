'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AdminSettingsSectionProps {
  settings: Record<string, string>;
  onSaveSettings: (settings: Record<string, string>) => Promise<void>;
  onError?: (msg: string) => void;
}

export function AdminSettingsSection({
  settings,
  onSaveSettings,
  onError,
}: AdminSettingsSectionProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings(formData);
    } catch (err: any) {
      onError?.(err?.message || 'Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="font-luxury text-lg font-bold text-white">
          Configuración de la Barbería
        </h3>
        <p className="text-xs text-zinc-400">
          Información general, número de atención y datos visibles para los clientes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#121216] border border-white/[0.08] space-y-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
            Nombre Comercial
          </label>
          <input
            type="text"
            value={formData['business_name'] || 'Barber Choa'}
            onChange={(e) => handleChange('business_name', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60"
          />
        </div>

        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
            WhatsApp Principal de Atención
          </label>
          <input
            type="tel"
            value={formData['whatsapp_number'] || ''}
            onChange={(e) => handleChange('whatsapp_number', e.target.value)}
            placeholder="+57 300 000 0000"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60 font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
            Dirección / Ubicación
          </label>
          <input
            type="text"
            value={formData['address'] || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Calle 123 #45-67, Ciudad"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60"
          />
        </div>

        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 block mb-1">
            Horario de Atención Visible
          </label>
          <input
            type="text"
            value={formData['opening_hours_text'] || 'Lunes a Sábado: 9:00 AM - 8:00 PM'}
            onChange={(e) => handleChange('opening_hours_text', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60"
          />
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end">
          <Button
            type="submit"
            variant="gold"
            size="sm"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
}
