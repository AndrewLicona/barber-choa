// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ManicuraNav } from '@/components/ManicuraNav';
import { getSupabase } from '@/lib/supabase/client';
import { canManageBusiness } from '@/lib/access-control';
import { formatCurrency } from '@/lib/whatsapp';
import { uploadMedia } from '@/lib/media-upload';
import { Worker, Service, Schedule, DAY_NAMES } from '@/types/database';
import {
  Users, UserCheck, CheckCircle2, UserPlus, Phone, Shield, Sparkles,
  Settings, LogOut, Plus, Clock, Edit2, Save, X, Trash2, ToggleLeft, ToggleRight,
  DollarSign, Tag, Timer, AlertCircle, Check, RefreshCw, Lock, Calendar, Heart, Camera, Upload
} from 'lucide-react';

export default function ManicuraAdminPage() {
  const router = useRouter();
  const supabase = getSupabase();

  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointments' | 'manicuristas' | 'services' | 'settings'>('manicuristas');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ─── Datos de LM Nails ────────────────────────────────────
  const [appointments, setAppointments] = useState<any[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  // ─── Manicurista Forms ────────────────────────────────────
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerFormName, setWorkerFormName] = useState('');
  const [workerFormPhone, setWorkerFormPhone] = useState('');
  const [workerFormBio, setWorkerFormBio] = useState('');
  const [workerFormAvatarUrl, setWorkerFormAvatarUrl] = useState('');
  const [workerFormAcceptsAppts, setWorkerFormAcceptsAppts] = useState(true);
  const [savingWorker, setSavingWorker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ─── Servicio Forms ───────────────────────────────────────
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceFormTitle, setServiceFormTitle] = useState('');
  const [serviceFormPrice, setServiceFormPrice] = useState('');
  const [serviceFormDuration, setServiceFormDuration] = useState('60');
  const [serviceFormDesc, setServiceFormDesc] = useState('');
  const [savingService, setSavingService] = useState(false);

  // ─── Horarios de la especialista seleccionada ─────────────
  const [selectedWorkerForSchedule, setSelectedWorkerForSchedule] = useState<Worker | null>(null);

  // ─── Configuración del negocio ───────────────────────────
  const [editSettings, setEditSettings] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // ─── Confirmación de borrado ─────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'worker' | 'service'; id: string; name: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => { setToastMessage(null); }, 4000);
  };

  // ══════════════════════════════════════════════════════════
  // VERIFICACIÓN ESTRICTA DE ACCESO
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!supabase) {
      setSessionLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || !(await canManageBusiness(supabase, 'manicura'))) {
          setIsAuthenticated(false);
          router.replace('/manicura/login');
        } else {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || 'Administradora LM Nails');
        }
      } catch (err) {
        setIsAuthenticated(false);
        router.replace('/manicura/login');
      } finally {
        setSessionLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setIsAuthenticated(false);
        router.replace('/manicura/login');
      } else if (!(await canManageBusiness(supabase, 'manicura'))) {
        setIsAuthenticated(false);
        router.replace('/manicura/login');
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.replace('/manicura/login');
  };

  // ══════════════════════════════════════════════════════════
  // CARGA DE DATOS DE LM NAILS & SPA STUDIO
  // ══════════════════════════════════════════════════════════
  const loadBusinessData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // 1. Obtener ID de LM Nails
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'manicura')
        .maybeSingle();

      const manicuraBizId = bData?.id || '22222222-2222-2222-2222-222222222222';

      // 2. Cargar Manicuristas
      const { data: wData } = await supabase
        .from('workers')
        .select('*')
        .eq('business_id', manicuraBizId)
        .order('created_at', { ascending: true });
      
      const loadedWorkers = wData || [];
      setWorkers(loadedWorkers);
      if (loadedWorkers.length > 0 && !selectedWorkerForSchedule) {
        setSelectedWorkerForSchedule(loadedWorkers[0]);
      }

      // 3. Cargar Servicios
      const { data: sData } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', manicuraBizId)
        .order('created_at', { ascending: true });
      setServices(sData || []);

      // 4. Cargar Citas
      const { data: apptData } = await supabase
        .from('appointments')
        .select('*, workers(name), services(title, price)')
        .eq('business_id', manicuraBizId)
        .order('start_time', { ascending: true })
        .limit(20);
      setAppointments(apptData || []);

      // 5. Cargar Horarios solo de las manicuristas de este negocio
      const workerIds = loadedWorkers.map(w => w.id);
      if (workerIds.length > 0) {
        const { data: schData } = await supabase
          .from('schedules')
          .select('*')
          .in('worker_id', workerIds);
        setSchedules(schData || []);
      } else {
        setSchedules([]);
      }

      // 6. Cargar Settings
      const { data: settsData } = await supabase
        .from('business_settings')
        .select('key, value')
        .eq('business_id', manicuraBizId);
      
      if (settsData) {
        const sMap: Record<string, string> = {};
        settsData.forEach(item => { sMap[item.key] = item.value; });
        setSettings(sMap);
        setEditSettings(sMap);
      }

    } catch (err: any) {
      console.error('Error cargando datos de LM Nails:', err);
      showToast('Error al conectar con la base de datos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedWorkerForSchedule]);

  useEffect(() => {
    if (isAuthenticated) {
      loadBusinessData();
    }
  }, [isAuthenticated, loadBusinessData]);

  // ══════════════════════════════════════════════════════════
  // CRUD MANICURISTAS
  // ══════════════════════════════════════════════════════════
  const handleOpenWorkerModal = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      setWorkerFormName(worker.name);
      setWorkerFormPhone(worker.phone || '');
      setWorkerFormBio(worker.bio || '');
      setWorkerFormAvatarUrl(worker.avatar_url || '');
      setWorkerFormAcceptsAppts(worker.accepts_appointments);
    } else {
      setEditingWorker(null);
      setWorkerFormName('');
      setWorkerFormPhone('+57 ');
      setWorkerFormBio('');
      setWorkerFormAvatarUrl('');
      setWorkerFormAcceptsAppts(true);
    }
    setShowWorkerModal(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadMedia('avatars', file);
      setWorkerFormAvatarUrl(publicUrl);
      showToast('Foto subida correctamente');
    } catch (err: any) {
      showToast(err.message || 'Error al subir foto', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !workerFormName.trim()) return;
    setSavingWorker(true);

    try {
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'manicura')
        .maybeSingle();
      const bizId = bData?.id || '22222222-2222-2222-2222-222222222222';

      if (editingWorker) {
        const { error } = await supabase
          .from('workers')
          .update({
            name: workerFormName.trim(),
            phone: workerFormPhone.trim() || null,
            bio: workerFormBio.trim() || null,
            avatar_url: workerFormAvatarUrl.trim() || '/logo_lmnail.jpg',
            accepts_appointments: workerFormAcceptsAppts,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingWorker.id);

        if (error) throw error;
        showToast('Especialista actualizada correctamente.');
      } else {
        const { data: newW, error } = await supabase
          .from('workers')
          .insert({
            business_id: bizId,
            name: workerFormName.trim(),
            phone: workerFormPhone.trim() || null,
            bio: workerFormBio.trim() || null,
            avatar_url: workerFormAvatarUrl.trim() || '/logo_lmnail.jpg',
            accepts_appointments: workerFormAcceptsAppts,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;

        // Crear horarios por defecto (Lunes a Sábado 9am - 7pm)
        if (newW) {
          const defaultSchedules = [1, 2, 3, 4, 5, 6].map(day => ({
            worker_id: newW.id,
            day_of_week: day,
            start_time: '09:00',
            end_time: '19:00',
            is_active: true
          }));
          await supabase.from('schedules').insert(defaultSchedules);
        }

        showToast('Nueva especialista creada con éxito.');
      }

      setShowWorkerModal(false);
      loadBusinessData();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar la especialista.', 'error');
    } finally {
      setSavingWorker(false);
    }
  };

  const handleToggleWorkerActive = async (worker: Worker) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('workers')
        .update({ is_active: !worker.is_active })
        .eq('id', worker.id);

      if (error) throw error;
      setWorkers(workers.map(w => w.id === worker.id ? { ...w, is_active: !w.is_active } : w));
      showToast(`${worker.name} ${!worker.is_active ? 'activada' : 'desactivada'}.`);
    } catch (err: any) {
      showToast('Error al cambiar estado.', 'error');
    }
  };

  // ══════════════════════════════════════════════════════════
  // CRUD SERVICIOS
  // ══════════════════════════════════════════════════════════
  const handleOpenServiceModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceFormTitle(service.title);
      setServiceFormPrice(service.price.toString());
      setServiceFormDuration(service.duration_minutes.toString());
      setServiceFormDesc(service.description || '');
    } else {
      setEditingService(null);
      setServiceFormTitle('');
      setServiceFormPrice('');
      setServiceFormDuration('60');
      setServiceFormDesc('');
    }
    setShowServiceModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !serviceFormTitle.trim()) return;
    setSavingService(true);

    try {
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'manicura')
        .maybeSingle();
      const bizId = bData?.id || '22222222-2222-2222-2222-222222222222';

      const price = parseFloat(serviceFormPrice) || 0;
      const duration = parseInt(serviceFormDuration) || 60;

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            title: serviceFormTitle.trim(),
            price,
            duration_minutes: duration,
            description: serviceFormDesc.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingService.id);

        if (error) throw error;
        showToast('Servicio actualizado con éxito.');
      } else {
        const { error } = await supabase
          .from('services')
          .insert({
            business_id: bizId,
            title: serviceFormTitle.trim(),
            price,
            duration_minutes: duration,
            description: serviceFormDesc.trim() || null,
            is_active: true
          });

        if (error) throw error;
        showToast('Servicio agregado al catálogo de LM Nails.');
      }

      setShowServiceModal(false);
      loadBusinessData();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar el servicio.', 'error');
    } finally {
      setSavingService(false);
    }
  };

  const handleToggleServiceActive = async (service: Service) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      setServices(services.map(s => s.id === service.id ? { ...s, is_active: !s.is_active } : s));
      showToast(`Servicio ${!service.is_active ? 'activado' : 'pausado'}.`);
    } catch (err: any) {
      showToast('Error al cambiar estado.', 'error');
    }
  };

  // ══════════════════════════════════════════════════════════
  // BORRADO SEGURO
  // ══════════════════════════════════════════════════════════
  const handleConfirmDelete = async () => {
    if (!supabase || !deleteTarget) return;
    setDeletingItem(true);

    try {
      if (deleteTarget.type === 'worker') {
        const { error } = await supabase.from('workers').delete().eq('id', deleteTarget.id);
        if (error) throw error;
        showToast(`Especialista ${deleteTarget.name} eliminada.`);
        if (selectedWorkerForSchedule?.id === deleteTarget.id) {
          setSelectedWorkerForSchedule(null);
        }
      } else if (deleteTarget.type === 'service') {
        const { error } = await supabase.from('services').delete().eq('id', deleteTarget.id);
        if (error) throw error;
        showToast(`Servicio ${deleteTarget.name} eliminado.`);
      }

      setDeleteTarget(null);
      loadBusinessData();
    } catch (err: any) {
      showToast(err.message || 'No se pudo eliminar.', 'error');
    } finally {
      setDeletingItem(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // GESTIÓN DE HORARIOS DE TRABAJADOR
  // ══════════════════════════════════════════════════════════
  const handleUpdateScheduleDay = async (
    dayOfWeek: number,
    field: 'is_active' | 'start_time' | 'end_time',
    value: any
  ) => {
    if (!supabase || !selectedWorkerForSchedule) return;

    try {
      const existing = schedules.find(
        s => s.worker_id === selectedWorkerForSchedule.id && s.day_of_week === dayOfWeek
      );

      if (existing) {
        const { error } = await supabase
          .from('schedules')
          .update({ [field]: value })
          .eq('id', existing.id);

        if (error) throw error;
        setSchedules(schedules.map(s => s.id === existing.id ? { ...s, [field]: value } : s));
      } else {
        const newSched = {
          worker_id: selectedWorkerForSchedule.id,
          day_of_week: dayOfWeek,
          start_time: field === 'start_time' ? value : '09:00',
          end_time: field === 'end_time' ? value : '19:00',
          is_active: field === 'is_active' ? value : true,
          [field]: value
        };
        const { data, error } = await supabase
          .from('schedules')
          .insert(newSched)
          .select()
          .single();

        if (error) throw error;
        if (data) setSchedules([...schedules, data]);
      }
      showToast('Horario actualizado.');
    } catch (err: any) {
      showToast('Error al actualizar horario.', 'error');
    }
  };

  // ══════════════════════════════════════════════════════════
  // CONFIGURACIONES DEL NEGOCIO
  // ══════════════════════════════════════════════════════════
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSavingSettings(true);

    try {
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'manicura')
        .maybeSingle();
      const bizId = bData?.id || '22222222-2222-2222-2222-222222222222';

      const entries = Object.entries(editSettings);
      for (const [key, value] of entries) {
        await supabase
          .from('business_settings')
          .upsert(
            { business_id: bizId, key, value },
            { onConflict: 'business_id,key' }
          );
      }

      setSettings(editSettings);
      showToast('Configuraciones de LM Nails guardadas.');
    } catch (err: any) {
      showToast('Error al guardar configuraciones.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#0d090d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
          <p className="text-pink-200/60 text-sm tracking-widest uppercase">Verificando Credenciales de LM Nails...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0d090d] text-white flex flex-col selection:bg-pink-500 selection:text-white">
      <ManicuraNav />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-xs font-semibold tracking-wide animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/90 border-red-500/40 text-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-pink-500/20">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo_lmnail.jpg"
              alt="LM Nails Logo"
              className="w-14 h-14 rounded-full object-cover border-2 border-pink-500/50 shadow-lg shadow-pink-900/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white font-serif">
                  LM Nails & Spa Studio
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-pink-950/80 text-pink-300 border border-pink-500/30 uppercase">
                  Panel Spa
                </span>
              </div>
              <p className="text-xs text-pink-300/60 font-mono mt-0.5">
                Sesión: <span className="text-pink-300 font-semibold">{userEmail}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadBusinessData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-950/40 border border-pink-500/30 text-pink-200 hover:text-white text-xs font-medium transition-colors hover:bg-pink-900/40"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 hover:text-red-100 text-xs font-medium transition-colors hover:bg-red-900/50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-pink-500/20 mt-6 gap-2 sm:gap-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('manicuristas')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'manicuristas'
                ? 'border-pink-500 text-pink-300 bg-pink-950/30 rounded-t-lg'
                : 'border-transparent text-pink-200/50 hover:text-pink-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Manicuristas ({workers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'services'
                ? 'border-pink-500 text-pink-300 bg-pink-950/30 rounded-t-lg'
                : 'border-transparent text-pink-200/50 hover:text-pink-200'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Servicios & Spa ({services.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'appointments'
                ? 'border-pink-500 text-pink-300 bg-pink-950/30 rounded-t-lg'
                : 'border-transparent text-pink-200/50 hover:text-pink-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Citas Agendadas ({appointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-pink-500 text-pink-300 bg-pink-950/30 rounded-t-lg'
                : 'border-transparent text-pink-200/50 hover:text-pink-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración LM Nails</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 1: MANICURISTAS & HORARIOS                         */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'manicuristas' && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white font-serif">Equipo de Manicuristas & Estilistas</h2>
                <p className="text-xs text-pink-300/60">
                  Administra las profesionales de LM Nails y sus horarios de atención.
                </p>
              </div>
              <button
                onClick={() => handleOpenWorkerModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-pink-900/30 border border-pink-400/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Manicurista</span>
              </button>
            </div>

            {/* Listado de Manicuristas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.map((worker) => {
                const isSelected = selectedWorkerForSchedule?.id === worker.id;
                return (
                  <div
                    key={worker.id}
                    onClick={() => setSelectedWorkerForSchedule(worker)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-pink-950/30 border-pink-500 shadow-xl shadow-pink-950/50'
                        : 'bg-[#150d15]/60 border-pink-500/20 hover:border-pink-500/40 hover:bg-[#180e18]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center font-bold text-pink-300 text-sm">
                          {worker.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{worker.name}</h3>
                          <p className="text-xs text-pink-300/70 font-mono mt-0.5">
                            {worker.phone || 'Sin WhatsApp'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleWorkerActive(worker)}
                          title={worker.is_active ? 'Desactivar' : 'Activar'}
                          className="text-pink-300/60 hover:text-pink-200 p-1"
                        >
                          {worker.is_active ? (
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-zinc-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenWorkerModal(worker)}
                          title="Editar"
                          className="text-pink-300/60 hover:text-pink-200 p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'worker', id: worker.id, name: worker.name })}
                          title="Eliminar"
                          className="text-red-400/60 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {worker.bio && (
                      <p className="mt-3 text-xs text-pink-200/60 line-clamp-2 italic">
                        &quot;{worker.bio}&quot;
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-pink-500/10 flex items-center justify-between text-[11px]">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        worker.is_active ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-900 text-zinc-400'
                      }`}>
                        {worker.is_active ? '● En Servicio' : '○ En Pausa'}
                      </span>
                      <span className="text-pink-300/50 font-medium">
                        {isSelected ? '✓ Horarios visibles abajo' : 'Clic para ver horarios'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Editor de Horarios de la Especialista Seleccionada */}
            {selectedWorkerForSchedule && (
              <div className="p-6 rounded-2xl bg-[#150d15]/80 border border-pink-500/20 mt-8">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-pink-500/15">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-pink-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Horarios Semanales: <span className="text-pink-400">{selectedWorkerForSchedule.name}</span>
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                    const daySched = schedules.find(
                      s => s.worker_id === selectedWorkerForSchedule.id && s.day_of_week === day
                    );
                    const isWorking = daySched ? daySched.is_active : false;
                    const startTime = daySched ? daySched.start_time : '09:00';
                    const endTime = daySched ? daySched.end_time : '19:00';

                    return (
                      <div
                        key={day}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isWorking
                            ? 'bg-pink-950/20 border-pink-500/30'
                            : 'bg-black/30 border-zinc-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-bold text-white">
                            {DAY_NAMES[day]}
                          </span>
                          <button
                            onClick={() => handleUpdateScheduleDay(day, 'is_active', !isWorking)}
                            className="text-xs font-semibold cursor-pointer"
                          >
                            {isWorking ? (
                              <span className="text-emerald-400">Laborable</span>
                            ) : (
                              <span className="text-zinc-500">Descanso</span>
                            )}
                          </button>
                        </div>

                        {isWorking && (
                          <div className="flex items-center gap-2 text-xs">
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => handleUpdateScheduleDay(day, 'start_time', e.target.value)}
                              className="w-full bg-black/50 border border-pink-500/20 rounded px-2 py-1 text-white text-[11px]"
                            />
                            <span className="text-pink-400/50">-</span>
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => handleUpdateScheduleDay(day, 'end_time', e.target.value)}
                              className="w-full bg-black/50 border border-pink-500/20 rounded px-2 py-1 text-white text-[11px]"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 2: SERVICIOS & SPA                                 */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'services' && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white font-serif">Catálogo de Servicios & Spa</h2>
                <p className="text-xs text-pink-300/60">
                  Define precios, duraciones en minutos y detalles de cada tratamiento.
                </p>
              </div>
              <button
                onClick={() => handleOpenServiceModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-pink-900/30 border border-pink-400/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Servicio</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="p-5 rounded-2xl bg-[#150d15]/60 border border-pink-500/20 hover:border-pink-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-white">{svc.title}</h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleServiceActive(svc)}
                          title={svc.is_active ? 'Desactivar' : 'Activar'}
                          className="text-pink-300/60 hover:text-pink-200 p-1"
                        >
                          {svc.is_active ? (
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-zinc-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenServiceModal(svc)}
                          className="text-pink-300/60 hover:text-pink-200 p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'service', id: svc.id, name: svc.title })}
                          className="text-red-400/60 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {svc.description && (
                      <p className="mt-2 text-xs text-pink-200/60 line-clamp-2">
                        {svc.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-pink-500/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-pink-300 text-sm">
                      {formatCurrency(svc.price)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-pink-200/70 font-mono">
                      <Clock className="w-3.5 h-3.5 text-pink-400" />
                      {svc.duration_minutes} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 3: CITAS AGENDADAS                                 */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'appointments' && (
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Citas Agendadas</h2>
              <p className="text-xs text-pink-300/60">
                Historial y próximas reservaciones de clientas en LM Nails & Spa Studio.
              </p>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[#150d15]/40 rounded-2xl border border-pink-500/15">
                <Calendar className="w-10 h-10 text-pink-500/40 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">No hay citas registradas aún</h3>
                <p className="text-xs text-pink-300/50 mt-1 max-w-sm mx-auto">
                  Las citas agendadas desde la landing de LM Nails aparecerán listadas aquí con todos los detalles.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-pink-500/20 bg-[#150d15]/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-pink-950/40 text-pink-200 border-b border-pink-500/20">
                    <tr>
                      <th className="p-3.5 font-bold uppercase tracking-wider">Clienta</th>
                      <th className="p-3.5 font-bold uppercase tracking-wider">Especialista</th>
                      <th className="p-3.5 font-bold uppercase tracking-wider">Servicio</th>
                      <th className="p-3.5 font-bold uppercase tracking-wider">Fecha & Hora</th>
                      <th className="p-3.5 font-bold uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-500/10 text-pink-200/80">
                    {appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-pink-950/20">
                        <td className="p-3.5 font-semibold text-white">
                          {appt.client_name}
                          <span className="block text-[11px] font-mono text-pink-300/50">{appt.client_phone}</span>
                        </td>
                        <td className="p-3.5">{appt.workers?.name || 'Cualquiera'}</td>
                        <td className="p-3.5">{appt.services?.title || 'Servicio'}</td>
                        <td className="p-3.5 font-mono text-[11px]">
                          {new Date(appt.start_time).toLocaleString('es-CO')}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-900/60 text-pink-300 border border-pink-500/30">
                            {appt.status || 'CONFIRMADA'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 4: CONFIGURACIÓN                                   */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="mt-6 max-w-2xl">
            <div className="p-6 rounded-2xl bg-[#150d15]/80 border border-pink-500/20">
              <h2 className="text-lg font-bold text-white font-serif mb-1">Configuración del Negocio</h2>
              <p className="text-xs text-pink-300/60 mb-6">
                Personaliza la información de contacto y políticas de LM Nails & Spa.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                    WhatsApp de Atención LM Nails
                  </label>
                  <input
                    type="text"
                    value={editSettings['whatsapp_number'] !== undefined ? editSettings['whatsapp_number'] : '+57 '}
                    onChange={(e) => setEditSettings({ ...editSettings, whatsapp_number: e.target.value })}
                    placeholder="+57 300 123 4567"
                    className="w-full px-3.5 py-2 bg-black/50 border border-pink-500/20 rounded-xl text-white text-xs focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                    Dirección del Spa
                  </label>
                  <input
                    type="text"
                    value={editSettings['address'] || ''}
                    onChange={(e) => setEditSettings({ ...editSettings, address: e.target.value })}
                    placeholder="Calle Principal # 12-34"
                    className="w-full px-3.5 py-2 bg-black/50 border border-pink-500/20 rounded-xl text-white text-xs focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full mt-4 py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingSettings ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL MANICURISTA                                      */}
      {/* ══════════════════════════════════════════════════════ */}
      {showWorkerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#150d15] border border-pink-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-pink-500/20">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-serif">
                {editingWorker ? 'Editar Manicurista' : 'Nueva Manicurista'}
              </h3>
              <button
                onClick={() => setShowWorkerModal(false)}
                className="text-pink-300/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorker} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={workerFormName}
                  onChange={(e) => setWorkerFormName(e.target.value)}
                  placeholder="Ej. Laura Martínez"
                  className="w-full px-3.5 py-2 bg-black/50 border border-pink-500/20 rounded-xl text-white text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={workerFormPhone}
                  onChange={(e) => setWorkerFormPhone(e.target.value)}
                  placeholder="Ej. 3001234567"
                  className="w-full px-3.5 py-2 bg-black/50 border border-pink-500/20 rounded-xl text-white text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                  Especialidad / Biografía
                </label>
                <textarea
                  rows={2}
                  value={workerFormBio}
                  onChange={(e) => setWorkerFormBio(e.target.value)}
                  placeholder="Especialista en acrílicas y diseño mano alzada"
                  className="w-full px-3.5 py-2 bg-black/50 border border-pink-500/20 rounded-xl text-white text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">Foto de Perfil</label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={workerFormAvatarUrl || '/logo_lmnail.jpg'}
                      alt="Vista previa"
                      className="h-14 w-14 rounded-xl object-cover ring-2 ring-pink-300/30"
                    />
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                        <Upload className="w-5 h-5 text-pink-400 animate-pulse" />
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
                    <span className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-200 text-xs font-semibold hover:bg-pink-500/25 transition-colors">
                      <Camera className="w-4 h-4" />
                      {uploadingAvatar ? 'Subiendo...' : 'Elegir Foto'}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-pink-300/50 mt-1">JPG, PNG o WebP. Máx 5MB.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-500/10">
                <button
                  type="button"
                  onClick={() => setShowWorkerModal(false)}
                  className="px-4 py-2 rounded-xl text-pink-300 text-xs font-semibold hover:bg-pink-950/30"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingWorker}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingWorker ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL SERVICIO                                         */}
      {/* ══════════════════════════════════════════════════════ */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#150d15] border border-pink-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-pink-500/20">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-serif">
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio LM Nails'}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-pink-300/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                  Título del Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={serviceFormTitle}
                  onChange={(e) => setServiceFormTitle(e.target.value)}
                  placeholder="Ej. Uñas Acrílicas Esculpidas"
                  className="w-full px-3.5 py-2 bg-black/50 border border-pink-500/20 rounded-xl text-white text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                    Precio ($ COP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={serviceFormPrice}
                    onChange={(e) => setServiceFormPrice(e.target.value)}
                    placeholder="85000"
                    className="w-full px-3.5 py-2 bg-black/50 border border-pink-500/20 rounded-xl text-white text-xs focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    required
                    value={serviceFormDuration}
                    onChange={(e) => setServiceFormDuration(e.target.value)}
                    placeholder="90"
                    className="w-full px-3.5 py-2 bg-black/50 border border-pink-500/20 rounded-xl text-white text-xs focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={serviceFormDesc}
                  onChange={(e) => setServiceFormDesc(e.target.value)}
                  placeholder="Incluye limpieza profunda, tips y esmaltado semipermanente"
                  className="w-full px-3.5 py-2 bg-black/50 border border-pink-500/20 rounded-xl text-white text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-500/10">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 rounded-xl text-pink-300 text-xs font-semibold hover:bg-pink-950/30"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingService ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL DE CONFIRMACIÓN DE BORRADO                       */}
      {/* ══════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#150d15] border border-red-500/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Confirmar Eliminación</h3>
            <p className="text-xs text-pink-200/70 mt-2">
              ¿Estás segura de que deseas eliminar a <span className="text-white font-bold">{deleteTarget.name}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-pink-300 hover:bg-pink-950/40"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingItem}
                className="px-4 py-1.5 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white font-bold transition-all disabled:opacity-50"
              >
                {deletingItem ? 'Eliminando...' : 'Eliminar Definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
