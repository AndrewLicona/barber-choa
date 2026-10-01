'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users, Scissors, Settings, LogOut, Camera, Shield, ArrowLeft, RefreshCw, UserCheck
} from 'lucide-react';
import { useBarberiaAdmin } from '@/hooks/useBarberiaAdmin';
import { AdminQueueSection } from '@/components/organisms/barberia/admin/AdminQueueSection';
import { AdminBarbersSection } from '@/components/organisms/barberia/admin/AdminBarbersSection';
import { AdminServicesSection } from '@/components/organisms/barberia/admin/AdminServicesSection';
import { AdminPortfolioSection } from '@/components/organisms/barberia/admin/AdminPortfolioSection';
import { AdminSettingsSection } from '@/components/organisms/barberia/admin/AdminSettingsSection';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Toast } from '@/components/ui/Toast';
import { Worker, Service, PortfolioItem } from '@/types/database';

export default function BarberiaAdminPage() {
  const {
    sessionLoading,
    isAuthenticated,
    userEmail,
    isAdmin,
    loading,
    toastMessage,
    dismissToast,
    showToast,
    queue,
    workers,
    services,
    portfolio,
    schedules,
    settings,
    business,
    handleLogout,
    advanceQueue,
    addWalkInToQueue,
    removeQueueItem,
    saveBarber,
    toggleBarberActive,
    deleteBarber,
    saveService,
    toggleServiceActive,
    deleteService,
    savePortfolioItem,
    deletePortfolioItem,
    saveSchedule,
    copyScheduleToWeek,
    saveSettings,
    refresh,
  } = useBarberiaAdmin();

  const [activeTab, setActiveTab] = useState<
    'queue' | 'barbers' | 'services' | 'portfolio' | 'settings'
  >('queue');

  // Modal de confirmación para eliminar
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'worker' | 'service' | 'portfolio';
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'worker') {
        await deleteBarber(deleteTarget.id);
      } else if (deleteTarget.type === 'service') {
        await deleteService(deleteTarget.id);
      } else if (deleteTarget.type === 'portfolio') {
        await deletePortfolioItem(deleteTarget.id);
      }
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <p className="text-xs text-zinc-500 font-mono tracking-widest animate-pulse">
          VERIFICANDO AUTENTICACIÓN...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const tabs = [
    {
      id: 'queue' as const,
      label: 'Fila en Vivo',
      icon: Users,
      badge: queue.length > 0 ? queue.length : undefined,
    },
    {
      id: 'barbers' as const,
      label: 'Barberos',
      icon: UserCheck,
      badge: workers.length > 0 ? workers.length : undefined,
    },
    {
      id: 'services' as const,
      label: 'Servicios',
      icon: Scissors,
      badge: services.length > 0 ? services.length : undefined,
    },
    {
      id: 'portfolio' as const,
      label: 'Portafolio',
      icon: Camera,
      badge: portfolio.length > 0 ? portfolio.length : undefined,
    },
    ...(isAdmin
      ? [
          {
            id: 'settings' as const,
            label: 'Configuración',
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* Toast de notificaciones */}
      <Toast toast={toastMessage} onDismiss={dismissToast} />

      {/* Header Admin */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#09090b]/90 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/barberia"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
              title="Volver a la vista pública"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-[#d4af37]/40 bg-black flex-shrink-0">
                <img
                  src="/logo_barberchoa.jpg"
                  alt="Barber Choa"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="font-luxury text-sm sm:text-base font-bold text-white leading-tight">
                  Panel <span className="text-[#d4af37]">Barber Choa</span>
                </h1>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation (Scrollable en móvil) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-white/[0.04]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 text-xs font-semibold tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#d4af37] text-[#f3e5ab] bg-white/[0.02]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.01]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-[#d4af37]/20 text-[#f3e5ab]'
                        : 'bg-white/10 text-zinc-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-xs text-zinc-500 font-mono tracking-widest animate-pulse">
              CARGANDO DATOS DEL PANEL...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'queue' && (
              <AdminQueueSection
                queue={queue}
                workers={workers}
                onAdvanceQueue={advanceQueue}
                onAddWalkIn={addWalkInToQueue}
                onRemoveQueueItem={removeQueueItem}
              />
            )}

            {activeTab === 'barbers' && (
              <AdminBarbersSection
                workers={workers}
                schedules={schedules}
                isAdmin={isAdmin}
                onSaveBarber={saveBarber}
                onToggleActive={toggleBarberActive}
                onDeleteRequest={(w: Worker) =>
                  setDeleteTarget({ type: 'worker', id: w.id, name: w.name })
                }
                onSaveSchedule={saveSchedule}
                onCopyWeekSchedule={copyScheduleToWeek}
                onError={(msg) => showToast(msg, 'error')}
              />
            )}

            {activeTab === 'services' && (
              <AdminServicesSection
                services={services}
                onSaveService={saveService}
                onToggleActive={toggleServiceActive}
                onDeleteRequest={(s: Service) =>
                  setDeleteTarget({ type: 'service', id: s.id, name: s.title })
                }
                onError={(msg) => showToast(msg, 'error')}
              />
            )}

            {activeTab === 'portfolio' && (
              <AdminPortfolioSection
                portfolio={portfolio}
                onSavePortfolioItem={savePortfolioItem}
                onDeleteRequest={(p: PortfolioItem) =>
                  setDeleteTarget({
                    type: 'portfolio',
                    id: p.id,
                    name: p.title || 'Foto de portafolio',
                  })
                }
                onError={(msg) => showToast(msg, 'error')}
              />
            )}

            {activeTab === 'settings' && (
              <AdminSettingsSection
                settings={settings}
                business={business}
                onSaveSettings={saveSettings}
                onError={(msg) => showToast(msg, 'error')}
              />
            )}
          </>
        )}
      </main>

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="¿Estás seguro?"
        message={`Esta acción eliminará "${deleteTarget?.name}" de forma permanente.`}
        confirmText="Sí, eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
}
