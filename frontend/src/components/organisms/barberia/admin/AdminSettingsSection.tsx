'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Phone, MapPin, Clock, Globe, Store, MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AdminSettingsSectionProps {
  settings: Record<string, string>;
  business?: Record<string, any> | null;
  onSaveSettings: (settings: Record<string, string>) => Promise<void>;
  onError?: (msg: string) => void;
}

export function AdminSettingsSection({
  settings,
  business,
  onSaveSettings,
  onError,
}: AdminSettingsSectionProps) {
  const [formData, setFormData] = useState<Record<string, string>>({
    business_name: '',
    whatsapp_number: '',
    address: '',
    opening_hours_text: '',
    instagram_url: '',
    description: '',
    booking_message: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const rawPhone = settings['whatsapp_number'] || business?.phone || '';
    const phoneVal = rawPhone.trim() ? rawPhone : '+57 ';
    setFormData({
      business_name: settings['business_name'] || business?.name || 'Barber Choa',
      address: settings['address'] || business?.address || '',
      opening_hours_text: settings['opening_hours_text'] || 'Lunes a Sábado: 9:00 AM - 8:00 PM',
      instagram_url: settings['instagram_url'] || business?.instagram_url || '',
      description: settings['description'] || business?.description || '',
      booking_message: settings['booking_message'] || business?.booking_message || '',
      ...settings,
      whatsapp_number: phoneVal,
    });
  }, [settings, business]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      onError?.(err?.message || 'Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="font-luxury text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#d4af37]" />
          Configuración de la Barbería
        </h3>
        <p className="text-xs text-zinc-400">
          Información general, número de atención y datos visibles para los clientes tanto en PC como en móviles.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#121216] border border-white/[0.08] space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre Comercial */}
          <div className="sm:col-span-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 mb-1.5">
              <Store className="w-3.5 h-3.5 text-[#d4af37]" />
              Nombre Comercial
            </label>
            <input
              type="text"
              required
              value={formData['business_name'] || ''}
              onChange={(e) => handleChange('business_name', e.target.value)}
              placeholder="Barber Choa"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60"
            />
          </div>

          {/* Teléfono WhatsApp */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 mb-1.5">
              <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
              WhatsApp de Atención *
            </label>
            <input
              type="tel"
              required
              value={formData['whatsapp_number'] || ''}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              placeholder="+57 300 000 0000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60 font-mono"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Este número se usa para contactar clientes y recibir consultas públicas.
            </p>
          </div>

          {/* Instagram / Redes */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 mb-1.5">
              <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
              Instagram / Web (@usuario o URL)
            </label>
            <input
              type="text"
              value={formData['instagram_url'] || ''}
              onChange={(e) => handleChange('instagram_url', e.target.value)}
              placeholder="@barberchoa o https://instagram.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60"
            />
          </div>

          {/* Dirección */}
          <div className="sm:col-span-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
              Dirección / Ubicación del Local
            </label>
            <input
              type="text"
              value={formData['address'] || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Calle 123 #45-67, Ciudad"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60"
            />
          </div>

          {/* Horario de Atención */}
          <div className="sm:col-span-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
              Horario de Atención Visible
            </label>
            <input
              type="text"
              value={formData['opening_hours_text'] || ''}
              onChange={(e) => handleChange('opening_hours_text', e.target.value)}
              placeholder="Lunes a Sábado: 9:00 AM - 8:00 PM"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60"
            />
          </div>

          {/* Descripción / Eslogan */}
          <div className="sm:col-span-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
              Descripción o Presentación
            </label>
            <textarea
              rows={2}
              value={formData['description'] || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Cortes clásicos, degradados y perfilado de barba con el mejor estilo..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60 resize-none"
            />
          </div>

          {/* Mensaje de Reserva */}
          <div className="sm:col-span-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
              Mensaje Informativo al Agendar
            </label>
            <input
              type="text"
              value={formData['booking_message'] || ''}
              onChange={(e) => handleChange('booking_message', e.target.value)}
              placeholder="Por favor llega 5 minutos antes de tu turno agendado."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="text-xs text-green-400 font-medium animate-pulse">
                ✓ Guardado exitosamente
              </span>
            )}
          </div>
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
