'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { nestJSFetch, getNestJSToken, getNestJSUser, nestJSLogout } from '@/lib/auth-context';
import { Worker, Service, Schedule, PortfolioItem } from '@/types/database';

interface ManicuraAdminData {
  sessionLoading: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  loading: boolean;
  toastMessage: { text: string; type: 'success' | 'error' } | null;
  appointments: any[];
  workers: Worker[];
  services: Service[];
  schedules: Schedule[];
  settings: Record<string, string>;
  business: Record<string, any> | null;
  showToast: (text: string, type: 'success' | 'error') => void;
  loadBusinessData: () => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  savePortfolioItem: (data: any) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  updateScheduleDay: (workerId: string, dayOfWeek: number, data: any) => Promise<void>;
  copyScheduleToWeek: (workerId: string) => Promise<void>;
  saveSettings: (newSettings: Record<string, string>) => Promise<void>;
}

export function useManicuraAdmin(): ManicuraAdminData {
  const router = useRouter();

  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [business, setBusiness] = useState<Record<string, any> | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => { setToastMessage(null); }, 4000);
  }, []);

  const apiFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = getNestJSToken();
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  }, []);

  const loadBusinessData = useCallback(async () => {
    setLoading(true);
    try {
      const [workersRes, servicesRes, appointmentsRes, settingsRes, portfolioRes] = await Promise.all([
        apiFetch('/admin/workers'),
        apiFetch('/admin/services'),
        apiFetch('/admin/appointments'), // We'll need to add this endpoint
        apiFetch('/admin/settings'),
        apiFetch('/admin/portfolio'),
      ]);

      if (workersRes.ok) setWorkers(await workersRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings || {});
        if (data.business) setBusiness(data.business);
      }
      if (portfolioRes.ok) {
        // Portfolio loaded but not stored in state for now
      }

      const workerIds = workers.map((w) => w.id);
      if (workerIds.length > 0) {
        const schedulesPromises = workerIds.map(id => apiFetch(`/schedules/worker/${id}`));
        const schedulesResults = await Promise.all(schedulesPromises);
        const allSchedules: Schedule[] = [];
        for (const res of schedulesResults) {
          if (res.ok) {
            const data = await res.json();
            allSchedules.push(...data.schedules);
          }
        }
        setSchedules(allSchedules);
      } else {
        setSchedules([]);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error al conectar con la API', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, showToast, workers]);

  useEffect(() => {
    const checkAuth = () => {
      const token = getNestJSToken();
      const user = getNestJSUser();
      if (!token || !user) {
        setIsAuthenticated(false);
        router.replace('/manicura/login');
      } else {
        setIsAuthenticated(true);
        setUserEmail(user.email || 'Administradora LM Nails');
      }
      setSessionLoading(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) loadBusinessData();
  }, [isAuthenticated, loadBusinessData]);

  const saveWorker = async (editingWorker: Worker | null, data: any) => {
    try {
      if (editingWorker) {
        const res = await apiFetch(`/admin/workers/${editingWorker.id}`, { method: 'PATCH', body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Error al actualizar especialista');
        showToast('Especialista actualizada correctamente.');
      } else {
        const res = await apiFetch('/admin/workers', { method: 'POST', body: JSON.stringify(data) });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.message || `Error al crear especialista (${res.status})`);
        }
        showToast('Nueva especialista creada con éxito. 💅');
      }
      await loadBusinessData();
    } catch (err: any) { showToast(err?.message || 'Error al guardar la especialista.', 'error'); }
  };

  const toggleWorkerActive = async (worker: Worker) => {
    try {
      const res = await apiFetch(`/admin/workers/${worker.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !worker.is_active }) });
      if (!res.ok) throw new Error('Error al cambiar estado');
      showToast(`${worker.name} ${!worker.is_active ? 'activada' : 'desactivada'}.`);
      await loadBusinessData();
    } catch (err: any) { showToast('Error al cambiar estado.', 'error'); }
  };

  const deleteWorker = async (id: string) => {
    try {
      const res = await apiFetch(`/admin/workers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar especialista');
      showToast('Especialista eliminada.');
      await loadBusinessData();
    } catch (err: any) { showToast('No se pudo eliminar.', 'error'); }
  };

  const saveService = async (editingService: Service | null, data: any) => {
    try {
      if (editingService) {
        const res = await apiFetch(`/admin/services/${editingService.id}`, { method: 'PATCH', body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Error al actualizar servicio');
        showToast('Servicio actualizado con éxito.');
      } else {
        const res = await apiFetch('/admin/services', { method: 'POST', body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Error al guardar el servicio');
        showToast('Servicio agregado al catálogo de LM Nails. ✨');
      }
      await loadBusinessData();
    } catch (err: any) { showToast(err?.message || 'Error al guardar el servicio.', 'error'); }
  };

  const toggleServiceActive = async (service: Service) => {
    try {
      const res = await apiFetch(`/admin/services/${service.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !service.is_active }) });
      if (!res.ok) throw new Error('Error al cambiar estado');
      showToast(`Servicio ${!service.is_active ? 'activado' : 'pausado'}.`);
      await loadBusinessData();
    } catch (err: any) { showToast('Error al cambiar estado.', 'error'); }
  };

  const deleteService = async (id: string) => {
    try {
      const res = await apiFetch(`/admin/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar servicio');
      showToast('Servicio eliminado.');
      await loadBusinessData();
    } catch (err: any) { showToast('No se pudo eliminar.', 'error'); }
  };

  const savePortfolioItem = async (data: any) => {
    try {
      const res = await apiFetch('/admin/portfolio', { method: 'POST', body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Error al agregar foto');
      showToast('Foto agregada al portafolio');
      await loadBusinessData();
    } catch (err: any) { showToast(err?.message || 'Error al agregar foto', 'error'); }
  };

  const deletePortfolioItem = async (id: string) => {
    try {
      const res = await apiFetch(`/admin/portfolio/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar foto');
      showToast('Foto eliminada del portafolio');
      await loadBusinessData();
    } catch (err: any) { showToast(err?.message || 'Error al eliminar foto', 'error'); }
  };

  const updateScheduleDay = async (workerId: string, dayOfWeek: number, data: any) => {
    try {
      const res = await apiFetch(`/admin/schedules/worker/${workerId}/day/${dayOfWeek}`, { method: 'PATCH', body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Error al actualizar horario');
      showToast('Horario actualizado.');
      await loadBusinessData();
    } catch (err: any) { showToast('Error al actualizar horario.', 'error'); }
  };

  const copyScheduleToWeek = async (workerId: string) => {
    try {
      const res = await apiFetch(`/admin/schedules/worker/${workerId}/copy-week`, { method: 'POST' });
      if (!res.ok) throw new Error('Error al copiar horario');
      showToast('Horario copiado a la semana.');
      await loadBusinessData();
    } catch (err: any) { showToast('Error al copiar horario.', 'error'); }
  };

  const saveSettings = async (newSettings: Record<string, string>) => {
    try {
      const res = await apiFetch('/admin/settings', { method: 'PATCH', body: JSON.stringify(newSettings) });
      if (!res.ok) throw new Error('Error al guardar configuraciones');
      const data = await res.json();
      setSettings(data.settings || {});
      if (data.business) setBusiness(data.business);
      showToast('Configuraciones de LM Nails guardadas. ✨');
    } catch (err: any) { showToast('Error al guardar configuraciones.', 'error'); }
  };

return {
    sessionLoading, isAuthenticated, userEmail, loading, toastMessage,
    appointments, workers, services, schedules, settings, business,
    showToast, loadBusinessData,
    deleteWorker,
    savePortfolioItem, deletePortfolioItem,
    updateScheduleDay, copyScheduleToWeek, saveSettings,
  };
}