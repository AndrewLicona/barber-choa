'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getNestJSToken, getNestJSUser, nestJSLogout, nestJSFetch } from '@/lib/auth-context';
import { Worker, Service, LiveQueueItem, Schedule, PortfolioItem } from '@/types/database';
import { ToastData } from '@/components/ui/Toast';

interface BarberiaAdminData {
  sessionLoading: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  isAdmin: boolean;
  userRole: string;
  loading: boolean;
  toastMessage: ToastData | null;
  queue: LiveQueueItem[];
  workers: Worker[];
  services: Service[];
  portfolio: PortfolioItem[];
  schedules: Schedule[];
  settings: Record<string, string>;
  business: Record<string, any> | null;
  masterBarber: Worker | null;
  collabBarbers: Worker[];
  currentWorker: Worker | null;
  showToast: (text: string, type: 'success' | 'error') => void;
  dismissToast: () => void;
  handleLogout: () => Promise<void>;
  advanceQueue: (workerId: string) => Promise<void>;
  addWalkInToQueue: (name: string, phone?: string, workerId?: string) => Promise<void>;
  removeQueueItem: (queueItemId: string) => Promise<void>;
  saveBarber: (
    editingWorker: Worker | null,
    data: { name: string; phone: string; bio?: string; avatar_url?: string; accepts_appointments: boolean }
  ) => Promise<{ credentials?: { email: string; password: string } } | void>;
  toggleBarberActive: (worker: Worker) => Promise<void>;
  deleteBarber: (id: string) => Promise<void>;
  getOrResetBarberCredentials: (workerId: string) => Promise<{ email: string; password: string }>;
  saveService: (
    editingService: Service | null,
    data: { title: string; price: number; duration_minutes: number; description?: string; image_url?: string }
  ) => Promise<void>;
  toggleServiceActive: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  savePortfolioItem: (data: { title: string; image_url: string; tags: string[] }) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  saveSchedule: (workerId: string, dayOfWeek: number, data: { start_time: string; end_time: string; is_active: boolean }) => Promise<void>;
  copyScheduleToWeek: (workerId: string, baseDayOfWeek?: number) => Promise<void>;
  saveSettings: (newSettings: Record<string, string>) => Promise<void>;
  refresh: () => void;
}

