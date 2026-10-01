// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import { getNestJSToken, getNestJSUser, nestJSLogout } from '@/lib/auth-context';
import { Worker, Service, LiveQueueItem, Schedule, PortfolioItem } from '@/types/database';
import { ToastData } from '@/components/ui/Toast';

export function useBarberiaAdmin() {
  const router = useRouter();
  const supabase = getSupabase();

  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastData | null>(null);

  // Data states
  const [queue, setQueue] = useState<LiveQueueItem[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // 1. Auth check
  useEffect(() => {
    const checkAuth = () => {
      const token = getNestJSToken();
      const user = getNestJSUser();
      if (!token || !user) {
        setIsAuthenticated(false);
        router.replace('/barberia/login');
      } else {
        setIsAuthenticated(true);
        setUserEmail(user.email || 'Administrador Barbería');
      }
      setSessionLoading(false);
    };

    checkAuth();
  }, [router]);

  // 2. Load admin data
  const loadData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'barberia')
        .maybeSingle();
      const barberiaBizId = bData?.id || 'f880f993-a1a6-4e43-aa44-cc7df98fbd57';

      const [queueRes, workersRes, servicesRes, settingsRes, portfolioRes] = await Promise.all([
        supabase
          .from('live_queue')
          .select('*, worker:workers(name)')
          .eq('business_id', barberiaBizId)
          .in('status', ['WAITING', 'IN_SERVICE'])
          .order('position'),
        supabase.from('workers').select('*').eq('business_id', barberiaBizId).order('created_at'),
        supabase.from('services').select('*').eq('business_id', barberiaBizId).order('created_at'),
        supabase.from('business_settings').select('*').eq('business_id', barberiaBizId),
        supabase
          .from('portfolio_items')
          .select('*')
          .eq('business_id', barberiaBizId)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);

      if (queueRes.data) setQueue(queueRes.data as LiveQueueItem[]);
      const loadedWorkers = (workersRes.data || []) as Worker[];
      setWorkers(loadedWorkers);
      if (servicesRes.data) setServices(servicesRes.data as Service[]);
      if (portfolioRes.data) setPortfolio(portfolioRes.data as PortfolioItem[]);
      if (settingsRes.data) {
        const map: Record<string, string> = {};
        (settingsRes.data as { key: string; value: string }[]).forEach((s) => {
          map[s.key] = s.value;
        });
        setSettings(map);
      }

      const workerIds = loadedWorkers.map((w) => w.id);
      if (workerIds.length > 0) {
        const { data: schData } = await supabase
          .from('schedules')
          .select('*')
          .in('worker_id', workerIds)
          .order('day_of_week');
        setSchedules((schData || []) as Schedule[]);
      } else {
        setSchedules([]);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error al conectar con la base de datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => {
    if (!supabase || !isAuthenticated) return;
    loadData();

    const channel = supabase
      .channel('barberia-admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_queue' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_items' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, loadData, supabase]);

  const handleLogout = async () => {
    try {
      nestJSLogout();
    } catch (e) {
      console.error(e);
    } finally {
      router.push('/barberia/login');
    }
  };

  // 3. Queue handlers
  const advanceQueue = async () => {
    if (!supabase) return;
    const inService = queue.find((q) => q.status?.toLowerCase() === 'in_service');
    const waitingList = queue.filter((q) => q.status?.toLowerCase() === 'waiting');

    try {
      if (inService) {
        await supabase.from('live_queue').update({ status: 'FINISHED' }).eq('id', inService.id);
      }
      if (waitingList.length > 0) {
        await supabase.from('live_queue').update({ status: 'IN_SERVICE' }).eq('id', waitingList[0].id);
      }
      await loadData();
      showToast('Turno avanzado correctamente');
    } catch (err: any) {
      showToast(err?.message || 'Error al avanzar turno', 'error');
    }
  };

  const addWalkInToQueue = async (name: string, phone?: string) => {
    if (!supabase) return;
    const masterBarber = workers.find((w) => !w.accepts_appointments) || workers[0];
    if (!masterBarber) {
      showToast('Crea primero un barbero en la pestaña Barberos', 'error');
      return;
    }

    try {
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'barberia')
        .maybeSingle();
      const barberiaBizId = bData?.id || 'f880f993-a1a6-4e43-aa44-cc7df98fbd57';

      const inService = queue.find((q) => q.status?.toLowerCase() === 'in_service');
      const waitingList = queue.filter((q) => q.status?.toLowerCase() === 'waiting');

      const { error } = await supabase.from('live_queue').insert({
        business_id: barberiaBizId,
        worker_id: masterBarber.id,
        client_name: name.trim(),
        client_phone: phone?.trim() || null,
        status: inService ? 'WAITING' : 'IN_SERVICE',
        position: waitingList.length + 1,
        estimated_wait_minutes: waitingList.length * 25,
      });

      if (error) throw error;
      await loadData();
      showToast('Cliente añadido a la fila');
    } catch (err: any) {
      showToast(err?.message || 'Error al añadir turno', 'error');
    }
  };

  const removeQueueItem = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('live_queue').update({ status: 'CANCELLED' }).eq('id', id);
      await loadData();
      showToast('Turno retirado');
    } catch (err: any) {
      showToast(err?.message || 'Error al retirar turno', 'error');
    }
  };

  // 4. Barber handlers
  const saveBarber = async (
    editingWorker: Worker | null,
    data: {
      name: string;
      phone: string;
      bio?: string;
      avatar_url?: string;
      accepts_appointments: boolean;
    },
  ) => {
    if (!supabase) return;
    try {
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'barberia')
        .maybeSingle();
      const barberiaBizId = bData?.id || '11111111-1111-1111-1111-111111111111';

      const payload = {
        name: data.name.trim(),
        phone: data.phone.trim(),
        bio: data.bio?.trim() || null,
        accepts_appointments: data.accepts_appointments,
        business_type: 'barberia',
        is_active: true,
        avatar_url: data.avatar_url?.trim() || '/logo_barberchoa.jpg',
      };

      if (editingWorker) {
        const { error } = await supabase.from('workers').update(payload).eq('id', editingWorker.id);
        if (error) throw error;
        showToast('Barbero actualizado exitosamente');
      } else {
        const insertPayload = { ...payload, business_id: barberiaBizId };
        const { data: newW, error } = await supabase
          .from('workers')
          .insert(insertPayload)
          .select()
          .single();
        if (error) throw error;

        if (newW) {
          const defaultSchedules = [1, 2, 3, 4, 5, 6].map((day) => ({
            worker_id: newW.id,
            day_of_week: day,
            start_time: '09:00',
            end_time: '18:00',
            is_active: true,
          }));
          await supabase.from('schedules').insert(defaultSchedules);
        }
        showToast('Barbero creado exitosamente');
      }
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar barbero', 'error');
      throw err;
    }
  };

  const toggleBarberActive = async (worker: Worker) => {
    if (!supabase) return;
    try {
      await supabase.from('workers').update({ is_active: !worker.is_active }).eq('id', worker.id);
      await loadData();
      showToast(`Barbero ${worker.is_active ? 'desactivado' : 'activado'}`);
    } catch (err: any) {
      showToast(err?.message || 'Error al cambiar estado', 'error');
    }
  };

  const deleteBarber = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('workers').delete().eq('id', id);
      if (error) throw error;
      await loadData();
      showToast('Barbero eliminado correctamente');
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar barbero', 'error');
      throw err;
    }
  };

  // 5. Service handlers
  const saveService = async (
    editingService: Service | null,
    data: {
      title: string;
      price: number;
      duration_minutes: number;
      description?: string;
      image_url?: string;
    },
  ) => {
    if (!supabase) return;
    try {
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'barberia')
        .maybeSingle();
      const barberiaBizId = bData?.id || 'f880f993-a1a6-4e43-aa44-cc7df98fbd57';

      const payload = {
        title: data.title.trim(),
        price: data.price,
        duration_minutes: data.duration_minutes,
        description: data.description?.trim() || null,
        image_url: data.image_url?.trim() || null,
        business_type: 'barberia',
        is_active: true,
      };

      if (editingService) {
        const { error } = await supabase.from('services').update(payload).eq('id', editingService.id);
        if (error) throw error;
        showToast('Servicio actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('services')
          .insert({ ...payload, business_id: barberiaBizId });
        if (error) throw error;
        showToast('Servicio creado exitosamente');
      }
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar servicio', 'error');
      throw err;
    }
  };

  const toggleServiceActive = async (service: Service) => {
    if (!supabase) return;
    try {
      await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id);
      await loadData();
      showToast(`Servicio ${service.is_active ? 'desactivado' : 'activado'}`);
    } catch (err: any) {
      showToast(err?.message || 'Error al cambiar estado', 'error');
    }
  };

  const deleteService = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      await loadData();
      showToast('Servicio eliminado correctamente');
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar servicio', 'error');
      throw err;
    }
  };

  // 6. Portfolio handlers
  const savePortfolioItem = async (data: {
    title: string;
    image_url: string;
    tags: string[];
  }) => {
    if (!supabase) return;
    try {
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'barberia')
        .maybeSingle();
      const barberiaBizId = bData?.id || 'f880f993-a1a6-4e43-aa44-cc7df98fbd57';

      const { error } = await supabase.from('portfolio_items').insert({
        business_id: barberiaBizId,
        title: data.title.trim() || 'Trabajo Barber Choa',
        image_url: data.image_url.trim(),
        tags: data.tags,
        is_active: true,
      });

      if (error) throw error;
      await loadData();
      showToast('Foto agregada al portafolio');
    } catch (err: any) {
      showToast(err?.message || 'Error al agregar foto', 'error');
      throw err;
    }
  };

  const deletePortfolioItem = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
      if (error) throw error;
      await loadData();
      showToast('Foto eliminada del portafolio');
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar foto', 'error');
      throw err;
    }
  };

  // 7. Schedule handlers
  const saveSchedule = async (
    workerId: string,
    dayOfWeek: number,
    data: { start_time: string; end_time: string; is_active: boolean },
  ) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('schedules').upsert(
        {
          worker_id: workerId,
          day_of_week: dayOfWeek,
          start_time: data.start_time,
          end_time: data.end_time,
          is_active: data.is_active,
        },
        { onConflict: 'worker_id,day_of_week' },
      );
      if (error) throw error;
      await loadData();
      showToast('Horario actualizado');
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar horario', 'error');
      throw err;
    }
  };

  const copyScheduleToWeek = async (workerId: string, baseDayOfWeek = 1) => {
    if (!supabase) return;
    try {
      const base = schedules.find(
        (s) => s.worker_id === workerId && s.day_of_week === baseDayOfWeek,
      );
      if (!base) {
        showToast('Configura primero el horario base del lunes', 'error');
        return;
      }

      const weekUpdates = [1, 2, 3, 4, 5, 6].map((day) => ({
        worker_id: workerId,
        day_of_week: day,
        start_time: base.start_time,
        end_time: base.end_time,
        is_active: base.is_active,
      }));

      const { error } = await supabase
        .from('schedules')
        .upsert(weekUpdates, { onConflict: 'worker_id,day_of_week' });
      if (error) throw error;
      await loadData();
      showToast('Horario copiado a lunes-sábado');
    } catch (err: any) {
      showToast(err?.message || 'Error al copiar horario', 'error');
    }
  };

  // 8. Settings handler
  const saveSettings = async (newSettings: Record<string, string>) => {
    if (!supabase) return;
    try {
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'barberia')
        .maybeSingle();
      const barberiaBizId = bData?.id || 'f880f993-a1a6-4e43-aa44-cc7df98fbd57';

      const updates = Object.entries(newSettings).map(([key, value]) => ({
        business_id: barberiaBizId,
        key,
        value,
      }));

      const { error } = await supabase
        .from('business_settings')
        .upsert(updates, { onConflict: 'business_id,key' });
      if (error) throw error;
      setSettings(newSettings);
      showToast('Configuración guardada correctamente');
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar configuración', 'error');
      throw err;
    }
  };

  return {
    // States
    sessionLoading,
    isAuthenticated,
    userEmail,
    loading,
    toastMessage,
    queue,
    workers,
    services,
    portfolio,
    schedules,
    settings,

    // Actions
    showToast,
    dismissToast: () => setToastMessage(null),
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
    refresh: loadData,
  };
}
