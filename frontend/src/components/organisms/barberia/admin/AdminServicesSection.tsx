'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Scissors } from 'lucide-react';
import { Service } from '@/types/database';
import { formatCurrency } from '@/lib/whatsapp';
import { Button } from '@/components/ui/Button';
import { ServiceModal } from './ServiceModal';

interface AdminServicesSectionProps {
  services: Service[];
  onSaveService: (
    service: Service | null,
    data: {
      title: string;
      price: number;
      duration_minutes: number;
      description?: string;
      image_url?: string;
    },
  ) => Promise<void>;
  onToggleActive: (service: Service) => Promise<void>;
  onDeleteRequest: (service: Service) => void;
  onError?: (msg: string) => void;
}

export function AdminServicesSection({
  services,
  onSaveService,
  onToggleActive,
  onDeleteRequest,
  onError,
}: AdminServicesSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const openNew = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-luxury text-lg font-bold text-white">
            Catálogo de Servicios ({services.length})
          </h3>
          <p className="text-xs text-zinc-400">
            Define los cortes, precios y fotografías visibles para el cliente
          </p>
        </div>
        <Button
          variant="gold"
          size="sm"
          onClick={openNew}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nuevo Servicio
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-[#121216]">
          <p className="text-xs text-zinc-400">No hay servicios registrados.</p>
          <Button variant="gold" size="sm" onClick={openNew} className="mt-3">
            Crear el primer servicio
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl bg-[#121216] border border-white/[0.08] overflow-hidden flex flex-col justify-between"
            >
              {service.image_url ? (
                <div className="relative aspect-video w-full bg-black/60 overflow-hidden">
                  <img
                    src={service.image_url}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#f3e5ab]">
                    {service.duration_minutes || 30} min
                  </div>
                </div>
              ) : (
                <div className="h-20 bg-zinc-950/60 border-b border-white/5 flex items-center justify-center text-zinc-600">
                  <Scissors className="w-6 h-6" />
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-luxury text-base font-bold text-white">
                      {service.title}
                    </h4>
                    <span className="font-mono font-bold text-sm text-[#d4af37]">
                      {formatCurrency(service.price)}
                    </span>
                  </div>

                  {service.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <button
                    onClick={() => onToggleActive(service)}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                      service.is_active
                        ? 'text-zinc-400 border-white/10 hover:bg-white/5'
                        : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    }`}
                  >
                    {service.is_active ? 'Desactivar' : 'Activar'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(service)}
                      className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                      title="Editar servicio"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteRequest(service)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                      title="Eliminar servicio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear / editar servicio */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={editingService}
        onSave={onSaveService}
        onError={onError}
      />
    </div>
  );
}