export function useBarberiaAdmin(): BarberiaAdminData {
  const router = useRouter();

  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastData | null>(null);

  const [queue, setQueue] = useState<LiveQueueItem[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [business, setBusiness] = useState<Record<string, any> | null>(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [userRole, setUserRole] = useState<string>('ADMIN');

  const [masterBarber, setMasterBarber] = useState<Worker | null>(null);
  const [collabBarbers, setCollabBarbers] = useState<Worker[]>([]);
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => { setToastMessage(null); }, 4000);
  }, []);

  const dismissToast = useCallback(() => { setToastMessage(null); }, []);

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

  const getBusinessId = useCallback((): string | null => {
    const user = getNestJSUser();
    if (!user || !user.businessId) return null;
    return user.businessId;
  }, []);

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const businessId = getBusinessId();
      const queueFilter = businessId ? `?businessId=${businessId}` : '';
      const workersFilter = businessId ? `?businessId=${businessId}` : '';

      const [queueRes, workersRes, servicesRes, settingsRes, portfolioRes, businessRes] = await Promise.all([
        apiFetch(`/admin/queue${queueFilter}`),
        apiFetch(`/admin/workers${workersFilter}`),
        apiFetch('/admin/services'),
        apiFetch('/admin/settings'),
        apiFetch('/admin/portfolio'),
        apiFetch('/admin/settings').then(r => r.json()).then(d => d.business).catch(() => null),
      ]);

      if (queueRes.ok) {
        const data = await queueRes.json();
        setQueue(data);
      }
      if (workersRes.ok) {
        const data = await workersRes.json();
        setWorkers(data.filter((w: any) => w.business_id === businessId || businessId === null));
        setMasterBarber(
          data.find((w: any) => !w.accepts_appointments) || data[0] || null,
        );
        setCollabBarbers(data.filter((w: any) => w.accepts_appointments));
      }
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings || {});
        if (data.business) setBusiness(data.business);
      }
      if (portfolioRes.ok) {
        const data = await portfolioRes.json();
        setPortfolio(data);
      }
      if (businessRes) {
        setBusiness(businessRes);
      }

      const workerIds = workers.map((w: any) => w.id);
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
      if (isInitial) setLoading(false);
    }
  }, [apiFetch, showToast, getBusinessId]);

  const checkAuth = () => {
    const token = getNestJSToken();
    const user = getNestJSUser();
    if (!token || !user) {
      setIsAuthenticated(false);
      router.replace('/barberia/login');
    } else {
      setIsAuthenticated(true);
      setUserEmail(user.email || 'Administrador Barbería');
      const role = (user.role || '').toUpperCase();
      setUserRole(role);
      const isWorkerOnly = role.includes('WORKER') && !role.includes('ADMIN') && !role.includes('SUPER');
      setIsAdmin(!isWorkerOnly);
      
      // Set current worker from JWT
      if (user.worker) {
        setCurrentWorker(user.worker);
      }
    }
    setSessionLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData(true);
  }, [isAuthenticated, loadData]);

  const handleLogout = async () => {
    try { nestJSLogout(); } catch (e) { console.error(e); }
    router.push('/barberia/login');
  };

  const advanceQueue = async (workerId: string) => {
    try {
      const res = await apiFetch('/admin/queue/advance', {
        method: 'POST',
        body: JSON.stringify({ worker_id: workerId }),
      });
      if (!res.ok) throw new Error('Error al avanzar turno');
      await loadData();
      showToast('Turno avanzado correctamente');
    } catch (err: any) { showToast(err?.message || 'Error al avanzar turno', 'error'); }
  };

  const addWalkInToQueue = async (name: string, phone?: string, workerId?: string) => {
    const targetWorkerId = workerId || workers.find((w) => !w.accepts_appointments)?.id || workers[0]?.id;
    if (!targetWorkerId) { showToast('Crea primero un barbero en la pestaña Barberos', 'error'); return; }
    try {
      const res = await apiFetch('/admin/queue/walkin', {
        method: 'POST',
        body: JSON.stringify({ client_name: name.trim(), client_phone: phone?.trim() || null, worker_id: targetWorkerId }),
      });
      if (!res.ok) throw new Error('Error al añadir turno');
      await loadData();
      showToast('Cliente añadido a la fila');
    } catch (err: any) { showToast(err?.message || 'Error al añadir turno', 'error'); }
  };

  const removeQueueItem = async (queueItemId: string) => {
    try {
      const res = await apiFetch(`/admin/queue/item/${queueItemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al retirar turno');
      await loadData();
      showToast('Turno retirado');
    } catch (err: any) { showToast(err?.message || 'Error al retirar turno', 'error'); }
  };

  const saveBarber = async (
    editingWorker: Worker | null,
    data: { name: string; phone: string; bio?: string; avatar_url?: string; accepts_appointments: boolean }
  ) => {
    try {
      if (editingWorker) {
        const res = await apiFetch(`/admin/workers/${editingWorker.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Error al actualizar barbero');
        await loadData();
        showToast('Barbero actualizado exitosamente');
        return;
      } else {
        if (!isAdmin) { showToast('Solo el administrador puede crear barberos', 'error'); throw new Error('Solo el administrador puede crear barberos'); }
        const res = await apiFetch('/admin/workers', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.message || `Error al crear barbero (${res.status})`);
        }
        const newWorker = await res.json();
        await loadData();
        showToast('Barbero creado exitosamente');
        return { credentials: newWorker.credentials };
      }
    } catch (err: any) { showToast(err?.message || 'Error al guardar barbero', 'error'); throw err; }
  };

  const toggleBarberActive = async (worker: Worker) => {
    try {
      const res = await apiFetch(`/admin/workers/${worker.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !worker.is_active }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      await loadData();
      showToast(`Barbero ${worker.is_active ? 'desactivado' : 'activado'}`);
    } catch (err: any) { showToast(err?.message || 'Error al cambiar estado', 'error'); }
  };

  const deleteBarber = async (id: string) => {
    try {
      const res = await apiFetch(`/admin/workers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar barbero');
      await loadData();
      showToast('Barbero eliminado correctamente');
    } catch (err: any) { showToast(err?.message || 'Error al eliminar barbero', 'error'); throw err; }
  };

  const getOrResetBarberCredentials = async (workerId: string) => {
    try {
      const res = await apiFetch(`/admin/workers/${workerId}/credentials`, { method: 'POST' });
      if (!res.ok) throw new Error('Error al obtener credenciales');
      const data = await res.json();
      await loadData();
      showToast('Credenciales generadas correctamente');
      return data.credentials;
    } catch (err: any) { showToast(err?.message || 'Error al obtener credenciales', 'error'); throw err; }
  };

  const saveService = async (
    editingService: Service | null,
    data: { title: string; price: number; duration_minutes: number; description?: string; image_url?: string }
  ) => {
    try {
      if (editingService) {
        const res = await apiFetch(`/admin/services/${editingService.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Error al actualizar servicio');
        showToast('Servicio actualizado exitosamente');
      } else {
        const res = await apiFetch('/admin/services', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Error al crear servicio');
        showToast('Servicio creado exitosamente');
      }
      await loadData();
    } catch (err: any) { showToast(err?.message || 'Error al guardar servicio', 'error'); throw err; }
  };

  const toggleServiceActive = async (service: Service) => {
    try {
      const res = await apiFetch(`/admin/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !service.is_active }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      await loadData();
      showToast(`Servicio ${service.is_active ? 'desactivado' : 'activado'}`);
    } catch (err: any) { showToast(err?.message || 'Error al cambiar estado', 'error'); }
  };

  const deleteService = async (id: string) => {
    try {
      const res = await apiFetch(`/admin/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar servicio');
      await loadData();
      showToast('Servicio eliminado correctamente');
    } catch (err: any) { showToast(err?.message || 'Error al eliminar servicio', 'error'); throw err; }
  };

  const savePortfolioItem = async (data: { title: string; image_url: string; tags: string[] }) => {
    try {
      const res = await apiFetch('/admin/portfolio', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error al agregar foto');
      await loadData();
      showToast('Foto agregada al portafolio');
    } catch (err: any) { showToast(err?.message || 'Error al agregar foto', 'error'); throw err; }
  };

  const deletePortfolioItem = async (id: string) => {
    try {
      const res = await apiFetch(`/admin/portfolio/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar foto');
      await loadData();
      showToast('Foto eliminada del portafolio');
    } catch (err: any) { showToast(err?.message || 'Error al eliminar foto', 'error'); throw err; }
  };

  const saveSchedule = async (workerId: string, dayOfWeek: number, data: { start_time: string; end_time: string; is_active: boolean }) => {
    try {
      const res = await apiFetch(`/admin/schedules/worker/${workerId}/day/${dayOfWeek}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error al guardar horario');
      await loadData();
      showToast('Horario actualizado');
    } catch (err: any) { showToast(err?.message || 'Error al guardar horario', 'error'); throw err; }
  };

  const copyScheduleToWeek = async (workerId: string, baseDayOfWeek = 1) => {
    try {
      const res = await apiFetch(`/admin/schedules/worker/${workerId}/copy-week?baseDay=${baseDayOfWeek}`, { method: 'POST' });
      if (!res.ok) throw new Error('Error al copiar horario');
      await loadData();
      showToast('Horario copiado a lunes-sábado');
    } catch (err: any) { showToast(err?.message || 'Error al copiar horario', 'error'); }
  };

  const saveSettings = async (newSettings: Record<string, string>) => {
    if (!isAdmin) { showToast('Solo el administrador puede modificar la configuración', 'error'); throw new Error('Solo el administrador puede modificar la configuración'); }
    try {
      const res = await apiFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) throw new Error('Error al guardar configuración');
      const data = await res.json();
      setSettings(data.settings || {});
      if (data.business) setBusiness(data.business);
      showToast('Configuración guardada correctamente');
    } catch (err: any) { showToast(err?.message || 'Error al guardar configuración', 'error'); throw err; }
  };

  return {
    sessionLoading, isAuthenticated, userEmail, isAdmin, userRole, loading, toastMessage,
    queue, workers, services, portfolio, schedules, settings, business,
    masterBarber, collabBarbers, currentWorker,
    showToast, dismissToast, handleLogout,
    advanceQueue, addWalkInToQueue, removeQueueItem,
    saveBarber, toggleBarberActive, deleteBarber, getOrResetBarberCredentials,
    saveService, toggleServiceActive, deleteService,
    savePortfolioItem, deletePortfolioItem,
    saveSchedule, copyScheduleToWeek,
    saveSettings, refresh: () => { loadData(false); },
  };
}