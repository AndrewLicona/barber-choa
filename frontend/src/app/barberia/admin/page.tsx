// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarberiaNav } from '@/components/BarberiaNav';
import { getSupabase } from '@/lib/supabase/client';
import { getNestJSToken, getNestJSUser, nestJSLogout } from '@/lib/auth-context';
import { canManageBusiness } from '@/lib/access-control';
import { generateQueueAlertWhatsAppLink, formatCurrency } from '@/lib/whatsapp';
import { uploadMedia } from '@/lib/media-upload';
import { Worker, Service, LiveQueueItem, Schedule, PortfolioItem, DAY_NAMES } from '@/types/database';
import {
  Users, UserCheck, CheckCircle2, UserPlus, Phone, Shield, Scissors,
  Settings, LogOut, Plus, Clock, Edit2, Save, X, Trash2, ToggleLeft, ToggleRight,
  DollarSign, Tag, Timer, AlertCircle, Check, RefreshCw, Lock, Copy, Camera, Upload, Image as ImageIcon
} from 'lucide-react';

export default function BarberiaAdminPage() {
  const router = useRouter();
  const supabase = getSupabase();

  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'barbers' | 'services' | 'portfolio' | 'settings'>('queue');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ─── Datos de Barbería ────────────────────────────────────
  const [queue, setQueue] = useState<LiveQueueItem[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  // ─── Cola Forms ───────────────────────────────────────────
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [addingToQueue, setAddingToQueue] = useState(false);

  // ─── Barbero Forms ────────────────────────────────────────
  const [showBarberModal, setShowBarberModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [barberFormName, setBarberFormName] = useState('');
  const [barberFormPhone, setBarberFormPhone] = useState('');
  const [barberFormBio, setBarberFormBio] = useState('');
  const [barberFormAvatarUrl, setBarberFormAvatarUrl] = useState('');
  const [barberFormAcceptsAppts, setBarberFormAcceptsAppts] = useState(true);
  const [savingBarber, setSavingBarber] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ─── Servicio Forms ───────────────────────────────────────
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceFormTitle, setServiceFormTitle] = useState('');
  const [serviceFormPrice, setServiceFormPrice] = useState('');
  const [serviceFormDuration, setServiceFormDuration] = useState('30');
  const [serviceFormDesc, setServiceFormDesc] = useState('');
  const [serviceFormImageUrl, setServiceFormImageUrl] = useState('');
  const [uploadingServiceImage, setUploadingServiceImage] = useState(false);
  const [savingService, setSavingService] = useState(false);

  // ─── Portafolio Forms ─────────────────────────────────────
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioFormTitle, setPortfolioFormTitle] = useState('');
  const [portfolioFormImageUrl, setPortfolioFormImageUrl] = useState('');
  const [portfolioFormTags, setPortfolioFormTags] = useState('');
  const [uploadingPortfolioImage, setUploadingPortfolioImage] = useState(false);
  const [savingPortfolio, setSavingPortfolio] = useState(false);

  // ─── Horarios del barbero seleccionado ───────────────────
  const [selectedWorkerForSchedule, setSelectedWorkerForSchedule] = useState<Worker | null>(null);

  // ─── Configuración del negocio ───────────────────────────
  const [editSettings, setEditSettings] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // ─── Confirmación de borrado ─────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'worker' | 'service' | 'portfolio'; id: string; name: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => { setToastMessage(null); }, 4000);
  };

  // ══════════════════════════════════════════════════════════
  // VERIFICACIÓN ESTRICTA DE ACCESO (usa NestJS JWT)
  // ══════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════
  // CARGA DE DATOS EXCLUSIVOS DE BARBERÍA (filtrado por business_id)
  // ══════════════════════════════════════════════════════════
  const loadData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // 1. Resolver el business_id de Barber Choa
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'barberia')
        .maybeSingle();
      const barberiaBizId = bData?.id || 'f880f993-a1a6-4e43-aa44-cc7df98fbd57';

      // 2. Cargar datos filtrados por business_id
      const [queueRes, workersRes, servicesRes, settingsRes, portfolioRes] = await Promise.all([
        supabase.from('live_queue').select('*, worker:workers(name)').eq('business_id', barberiaBizId).in('status', ['WAITING', 'IN_SERVICE']).order('position'),
        supabase.from('workers').select('*').eq('business_id', barberiaBizId).order('created_at'),
        supabase.from('services').select('*').eq('business_id', barberiaBizId).order('created_at'),
        supabase.from('business_settings').select('*').eq('business_id', barberiaBizId),
        supabase.from('portfolio_items').select('*').eq('business_id', barberiaBizId).eq('is_active', true).order('created_at', { ascending: false }),
      ]);

      if (queueRes.data) setQueue(queueRes.data as LiveQueueItem[]);
      const loadedWorkers = (workersRes.data || []) as Worker[];
      setWorkers(loadedWorkers);
      if (servicesRes.data) setServices(servicesRes.data as Service[]);
      if (portfolioRes.data) setPortfolio(portfolioRes.data as PortfolioItem[]);
      if (settingsRes.data) {
        const map: Record<string, string> = {};
        (settingsRes.data as { key: string; value: string }[]).forEach(s => { map[s.key] = s.value; });
        setSettings(map);
        setEditSettings(map);
      }

      // 3. Cargar horarios solo de los trabajadores de esta barbería
      const workerIds = loadedWorkers.map(w => w.id);
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
  }, [supabase]);

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

    return () => { supabase.removeChannel(channel); };
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

  // ══════════════════════════════════════════════════════════
  // COLA EN VIVO
  // ══════════════════════════════════════════════════════════
  const inService = queue.find(q => q.status?.toLowerCase() === 'in_service');
  const waitingList = queue.filter(q => q.status?.toLowerCase() === 'waiting');

  const handleNextTurn = async () => {
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

  const handleAddWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    const masterBarber = workers.find(w => !w.accepts_appointments) || workers[0];
    if (!masterBarber) {
      showToast('Crea primero un barbero en la pestaña Barberos', 'error');
      return;
    }

    setAddingToQueue(true);
    try {
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'barberia')
        .maybeSingle();
      const barberiaBizId = bData?.id || 'f880f993-a1a6-4e43-aa44-cc7df98fbd57';

      const { error } = await supabase.from('live_queue').insert({
        business_id: barberiaBizId,
        worker_id: masterBarber.id,
        client_name: newClientName.trim(),
        client_phone: newClientPhone.trim() || null,
        status: inService ? 'WAITING' : 'IN_SERVICE',
        position: waitingList.length + 1,
        estimated_wait_minutes: waitingList.length * 25,
      });

      if (error) throw error;
      setNewClientName('');
      setNewClientPhone('');
      await loadData();
      showToast('Cliente añadido a la fila');
    } catch (err: any) {
      showToast(err?.message || 'Error al añadir turno', 'error');
    } finally {
      setAddingToQueue(false);
    }
  };

  const handleRemoveFromQueue = async (id: string) => {
    try {
      await supabase.from('live_queue').update({ status: 'CANCELLED' }).eq('id', id);
      await loadData();
      showToast('Turno retirado');
    } catch (err: any) {
      showToast(err?.message || 'Error al retirar turno', 'error');
    }
  };

  // ══════════════════════════════════════════════════════════
  // CRUD BARBEROS
  // ══════════════════════════════════════════════════════════
  const openBarberModal = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      setBarberFormName(worker.name);
      setBarberFormPhone(worker.phone);
      setBarberFormBio(worker.bio || '');
      setBarberFormAvatarUrl(worker.avatar_url || '');
      setBarberFormAcceptsAppts(worker.accepts_appointments);
    } else {
      setEditingWorker(null);
      setBarberFormName('');
      setBarberFormPhone('');
      setBarberFormBio('');
      setBarberFormAvatarUrl('');
      setBarberFormAcceptsAppts(true);
    }
    setShowBarberModal(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const token = getNestJSToken();
      if (!token) {
        showToast('Sesión expirada', 'error');
        return;
      }

      const publicUrl = await uploadMedia('avatars', file, token);
      setBarberFormAvatarUrl(publicUrl);
      showToast('Foto subida correctamente');
    } catch (err: any) {
      showToast(err.message || 'Error al subir foto', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberFormName.trim() || !barberFormPhone.trim()) {
      showToast('Ingresa el nombre y teléfono del barbero', 'error');
      return;
    }
    setSavingBarber(true);
    try {
      // Resolver business_id de Barber Choa
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'barberia')
        .maybeSingle();
      const barberiaBizId = bData?.id || '11111111-1111-1111-1111-111111111111';

      const updateData = {
        name: barberFormName.trim(),
        phone: barberFormPhone.trim(),
        bio: barberFormBio.trim() || null,
        accepts_appointments: barberFormAcceptsAppts,
        business_type: 'barberia',
        is_active: true,
        avatar_url: barberFormAvatarUrl.trim() || '/logo_barberchoa.jpg',
      };

      if (editingWorker) {
        const { error } = await supabase.from('workers').update(updateData).eq('id', editingWorker.id);
        if (error) throw error;
        showToast('Barbero actualizado exitosamente');
      } else {
        const insertData = { ...updateData, business_id: barberiaBizId };
        const { data: newW, error } = await supabase.from('workers').insert(insertData).select().single();
        if (error) throw error;

        // Crear horarios por defecto (Lunes a Sábado 9am - 6pm)
        if (newW) {
          const defaultSchedules = [1, 2, 3, 4, 5, 6].map(day => ({
            worker_id: newW.id,
            day_of_week: day,
            start_time: '09:00',
            end_time: '18:00',
            is_active: true
          }));
          await supabase.from('schedules').insert(defaultSchedules);
        }
        showToast('Barbero creado exitosamente');
      }
      setShowBarberModal(false);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar barbero', 'error');
    } finally {
      setSavingBarber(false);
    }
  };

  const handleToggleBarberActive = async (worker: Worker) => {
    try {
      await supabase.from('workers').update({ is_active: !worker.is_active }).eq('id', worker.id);
      await loadData();
      showToast(`Barbero ${worker.is_active ? 'desactivado' : 'activado'}`);
    } catch (err: any) {
      showToast(err?.message || 'Error al cambiar estado', 'error');
    }
  };

  const handleDeleteWorker = async (id: string) => {
    setDeletingItem(true);
    try {
      const { error } = await supabase.from('workers').delete().eq('id', id);
      if (error) throw error;
      setDeleteTarget(null);
      await loadData();
      showToast('Barbero eliminado correctamente');
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar barbero', 'error');
    } finally {
      setDeletingItem(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // CRUD SERVICIOS
  // ══════════════════════════════════════════════════════════
  const openServiceModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceFormTitle(service.title);
      setServiceFormPrice(String(service.price));
      setServiceFormDuration(String(service.duration_minutes || 30));
      setServiceFormDesc(service.description || '');
      setServiceFormImageUrl(service.image_url || '');
    } else {
      setEditingService(null);
      setServiceFormTitle('');
      setServiceFormPrice('');
      setServiceFormDuration('30');
      setServiceFormDesc('');
      setServiceFormImageUrl('');
    }
    setShowServiceModal(true);
  };

  const handleServiceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingServiceImage(true);
    try {
      const token = getNestJSToken();
      if (!token) {
        showToast('Sesión expirada', 'error');
        return;
      }

      const publicUrl = await uploadMedia('services', file, token);
      setServiceFormImageUrl(publicUrl);
      showToast('Imagen del servicio subida correctamente');
    } catch (err: any) {
      showToast(err.message || 'Error al subir imagen', 'error');
    } finally {
      setUploadingServiceImage(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormTitle.trim() || !serviceFormPrice) {
      showToast('Ingresa el nombre y precio del servicio', 'error');
      return;
    }
    setSavingService(true);
    try {
      // Resolver business_id de Barber Choa
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'barberia')
        .maybeSingle();
      const barberiaBizId = bData?.id || 'f880f993-a1a6-4e43-aa44-cc7df98fbd57';

      const updateData = {
        title: serviceFormTitle.trim(),
        price: Number(serviceFormPrice),
        duration_minutes: Number(serviceFormDuration) || 30,
        description: serviceFormDesc.trim() || null,
        image_url: serviceFormImageUrl.trim() || null,
        business_type: 'barberia',
        is_active: true,
      };

      if (editingService) {
        const { error } = await supabase.from('services').update(updateData).eq('id', editingService.id);
        if (error) throw error;
        showToast('Servicio actualizado exitosamente');
      } else {
        const insertData = { ...updateData, business_id: barberiaBizId };
        const { error } = await supabase.from('services').insert(insertData);
        if (error) throw error;
        showToast('Servicio creado exitosamente');
      }
      setShowServiceModal(false);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar servicio', 'error');
    } finally {
      setSavingService(false);
    }
  };

  const handleToggleServiceActive = async (service: Service) => {
    try {
      await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id);
      await loadData();
      showToast(`Servicio ${service.is_active ? 'desactivado' : 'activado'}`);
    } catch (err: any) {
      showToast(err?.message || 'Error al cambiar estado', 'error');
    }
  };

  const handleDeleteService = async (id: string) => {
    setDeletingItem(true);
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      setDeleteTarget(null);
      await loadData();
      showToast('Servicio eliminado correctamente');
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar servicio', 'error');
    } finally {
      setDeletingItem(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // CRUD PORTAFOLIO
  // ══════════════════════════════════════════════════════════
  const handlePortfolioImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPortfolioImage(true);
    try {
      const token = getNestJSToken();
      if (!token) {
        showToast('Sesión expirada', 'error');
        return;
      }

      const publicUrl = await uploadMedia('portfolio', file, token);
      setPortfolioFormImageUrl(publicUrl);
      showToast('Foto de portafolio subida correctamente');
    } catch (err: any) {
      showToast(err.message || 'Error al subir foto', 'error');
    } finally {
      setUploadingPortfolioImage(false);
    }
  };

  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioFormImageUrl.trim()) {
      showToast('Sube o ingresa una imagen para el portafolio', 'error');
      return;
    }
    setSavingPortfolio(true);
    try {
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'barberia')
        .maybeSingle();
      const barberiaBizId = bData?.id || 'f880f993-a1a6-4e43-aa44-cc7df98fbd57';

      const tagsArray = portfolioFormTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const { error } = await supabase.from('portfolio_items').insert({
        business_id: barberiaBizId,
        title: portfolioFormTitle.trim() || 'Trabajo Barber Choa',
        image_url: portfolioFormImageUrl.trim(),
        tags: tagsArray.length > 0 ? tagsArray : ['Barbería', 'Corte'],
        is_active: true,
      });

      if (error) throw error;
      showToast('Foto agregada al portafolio');
      setShowPortfolioModal(false);
      setPortfolioFormTitle('');
      setPortfolioFormImageUrl('');
      setPortfolioFormTags('');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar foto en portafolio', 'error');
    } finally {
      setSavingPortfolio(false);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    setDeletingItem(true);
    try {
      const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
      if (error) throw error;
      setDeleteTarget(null);
      await loadData();
      showToast('Foto eliminada del portafolio');
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar foto', 'error');
    } finally {
      setDeletingItem(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // HORARIOS
  // ══════════════════════════════════════════════════════════
  const getWorkerSchedules = (workerId: string) =>
    schedules.filter(s => s.worker_id === workerId);

  const handleToggleScheduleDay = async (workerId: string, dayOfWeek: number, existing?: Schedule) => {
    try {
      if (existing) {
        await supabase.from('schedules').update({ is_active: !existing.is_active }).eq('id', existing.id);
      } else {
        await supabase.from('schedules').insert({
          worker_id: workerId,
          day_of_week: dayOfWeek,
          start_time: '09:00',
          end_time: '18:00',
          is_active: true,
        });
      }
      await loadData();
      showToast('Horario actualizado');
    } catch (err: any) {
      showToast(err?.message || 'Error al modificar horario', 'error');
    }
  };

  const handleUpdateScheduleTime = async (scheduleId: string, field: 'start_time' | 'end_time', value: string) => {
    try {
      await supabase.from('schedules').update({ [field]: value }).eq('id', scheduleId);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error al actualizar hora', 'error');
    }
  };

  const handleCopyScheduleToWeek = async (worker: Worker) => {
    const workerScheds = getWorkerSchedules(worker.id);
    const mondaySched = workerScheds.find(s => s.day_of_week === 1) || { start_time: '09:00', end_time: '18:00' };

    try {
      for (let d = 1; d <= 6; d++) {
        const existing = workerScheds.find(s => s.day_of_week === d);
        if (existing) {
          await supabase.from('schedules').update({
            start_time: mondaySched.start_time,
            end_time: mondaySched.end_time,
            is_active: true,
          }).eq('id', existing.id);
        } else {
          await supabase.from('schedules').insert({
            worker_id: worker.id,
            day_of_week: d,
            start_time: mondaySched.start_time,
            end_time: mondaySched.end_time,
            is_active: true,
          });
        }
      }
      await loadData();
      showToast(`Horario aplicado de Lunes a Sábado para ${worker.name}`);
    } catch (err: any) {
      showToast(err?.message || 'Error al replicar horario', 'error');
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const updates = Object.entries(editSettings).map(([key, value]) =>
        supabase.from('business_settings').upsert({ key, value }, { onConflict: 'key' })
      );
      await Promise.all(updates);
      setSettings({ ...editSettings });
      showToast('Configuración guardada correctamente');
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar configuración', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">Verificando acceso a Barbería Choa...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4 text-white">
        <div className="max-w-sm w-full bg-[#121216] border border-rose-500/30 p-6 rounded-2xl text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-lg font-bold font-luxury">Acceso Protegido Barber Choa</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Inicia sesión con la contraseña de administrador de Barbería Choa.
          </p>
          <button
            onClick={() => router.push('/barberia/login')}
            className="w-full py-2.5 rounded-xl gold-button text-xs font-bold uppercase tracking-wider"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#08080a] text-zinc-100">
      <BarberiaNav />

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl transition-all animate-bounce ${
          toastMessage.type === 'success'
            ? 'bg-[#121216] border-emerald-500/40 text-emerald-300'
            : 'bg-[#121216] border-rose-500/40 text-rose-300'
        }`}>
          {toastMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span className="text-xs font-medium">{toastMessage.text}</span>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Header Barber Choa */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden ring-1 ring-[#d4af37]/40 shadow-xl bg-black flex-shrink-0">
              <img
                src="/logo_barberchoa.jpg"
                alt="Barber Choa"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/25 text-[#d4af37] text-[10px] font-mono uppercase tracking-widest mb-1">
                <Scissors className="w-3 h-3" />
                <span>Panel Exclusivo Barber Choa</span>
              </div>
              <h1 className="font-luxury text-2xl sm:text-3xl font-bold uppercase text-white tracking-tight">
                Gestión de Barbería
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Sesión: <span className="text-[#f3e5ab] font-mono">{userEmail}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white py-2 px-3 rounded-lg border border-white/5 bg-white/5 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refrescar</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-rose-400 py-2 px-3 rounded-lg border border-white/5 bg-white/5 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Tabs Barbería */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 overflow-x-auto scrollbar-none">
          {([
            { key: 'queue', icon: <Clock className="w-4 h-4" />, label: `Turnos en Vivo (${queue.length})` },
            { key: 'barbers', icon: <Scissors className="w-4 h-4" />, label: `Barberos & Horarios (${workers.length})` },
            { key: 'services', icon: <Tag className="w-4 h-4" />, label: `Cortes & Barba (${services.length})` },
            { key: 'portfolio', icon: <Camera className="w-4 h-4" />, label: `Portafolio (${portfolio.length})` },
            { key: 'settings', icon: <Settings className="w-4 h-4" />, label: 'Configuración' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab.key
                ? 'bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f3e5ab]'
                : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ═══════════════ TAB: COLA EN VIVO ═══════════════ */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#d4af37]/30 bg-[#121216] p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl gold-button flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#d4af37] block">En el sillón ahora:</span>
                    <h3 className="text-xl font-bold text-white">{inService ? inService.client_name : 'Sillón Disponible'}</h3>
                    {inService?.client_phone && (
                      <a href={`https://wa.me/${inService.client_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-400 font-mono hover:underline">📞 {inService.client_phone}</a>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleNextTurn}
                  disabled={!inService && waitingList.length === 0}
                  className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{inService ? 'Finalizar y Siguiente' : 'Iniciar Siguiente'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formulario Agregar Cliente */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#121216] p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#d4af37]" />
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold">
                    Añadir Turno Manual
                  </h3>
                </div>
                <form onSubmit={handleAddWalkIn} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Nombre del Cliente *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Carlos Ramírez"
                      value={newClientName}
                      onChange={e => setNewClientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">WhatsApp del Cliente</label>
                    <input
                      type="tel"
                      placeholder="+57 300 123 4567"
                      value={newClientPhone}
                      onChange={e => setNewClientPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingToQueue}
                    className="w-full py-2.5 rounded-xl gold-button text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{addingToQueue ? 'Añadiendo...' : 'Añadir a la Fila'}</span>
                  </button>
                </form>
              </div>

              {/* Lista de Espera */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#121216] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#d4af37]" />
                    <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold">
                      En Espera ({waitingList.length})
                    </h3>
                  </div>
                </div>

                {waitingList.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-white/[0.06] rounded-xl">
                    <p className="text-xs text-zinc-500">No hay clientes esperando en el sillón.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {waitingList.map((item, idx) => (
                      <div key={item.id} className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f3e5ab] text-xs font-mono font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-white">{item.client_name}</p>
                            {item.client_phone && (
                              <p className="text-[10px] text-zinc-400 font-mono">{item.client_phone}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {item.client_phone && (
                            <a
                              href={generateQueueAlertWhatsAppLink({
                                clientPhone: item.client_phone,
                                clientName: item.client_name,
                                position: idx + 1,
                                barberName: item.worker?.name || workers.find(w => w.id === item.worker_id)?.name || 'Barber Choa',
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                              title="Avisar por WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleRemoveFromQueue(item.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                            title="Quitar de la cola"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ TAB: BARBEROS Y HORARIOS ═══════════════ */}
        {activeTab === 'barbers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  Barberos Oficiales ({workers.length})
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Gestiona el equipo de Barber Choa y sus horarios de disponibilidad.
                </p>
              </div>
              <button
                onClick={() => openBarberModal()}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl gold-button text-xs font-bold uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Barbero</span>
              </button>
            </div>

            {workers.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-white/[0.07] bg-black/20">
                <Scissors className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 font-semibold">No hay barberos registrados</p>
                <p className="text-xs text-zinc-500 mt-1">Crea el primer perfil con el botón &quot;Nuevo Barbero&quot;.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {workers.map(worker => {
                  const isExpanded = selectedWorkerForSchedule?.id === worker.id;
                  const workerSchedules = getWorkerSchedules(worker.id);

                  return (
                    <div key={worker.id} className="rounded-2xl bg-[#121216] border border-white/[0.07] overflow-hidden">
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={worker.avatar_url || '/logo_barberchoa.jpg'}
                            alt={worker.name}
                            className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 flex-shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-white">{worker.name}</h4>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                                worker.accepts_appointments
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : 'bg-[#d4af37]/10 text-[#f3e5ab] border-[#d4af37]/30'
                              }`}>
                                {worker.accepts_appointments ? 'Cita Previa' : 'Turno en Vivo (Sillón)'}
                              </span>
                              {!worker.is_active && (
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap font-mono">
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Phone className="w-3 h-3" />
                                {worker.phone || 'Sin teléfono'}
                              </span>
                              {worker.bio && (
                                <span className="text-zinc-500 text-[11px] font-sans">
                                  {worker.bio}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => openBarberModal(worker)}
                            className="p-2 rounded-lg bg-white/5 text-zinc-300 hover:text-white border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1 text-xs"
                            title="Editar Datos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                          <button
                            onClick={() => setSelectedWorkerForSchedule(isExpanded ? null : worker)}
                            className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                              isExpanded
                                ? 'bg-[#d4af37]/20 border-[#d4af37]/40 text-[#f3e5ab]'
                                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                            }`}
                            title="Gestionar Horario"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{isExpanded ? 'Ocultar Horario' : 'Gestionar Horario'}</span>
                          </button>
                          <button
                            onClick={() => handleToggleBarberActive(worker)}
                            className="p-2 rounded-lg bg-white/5 text-zinc-300 hover:text-white border border-white/10 hover:bg-white/10 transition-colors"
                            title={worker.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {worker.is_active ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-zinc-600" />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'worker', id: worker.id, name: worker.name })}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                            title="Eliminar Barbero"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Horarios Desplegables */}
                      {isExpanded && (
                        <div className="border-t border-white/[0.06] p-4 sm:p-5 bg-black/40 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
                                Horario de Disponibilidad: {worker.name}
                              </p>
                              <span className="text-[11px] text-zinc-400">
                                Activa los días y horas de atención en la barbería.
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopyScheduleToWeek(worker)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                              title="Copiar horario del lunes de Lunes a Sábado"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Aplicar a toda la semana</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6, 0].map(day => {
                              const existing = workerSchedules.find(s => s.day_of_week === day);
                              const isActive = existing?.is_active ?? false;

                              return (
                                <div
                                  key={day}
                                  className={`p-3.5 rounded-xl border transition-all ${
                                    isActive
                                      ? 'bg-[#d4af37]/8 border-[#d4af37]/35'
                                      : 'bg-black/50 border-white/[0.05] opacity-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-white uppercase">{DAY_NAMES[day]}</span>
                                    <button onClick={() => handleToggleScheduleDay(worker.id, day, existing)} className="transition-colors">
                                      {isActive
                                        ? <ToggleRight className="w-5 h-5 text-[#d4af37]" />
                                        : <ToggleLeft className="w-5 h-5 text-zinc-600" />}
                                    </button>
                                  </div>
                                  {isActive && existing && (
                                    <div className="space-y-1.5 mt-2">
                                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                                        <span>Entrada</span>
                                        <span>Salida</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <select
                                          value={existing.start_time}
                                          onChange={e => handleUpdateScheduleTime(existing.id, 'start_time', e.target.value)}
                                          className="flex-1 px-2 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#d4af37] appearance-none cursor-pointer"
                                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' fill='%23d4af37'%3E%3Cpath d='M0 0l4 5 4-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                                        >
                                          {Array.from({ length: 28 }, (_, i) => {
                                            const h = Math.floor(i / 2) + 6;
                                            const m = (i % 2) * 30;
                                            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                                          }).map(t => (
                                            <option key={t} value={t} style={{ background: '#121216' }}>{t}</option>
                                          ))}
                                        </select>
                                        <span className="text-zinc-500 text-xs">—</span>
                                        <select
                                          value={existing.end_time}
                                          onChange={e => handleUpdateScheduleTime(existing.id, 'end_time', e.target.value)}
                                          className="flex-1 px-2 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#d4af37] appearance-none cursor-pointer"
                                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' fill='%23d4af37'%3E%3Cpath d='M0 0l4 5 4-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                                        >
                                          {Array.from({ length: 28 }, (_, i) => {
                                            const h = Math.floor(i / 2) + 6;
                                            const m = (i % 2) * 30;
                                            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                                          }).map(t => (
                                            <option key={t} value={t} style={{ background: '#121216' }}>{t}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                  {!isActive && (
                                    <p className="text-[11px] text-zinc-500 font-mono mt-1">Día de Descanso</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ TAB: SERVICIOS DE BARBERÍA ═══════════════ */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  Catálogo de Cortes & Barba ({services.length})
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Precios y duraciones reflejados en la carta de Barber Choa.
                </p>
              </div>
              <button
                onClick={() => openServiceModal()}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl gold-button text-xs font-bold uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Servicio</span>
              </button>
            </div>

            {services.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-white/[0.07] bg-black/20">
                <Tag className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 font-semibold">No hay servicios registrados en Barber Choa</p>
                <p className="text-xs text-zinc-500 mt-1">Agrega tu primer corte con el botón &quot;Nuevo Servicio&quot;.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {services.map(service => (
                  <div
                    key={service.id}
                    className={`rounded-2xl bg-[#121216] border p-4 flex flex-col justify-between gap-3 ${
                      service.is_active ? 'border-white/[0.07]' : 'border-rose-500/20 opacity-60'
                    }`}
                  >
                    <div>
                      {service.image_url && (
                        <div className="w-full h-32 rounded-xl overflow-hidden mb-2.5 bg-black/40 border border-white/5">
                          <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white leading-snug">{service.title}</h4>
                        {!service.is_active && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20 flex-shrink-0">
                            INACTIVO
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{service.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/[0.05] pt-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-0.5 text-xs text-[#f3e5ab] font-bold font-mono">
                          {formatCurrency(service.price)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                          <Timer className="w-3 h-3 text-zinc-500" />
                          {service.duration_minutes} min
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openServiceModal(service)}
                          className="p-1.5 rounded-lg bg-white/5 text-zinc-300 hover:text-white border border-white/10 hover:bg-white/10 transition-colors"
                          title="Editar Servicio"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleServiceActive(service)}
                          className="p-1.5 rounded-lg bg-white/5 text-zinc-300 hover:text-white border border-white/10 hover:bg-white/10 transition-colors"
                          title={service.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {service.is_active ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-zinc-600" />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'service', id: service.id, name: service.title })}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                          title="Eliminar Servicio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ TAB: PORTAFOLIO BARBERÍA ═══════════════ */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  Galería & Portafolio ({portfolio.length})
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Fotos de cortes y trabajos destacados que verán los clientes en la web.
                </p>
              </div>
              <button
                onClick={() => {
                  setPortfolioFormTitle('');
                  setPortfolioFormImageUrl('');
                  setPortfolioFormTags('');
                  setShowPortfolioModal(true);
                }}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl gold-button text-xs font-bold uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Foto</span>
              </button>
            </div>

            {portfolio.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-white/[0.07] bg-black/20">
                <Camera className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 font-semibold">No hay fotos en el portafolio</p>
                <p className="text-xs text-zinc-500 mt-1">Sube fotos de tus mejores degradados o barbas con el botón &quot;Añadir Foto&quot;.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {portfolio.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl overflow-hidden bg-[#121216] border border-white/[0.08] flex flex-col"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-black/40">
                      <img
                        src={item.image_url}
                        alt={item.title || 'Trabajo Barber Choa'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                      
                      {/* Botón eliminar */}
                      <button
                        onClick={() => setDeleteTarget({ type: 'portfolio', id: item.id, name: item.title || 'Foto de portafolio' })}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600/90 text-zinc-300 hover:text-white border border-white/10 transition-colors shadow-lg"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Info en la foto */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5">
                        <p className="text-xs font-bold text-white truncate">{item.title || 'Corte Barber Choa'}</p>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/10">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ TAB: CONFIGURACIÓN BARBERÍA ═══════════════ */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Configuración: Barber Choa Studio
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Datos de contacto oficiales de la Barbería.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/[0.07] space-y-4">
              {[
                { key: 'owner_phone', label: 'Teléfono WhatsApp Barber Choa', placeholder: '+573001234567', type: 'tel' },
                { key: 'business_name', label: 'Nombre del Local', placeholder: 'Barber Choa Studio', type: 'text' },
                { key: 'business_address', label: 'Dirección Física', placeholder: 'Calle 45 #23-10', type: 'text' },
                { key: 'instagram_url', label: 'Instagram Oficial', placeholder: 'https://instagram.com/barberchoa', type: 'url' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={editSettings[key] || ''}
                    onChange={e => setEditSettings(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37] transition-colors font-mono"
                  />
                </div>
              ))}

              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full py-3 rounded-xl gold-button text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-4 shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'Guardando...' : 'Guardar Configuración'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════ MODAL: BARBERO ═══════════════ */}
      {showBarberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121216] border border-[#d4af37]/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-luxury">
                {editingWorker ? 'Editar Barbero' : 'Nuevo Barbero (Barber Choa)'}
              </h3>
              <button onClick={() => setShowBarberModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBarber} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: David Choa"
                  value={barberFormName}
                  onChange={e => setBarberFormName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="+573001234567"
                  value={barberFormPhone}
                  onChange={e => setBarberFormPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37] font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">Especialidad o Bio corta</label>
                <input
                  type="text"
                  placeholder="Ej: Experto en degradados y toalla caliente"
                  value={barberFormBio}
                  onChange={e => setBarberFormBio(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">Foto de Perfil</label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={barberFormAvatarUrl || '/logo_barberchoa.jpg'} 
                      alt="Vista previa" 
                      className="h-14 w-14 rounded-xl object-cover ring-2 ring-[#d4af37]/30" 
                    />
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                        <Upload className="w-5 h-5 text-[#d4af37] animate-pulse" />
                      </div>
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp" 
                      onChange={handleAvatarUpload} 
                      className="hidden" 
                      disabled={uploadingAvatar}
                    />
                    <span className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f3e5ab] text-xs font-semibold hover:bg-[#d4af37]/25 transition-colors">
                      <Camera className="w-4 h-4" />
                      {uploadingAvatar ? 'Subiendo...' : 'Elegir Foto'}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">JPG, PNG o WebP. Máx 5MB.</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="accepts_appts_barber"
                  checked={barberFormAcceptsAppts}
                  onChange={e => setBarberFormAcceptsAppts(e.target.checked)}
                  className="w-4 h-4 accent-[#d4af37]"
                />
                <label htmlFor="accepts_appts_barber" className="text-xs text-zinc-300 cursor-pointer">
                  Acepta citas agendadas con reserva previa
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBarberModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingBarber}
                  className="flex-1 py-2.5 rounded-xl gold-button text-xs font-bold uppercase tracking-wider"
                >
                  {savingBarber ? 'Guardando...' : editingWorker ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: SERVICIO ═══════════════ */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121216] border border-[#d4af37]/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-luxury">
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio de Barbería'}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Corte Clásico & Barba Ritual"
                  value={serviceFormTitle}
                  onChange={e => setServiceFormTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">Precio (COP) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={serviceFormPrice}
                    onChange={e => setServiceFormPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">Duración (min) *</label>
                  <input
                    type="number"
                    required
                    placeholder="30"
                    value={serviceFormDuration}
                    onChange={e => setServiceFormDuration(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">Descripción</label>
                <textarea
                  placeholder="Qué incluye este corte o servicio..."
                  value={serviceFormDesc}
                  onChange={e => setServiceFormDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37] resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">Foto del Servicio (Opcional)</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/60 border border-white/10 flex-shrink-0 flex items-center justify-center relative">
                    {serviceFormImageUrl ? (
                      <img src={serviceFormImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Scissors className="w-5 h-5 text-zinc-600" />
                    )}
                    {uploadingServiceImage && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                        <Upload className="w-4 h-4 text-[#d4af37] animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleServiceImageUpload}
                        className="hidden"
                        disabled={uploadingServiceImage}
                      />
                      <span className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f3e5ab] text-xs font-semibold hover:bg-[#d4af37]/25 transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                        {uploadingServiceImage ? 'Subiendo...' : 'Subir Foto'}
                      </span>
                    </label>
                    <input
                      type="url"
                      placeholder="O pega URL de la foto..."
                      value={serviceFormImageUrl}
                      onChange={e => setServiceFormImageUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-[11px] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingService || uploadingServiceImage}
                  className="flex-1 py-2.5 rounded-xl gold-button text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {savingService ? 'Guardando...' : editingService ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: PORTAFOLIO ═══════════════ */}
      {showPortfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121216] border border-[#d4af37]/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-luxury">Añadir Foto al Portafolio</h3>
              <button onClick={() => setShowPortfolioModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePortfolio} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">Título / Estilo del Trabajo</label>
                <input
                  type="text"
                  placeholder="Ej: Fade Medio con Barba Perfilada"
                  value={portfolioFormTitle}
                  onChange={e => setPortfolioFormTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">Foto del Corte / Trabajo *</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0 flex items-center justify-center relative">
                    {portfolioFormImageUrl ? (
                      <img src={portfolioFormImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-zinc-600" />
                    )}
                    {uploadingPortfolioImage && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                        <Upload className="w-4 h-4 text-[#d4af37] animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePortfolioImageUpload}
                        className="hidden"
                        disabled={uploadingPortfolioImage}
                      />
                      <span className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f3e5ab] text-xs font-semibold hover:bg-[#d4af37]/25 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingPortfolioImage ? 'Subiendo...' : 'Subir desde dispositivo'}
                      </span>
                    </label>
                    <input
                      type="url"
                      placeholder="O pega URL de la imagen..."
                      value={portfolioFormImageUrl}
                      onChange={e => setPortfolioFormImageUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-[11px] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-300 mb-1">Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  placeholder="Ej: Fade, Barba, Clásico, Freestyle"
                  value={portfolioFormTags}
                  onChange={e => setPortfolioFormTags(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPortfolioModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPortfolio || uploadingPortfolioImage || !portfolioFormImageUrl.trim()}
                  className="flex-1 py-2.5 rounded-xl gold-button text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {savingPortfolio ? 'Guardando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: CONFIRMAR ELIMINACIÓN ═══════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#121216] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-white font-luxury">
              ¿Eliminar {deleteTarget.type === 'worker' ? 'Barbero' : deleteTarget.type === 'service' ? 'Servicio' : 'Foto del Portafolio'}?
            </h3>
            <p className="text-xs text-zinc-400">
              Vas a eliminar <span className="font-bold text-white">&quot;{deleteTarget.name}&quot;</span> de Barbería Choa.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deletingItem}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (deleteTarget.type === 'worker') handleDeleteWorker(deleteTarget.id);
                  else if (deleteTarget.type === 'service') handleDeleteService(deleteTarget.id);
                  else if (deleteTarget.type === 'portfolio') handleDeletePortfolio(deleteTarget.id);
                }}
                disabled={deletingItem}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-600/30"
              >
                {deletingItem ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
