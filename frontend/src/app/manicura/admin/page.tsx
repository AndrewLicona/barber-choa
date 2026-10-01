// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import { canManageBusiness } from '@/lib/access-control';
import { formatCurrency } from '@/lib/whatsapp';
import { uploadMedia } from '@/lib/media-upload';
import { Worker, Service, Schedule } from '@/types/database';
import {
  CheckCircle2, UserPlus, Shield, Sparkles,
  Settings, LogOut, Plus, Clock, Edit2, X, Trash2, ToggleLeft, ToggleRight,
  AlertCircle, RefreshCw, Calendar, Heart, Camera, Upload, ImageIcon,
  AtSign, Phone, MapPin, MessageCircle, Star, Activity, TrendingUp,
  ChevronDown, ChevronUp, Eye, ArrowLeft
} from 'lucide-react';

export default function ManicuraAdminPage() {
  const router = useRouter();
  const supabase = getSupabase();

  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manicuristas' | 'services' | 'appointments' | 'settings'>('dashboard');
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
  const [serviceFormImageUrl, setServiceFormImageUrl] = useState('');
  const [savingService, setSavingService] = useState(false);
  const [uploadingServiceImage, setUploadingServiceImage] = useState(false);

  // ─── Horarios de la especialista seleccionada ─────────────
  const [selectedWorkerForSchedule, setSelectedWorkerForSchedule] = useState<Worker | null>(null);

  // ─── Configuración del negocio ───────────────────────────
  const [editSettings, setEditSettings] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // ─── Confirmación de borrado ─────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'worker' | 'service'; id: string; name: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // ─── Appointment filter ──────────────────────────────────
  const [apptFilter, setApptFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [expandedAppt, setExpandedAppt] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => { setToastMessage(null); }, 4000);
  };

  // ══════════════════════════════════════════════════════════
  // AUTH
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
    if (supabase) await supabase.auth.signOut();
    router.replace('/manicura/login');
  };

  // ══════════════════════════════════════════════════════════
  // CARGA DE DATOS
  // ══════════════════════════════════════════════════════════
  const loadBusinessData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      const { data: bData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'manicura')
        .maybeSingle();

      const manicuraBizId = bData?.id || '672e16e5-3605-410c-aa17-9467e3d6c077';

      const [wRes, sRes, apptRes, settsRes] = await Promise.all([
        supabase.from('workers').select('*').eq('business_id', manicuraBizId).order('created_at', { ascending: true }),
        supabase.from('services').select('*').eq('business_id', manicuraBizId).order('created_at', { ascending: true }),
        supabase.from('appointments').select('*, workers(name, avatar_url), services(title, price)').eq('business_id', manicuraBizId).order('start_time', { ascending: true }),
        supabase.from('business_settings').select('key, value').eq('business_id', manicuraBizId),
      ]);

      const loadedWorkers = wRes.data || [];
      setWorkers(loadedWorkers);
      if (loadedWorkers.length > 0 && !selectedWorkerForSchedule) {
        setSelectedWorkerForSchedule(loadedWorkers[0]);
      }

      setServices(sRes.data || []);
      setAppointments(apptRes.data || []);

      if (settsRes.data) {
        const sMap: Record<string, string> = {};
        settsRes.data.forEach(item => { sMap[item.key] = item.value; });
        setSettings(sMap);
        setEditSettings(sMap);
      }

      // Horarios
      const workerIds = loadedWorkers.map(w => w.id);
      if (workerIds.length > 0) {
        const { data: schData } = await supabase.from('schedules').select('*').in('worker_id', workerIds);
        setSchedules(schData || []);
      } else {
        setSchedules([]);
      }

    } catch (err: any) {
      console.error('Error cargando datos de LM Nails:', err);
      showToast('Error al conectar con la base de datos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedWorkerForSchedule]);

  useEffect(() => {
    if (isAuthenticated) loadBusinessData();
  }, [isAuthenticated, loadBusinessData]);

  // ══════════════════════════════════════════════════════════
  // CRUD MANICURISTAS
  // ══════════════════════════════════════════════════════════
  const handleOpenWorkerModal = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      setWorkerFormName(worker.name);
      setWorkerFormPhone(worker.phone || '+57 ');
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
      const { data: bData } = await supabase.from('businesses').select('id').eq('slug', 'manicura').maybeSingle();
      const bizId = bData?.id || '672e16e5-3605-410c-aa17-9467e3d6c077';

      if (editingWorker) {
        const { error } = await supabase.from('workers').update({
          name: workerFormName.trim(),
          phone: workerFormPhone.trim() || null,
          bio: workerFormBio.trim() || null,
          avatar_url: workerFormAvatarUrl.trim() || '/logo_lmnail.jpg',
          accepts_appointments: workerFormAcceptsAppts,
          updated_at: new Date().toISOString()
        }).eq('id', editingWorker.id);

        if (error) throw error;
        showToast('Especialista actualizada correctamente.');
      } else {
        const { data: newW, error } = await supabase.from('workers').insert({
          business_id: bizId,
          business_type: 'manicura',
          name: workerFormName.trim(),
          phone: workerFormPhone.trim() || null,
          bio: workerFormBio.trim() || null,
          avatar_url: workerFormAvatarUrl.trim() || '/logo_lmnail.jpg',
          accepts_appointments: workerFormAcceptsAppts,
          is_active: true
        }).select().single();

        if (error) throw error;

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
        showToast('Nueva especialista creada con éxito. 💅');
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
      const { error } = await supabase.from('workers').update({ is_active: !worker.is_active }).eq('id', worker.id);
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
      setServiceFormImageUrl(service.image_url || '');
    } else {
      setEditingService(null);
      setServiceFormTitle('');
      setServiceFormPrice('');
      setServiceFormDuration('60');
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
      const publicUrl = await uploadMedia('services', file);
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
    if (!supabase || !serviceFormTitle.trim()) return;
    setSavingService(true);

    try {
      const { data: bData } = await supabase.from('businesses').select('id').eq('slug', 'manicura').maybeSingle();
      const bizId = bData?.id || '672e16e5-3605-410c-aa17-9467e3d6c077';
      const price = parseFloat(serviceFormPrice) || 0;
      const duration = parseInt(serviceFormDuration) || 60;

      if (editingService) {
        const { error } = await supabase.from('services').update({
          title: serviceFormTitle.trim(),
          price,
          duration_minutes: duration,
          description: serviceFormDesc.trim() || null,
          image_url: serviceFormImageUrl.trim() || null,
          updated_at: new Date().toISOString()
        }).eq('id', editingService.id);

        if (error) throw error;
        showToast('Servicio actualizado con éxito.');
      } else {
        const { error } = await supabase.from('services').insert({
          business_id: bizId,
          business_type: 'manicura',
          title: serviceFormTitle.trim(),
          price,
          duration_minutes: duration,
          description: serviceFormDesc.trim() || null,
          image_url: serviceFormImageUrl.trim() || null,
          is_active: true
        });

        if (error) throw error;
        showToast('Servicio agregado al catálogo de LM Nails. ✨');
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
      const { error } = await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id);
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
        if (selectedWorkerForSchedule?.id === deleteTarget.id) setSelectedWorkerForSchedule(null);
      } else {
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
  // HORARIOS
  // ══════════════════════════════════════════════════════════
  const handleUpdateScheduleDay = async (dayOfWeek: number, field: 'is_active' | 'start_time' | 'end_time', value: any) => {
    if (!supabase || !selectedWorkerForSchedule) return;
    try {
      const existing = schedules.find(s => s.worker_id === selectedWorkerForSchedule.id && s.day_of_week === dayOfWeek);

      if (existing) {
        const { error } = await supabase.from('schedules').update({ [field]: value }).eq('id', existing.id);
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
        const { data, error } = await supabase.from('schedules').insert(newSched).select().single();
        if (error) throw error;
        if (data) setSchedules([...schedules, data]);
      }
      showToast('Horario actualizado.');
    } catch (err: any) {
      showToast('Error al actualizar horario.', 'error');
    }
  };

  // ══════════════════════════════════════════════════════════
  // CONFIGURACIÓN
  // ══════════════════════════════════════════════════════════
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSavingSettings(true);
    try {
      const { data: bData } = await supabase.from('businesses').select('id').eq('slug', 'manicura').maybeSingle();
      const bizId = bData?.id || '672e16e5-3605-410c-aa17-9467e3d6c077';
      const entries = Object.entries(editSettings);
      for (const [key, value] of entries) {
        await supabase.from('business_settings').upsert({ business_id: bizId, key, value }, { onConflict: 'business_id,key' });
      }
      setSettings(editSettings);
      showToast('Configuraciones de LM Nails guardadas. ✨');
    } catch (err: any) {
      showToast('Error al guardar configuraciones.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────
  const now = new Date();
  const upcomingAppts = appointments.filter(a => new Date(a.start_time) >= now);
  const pastAppts = appointments.filter(a => new Date(a.start_time) < now);
  const filteredAppts = apptFilter === 'all' ? appointments : apptFilter === 'upcoming' ? upcomingAppts : pastAppts;
  const activeWorkers = workers.filter(w => w.is_active);
  const activeServices = services.filter(s => s.is_active);

  const getWorkerScheduleSummary = (workerId: string) => {
    const ws = schedules.filter(s => s.worker_id === workerId && s.is_active);
    if (ws.length === 0) return 'Sin horario';
    return `${ws.length} días/semana`;
  };

  const getApptStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('confirm') || s.includes('pendiente')) return 'bg-amber-900/60 text-amber-300 border-amber-500/30';
    if (s.includes('complet') || s.includes('atendi')) return 'bg-emerald-900/60 text-emerald-300 border-emerald-500/30';
    if (s.includes('cancel')) return 'bg-red-900/60 text-red-300 border-red-500/30';
    return 'bg-pink-900/60 text-pink-300 border-pink-500/30';
  };

  // ── Loading / Auth ─────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#0d090d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
          <p className="text-pink-200/60 text-sm tracking-widest uppercase">Verificando acceso…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0d090d] text-white flex flex-col selection:bg-pink-500 selection:text-white">
      {/* ─── Header Spa Admin Cohesivo ──────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0d090d]/95 border-b border-pink-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          {/* Lado izquierdo: Volver + Logo + Título */}
          <div className="flex items-center gap-3">
            <a
              href="/manicura"
              className="p-2 rounded-xl text-pink-300/70 hover:text-white hover:bg-pink-950/50 border border-pink-500/20 transition-colors shrink-0"
              title="Volver a la página principal de LM Nails"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>

            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden ring-2 border-pink-500/40 ring-pink-500/40 shadow-lg shadow-pink-950/60 bg-black shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo_lmnail.jpg"
                alt="LM Nails Logo"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white font-serif tracking-tight truncate">
                  LM Nails <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 font-sans font-bold">& Spa</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest bg-pink-950 text-pink-300 border border-pink-500/30 uppercase font-mono">
                  ADMIN SPA
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-pink-300/60 font-mono truncate max-w-[160px] sm:max-w-xs">
                {userEmail}
              </p>
            </div>
          </div>

          {/* Lado derecho: Acciones rápidas */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadBusinessData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-pink-950/40 border border-pink-500/30 text-pink-200 hover:text-white text-xs font-medium transition-colors hover:bg-pink-900/40 cursor-pointer"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Actualizar</span>
            </button>

            <a
              href="/manicura"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-pink-950/40 border border-pink-500/30 text-pink-200 hover:text-white text-xs font-medium transition-colors hover:bg-pink-900/40"
              title="Ver sitio público de LM Nails"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Sitio</span>
            </a>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 hover:text-red-100 text-xs font-medium transition-colors hover:bg-red-900/50 cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-20 right-4 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-xs font-semibold tracking-wide max-w-xs ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
            : 'bg-red-950/95 border-red-500/40 text-red-200'
        }`}>
          {toastMessage.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ─── Main ────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* Nav Tabs */}
        <div className="flex border-b border-pink-500/20 mt-5 overflow-x-auto pb-0 gap-1 sm:gap-2 scrollbar-none">
          {([
            { key: 'dashboard', icon: <Activity className="w-4 h-4" />, label: 'Resumen' },
            { key: 'manicuristas', icon: <Sparkles className="w-4 h-4" />, label: `Especialistas (${workers.length})` },
            { key: 'services', icon: <Heart className="w-4 h-4" />, label: `Servicios (${services.length})` },
            { key: 'appointments', icon: <Calendar className="w-4 h-4" />, label: `Citas (${upcomingAppts.length})` },
            { key: 'settings', icon: <Settings className="w-4 h-4" />, label: 'Configuración' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-pink-500 text-pink-300 bg-pink-950/30 rounded-t-lg'
                  : 'border-transparent text-pink-200/50 hover:text-pink-200'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* TAB: DASHBOARD                               */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="mt-6 space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Especialistas', value: workers.length, active: activeWorkers.length, icon: <Sparkles className="w-5 h-5 text-pink-400" />, color: 'pink' },
                { label: 'Servicios', value: services.length, active: activeServices.length, icon: <Heart className="w-5 h-5 text-rose-400" />, color: 'rose' },
                { label: 'Citas Próximas', value: upcomingAppts.length, active: null, icon: <Calendar className="w-5 h-5 text-purple-400" />, color: 'purple' },
                { label: 'Total Citas', value: appointments.length, active: null, icon: <TrendingUp className="w-5 h-5 text-amber-400" />, color: 'amber' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#150d15]/60 border border-pink-500/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    {stat.icon}
                    {stat.active !== null && (
                      <span className="text-[10px] text-emerald-400 font-semibold">{stat.active} activas</span>
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{loading ? '—' : stat.value}</p>
                    <p className="text-[11px] text-pink-300/60 mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Próximas citas */}
            <div className="p-5 rounded-2xl bg-[#150d15]/60 border border-pink-500/20">
              <h2 className="text-sm font-bold text-white font-serif mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-400" />
                Próximas Citas
              </h2>
              {upcomingAppts.length === 0 ? (
                <p className="text-xs text-pink-300/50 text-center py-6">No hay citas próximas</p>
              ) : (
                <div className="space-y-2">
                  {upcomingAppts.slice(0, 5).map(appt => (
                    <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl bg-pink-950/20 border border-pink-500/10">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-600/30 flex items-center justify-center text-sm font-bold text-pink-200 shrink-0">
                        {appt.client_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{appt.client_name}</p>
                        <p className="text-[11px] text-pink-300/60 truncate">{appt.services?.title || 'Servicio'} · {appt.workers?.name || 'Cualquiera'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] font-mono text-pink-200/70">
                          {new Date(appt.start_time).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[10px] font-mono text-pink-300/50">
                          {new Date(appt.start_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {upcomingAppts.length > 5 && (
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="w-full text-center text-xs text-pink-400 hover:text-pink-300 py-2 cursor-pointer"
                    >
                      Ver todas las citas →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('manicuristas')}
                className="p-4 rounded-2xl bg-gradient-to-br from-pink-950/60 to-purple-950/40 border border-pink-500/20 text-left hover:border-pink-500/40 transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-pink-400 mb-2" />
                <p className="text-sm font-bold text-white">Gestionar Equipo</p>
                <p className="text-[11px] text-pink-300/60">{activeWorkers.length} especialistas activas</p>
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/60 to-pink-950/40 border border-rose-500/20 text-left hover:border-rose-500/40 transition-all cursor-pointer"
              >
                <Heart className="w-5 h-5 text-rose-400 mb-2" />
                <p className="text-sm font-bold text-white">Catálogo Servicios</p>
                <p className="text-[11px] text-pink-300/60">{activeServices.length} servicios activos</p>
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* TAB: MANICURISTAS                           */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'manicuristas' && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white font-serif">Equipo de Especialistas</h2>
                <p className="text-xs text-pink-300/60">Administra el equipo de LM Nails y sus horarios.</p>
              </div>
              <button
                onClick={() => handleOpenWorkerModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-pink-900/30 border border-pink-400/30 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nueva Especialista</span>
              </button>
            </div>

            {/* Grid de trabajadoras */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.map((worker) => {
                const isSelected = selectedWorkerForSchedule?.id === worker.id;
                const schedSummary = getWorkerScheduleSummary(worker.id);
                return (
                  <div
                    key={worker.id}
                    onClick={() => setSelectedWorkerForSchedule(worker)}
                    className={`rounded-2xl border transition-all cursor-pointer p-4 sm:p-5 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-pink-950/30 border-pink-500 shadow-xl shadow-pink-950/60 ring-1 ring-pink-500/50'
                        : 'bg-[#150d15]/80 border-pink-500/20 hover:border-pink-500/40 hover:bg-[#180e18]'
                    }`}
                  >
                    <div>
                      {/* Top: Avatar cuadrado natural + Info + Acciones */}
                      <div className="flex items-start gap-3.5 sm:gap-4">
                        {/* Avatar cuadrado con marco rosa y punto de estado */}
                        <div className="relative shrink-0">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-2 ring-pink-500/40 shadow-lg shadow-pink-950/60 bg-black/60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={worker.avatar_url || '/logo_lmnail.jpg'}
                              alt={worker.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {worker.is_active ? (
                            <span
                              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#150d15] rounded-full shadow-sm"
                              title="Activa"
                            />
                          ) : (
                            <span
                              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-zinc-500 border-2 border-[#150d15] rounded-full"
                              title="En pausa"
                            />
                          )}
                        </div>

                        {/* Nombre & Datos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-bold text-white font-serif truncate">
                                {worker.name}
                              </h3>
                              <span className="inline-block text-[10px] text-pink-400 font-semibold uppercase tracking-wider font-mono">
                                Especialista Nail Artist
                              </span>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleToggleWorkerActive(worker)}
                                title={worker.is_active ? 'Pausar especialista' : 'Activar especialista'}
                                className="p-1 rounded-lg text-pink-300/70 hover:text-white hover:bg-pink-950/50 transition-colors"
                              >
                                {worker.is_active ? (
                                  <ToggleRight className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-zinc-500" />
                                )}
                              </button>
                              <button
                                onClick={() => handleOpenWorkerModal(worker)}
                                title="Editar datos"
                                className="p-1 rounded-lg text-pink-300/70 hover:text-white hover:bg-pink-950/50 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'worker', id: worker.id, name: worker.name })}
                                title="Eliminar"
                                className="p-1 rounded-lg text-red-400/70 hover:text-red-300 hover:bg-red-950/50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* WhatsApp / Teléfono */}
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-pink-200/70 font-mono">
                            <Phone className="w-3 h-3 text-pink-400 shrink-0" />
                            <span className="truncate">{worker.phone || 'Sin WhatsApp'}</span>
                          </div>

                          {/* Badges de Estado & Citas */}
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-pink-950/60 text-pink-300 border border-pink-500/30">
                              {worker.accepts_appointments ? '📅 Acepta Citas' : '💅 Solo Presencial'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                              worker.is_active
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                            }`}>
                              {worker.is_active ? 'Activa' : 'Pausada'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Biografía */}
                      {worker.bio && (
                        <p className="mt-3 text-xs text-pink-200/70 italic line-clamp-2 pl-2.5 border-l-2 border-pink-500/40 bg-pink-950/10 py-1 rounded-r">
                          &quot;{worker.bio}&quot;
                        </p>
                      )}
                    </div>

                    {/* Bottom: Horario & Seleccionar */}
                    <div className="mt-4 pt-3 border-t border-pink-500/15 flex items-center justify-between text-xs">
                      <span className="text-pink-300/60 font-mono flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-pink-400" />
                        {schedSummary}
                      </span>
                      <button
                        type="button"
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-pink-500 text-white shadow-sm'
                            : 'bg-pink-950/50 text-pink-300 hover:bg-pink-900/60 border border-pink-500/20'
                        }`}
                      >
                        {isSelected ? '✓ Horario Abierto' : 'Configurar Horario →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Editor horarios */}
            {selectedWorkerForSchedule && (
              <div className="p-5 rounded-2xl bg-[#150d15]/80 border border-pink-500/20">
                <div className="flex items-center gap-2 pb-4 mb-4 border-b border-pink-500/15">
                  <Clock className="w-4 h-4 text-pink-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Horarios: <span className="text-pink-400">{selectedWorkerForSchedule.name}</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                    const daySched = schedules.find(s => s.worker_id === selectedWorkerForSchedule.id && s.day_of_week === day);
                    const isWorking = daySched?.is_active ?? false;
                    const startTime = daySched?.start_time ?? '09:00';
                    const endTime = daySched?.end_time ?? '19:00';
                    const dayNames = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };

                    return (
                      <div
                        key={day}
                        className={`p-3 rounded-xl border transition-all ${
                          isWorking ? 'bg-pink-950/20 border-pink-500/30' : 'bg-black/30 border-zinc-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white">{dayNames[day]}</span>
                          <button
                            onClick={() => handleUpdateScheduleDay(day, 'is_active', !isWorking)}
                            className="text-[10px] font-semibold cursor-pointer"
                          >
                            {isWorking ? <span className="text-emerald-400">✓</span> : <span className="text-zinc-500">✗</span>}
                          </button>
                        </div>
                        {isWorking && (
                          <div className="space-y-1.5">
                            <input
                              type="time"
                              value={startTime}
                              onChange={e => handleUpdateScheduleDay(day, 'start_time', e.target.value)}
                              className="w-full bg-black/50 border border-pink-500/20 rounded px-1.5 py-1 text-white text-[10px] focus:outline-none"
                            />
                            <input
                              type="time"
                              value={endTime}
                              onChange={e => handleUpdateScheduleDay(day, 'end_time', e.target.value)}
                              className="w-full bg-black/50 border border-pink-500/20 rounded px-1.5 py-1 text-white text-[10px] focus:outline-none"
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

        {/* ════════════════════════════════════════════ */}
        {/* TAB: SERVICIOS                              */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'services' && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white font-serif">Catálogo de Servicios & Spa</h2>
                <p className="text-xs text-pink-300/60">Define precios, duraciones y fotos de cada tratamiento.</p>
              </div>
              <button
                onClick={() => handleOpenServiceModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-pink-900/30 border border-pink-400/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Servicio</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <div key={svc.id} className="rounded-2xl border border-pink-500/20 bg-[#150d15]/60 overflow-hidden hover:border-pink-500/40 transition-all flex flex-col">
                  {/* Imagen del servicio */}
                  <div className="relative h-40 bg-gradient-to-br from-pink-950/60 to-purple-950/40 overflow-hidden">
                    {svc.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={svc.image_url} alt={svc.title} className="w-full h-full object-cover opacity-90" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-pink-500/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#150d15] via-transparent to-transparent" />
                    {/* Toggle activo */}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => handleToggleServiceActive(svc)}
                        className="p-1.5 rounded-lg bg-black/60 border border-pink-500/20"
                      >
                        {svc.is_active ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-zinc-500" />}
                      </button>
                    </div>
                    {!svc.is_active && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="px-2 py-1 rounded text-xs font-bold bg-zinc-900/90 text-zinc-400 border border-zinc-700">PAUSADO</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-white leading-tight">{svc.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleOpenServiceModal(svc)} className="p-1 text-pink-300/60 hover:text-pink-200">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget({ type: 'service', id: svc.id, name: svc.title })} className="p-1 text-red-400/60 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {svc.description && (
                      <p className="mt-1.5 text-xs text-pink-200/60 line-clamp-2 flex-1">{svc.description}</p>
                    )}

                    <div className="mt-3 pt-3 border-t border-pink-500/10 flex items-center justify-between">
                      <span className="font-bold text-pink-300 text-sm">{formatCurrency(svc.price)}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-pink-200/60 font-mono">
                        <Clock className="w-3.5 h-3.5 text-pink-400" />
                        {svc.duration_minutes} min
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* TAB: CITAS                                  */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'appointments' && (
          <div className="mt-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Citas Agendadas</h2>
              <p className="text-xs text-pink-300/60">Historial y próximas reservaciones en LM Nails & Spa Studio.</p>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'upcoming', label: `Próximas (${upcomingAppts.length})` },
                { key: 'past', label: `Pasadas (${pastAppts.length})` },
                { key: 'all', label: `Todas (${appointments.length})` },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setApptFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    apptFilter === f.key
                      ? 'bg-pink-600 border-pink-500 text-white'
                      : 'bg-pink-950/30 border-pink-500/20 text-pink-300/70 hover:text-pink-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredAppts.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[#150d15]/40 rounded-2xl border border-pink-500/15">
                <Calendar className="w-10 h-10 text-pink-500/30 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">No hay citas en esta categoría</h3>
                <p className="text-xs text-pink-300/50 mt-1">Las citas aparecerán aquí cuando se agenden desde el sitio.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppts.map((appt) => {
                  const isExpanded = expandedAppt === appt.id;
                  const apptDate = new Date(appt.start_time);
                  const isPast = apptDate < now;
                  return (
                    <div key={appt.id} className={`rounded-2xl border transition-all ${
                      isPast ? 'border-pink-500/10 bg-[#0f0b0f]/60 opacity-70' : 'border-pink-500/20 bg-[#150d15]/60'
                    }`}>
                      <button
                        onClick={() => setExpandedAppt(isExpanded ? null : appt.id)}
                        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                      >
                        {/* Avatar inicial */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-600/30 flex items-center justify-center text-sm font-bold text-pink-200 shrink-0">
                          {appt.client_name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{appt.client_name}</p>
                          <p className="text-xs text-pink-300/60 truncate">{appt.services?.title || 'Servicio'}</p>
                        </div>
                        <div className="text-right shrink-0 mr-1">
                          <p className="text-xs font-semibold text-pink-200">
                            {apptDate.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-[11px] text-pink-300/60 font-mono">
                            {apptDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getApptStatusColor(appt.status)}`}>
                          {appt.status || 'CONF'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-pink-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-pink-400/50 shrink-0" />}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-pink-500/10 space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <p className="text-pink-300/50 uppercase tracking-wider text-[10px] mb-0.5">Especialista</p>
                              <p className="text-pink-100 font-semibold">{appt.workers?.name || 'Cualquiera'}</p>
                            </div>
                            <div>
                              <p className="text-pink-300/50 uppercase tracking-wider text-[10px] mb-0.5">Precio</p>
                              <p className="text-pink-100 font-semibold">{appt.services?.price ? formatCurrency(appt.services.price) : '—'}</p>
                            </div>
                            <div>
                              <p className="text-pink-300/50 uppercase tracking-wider text-[10px] mb-0.5">Teléfono</p>
                              <a href={`tel:${appt.client_phone}`} className="text-pink-400 hover:underline font-mono">{appt.client_phone || '—'}</a>
                            </div>
                            <div>
                              <p className="text-pink-300/50 uppercase tracking-wider text-[10px] mb-0.5">Fecha completa</p>
                              <p className="text-pink-100 font-mono text-[11px]">{apptDate.toLocaleString('es-CO')}</p>
                            </div>
                          </div>
                          {appt.notes && (
                            <div className="mt-2 p-2 rounded-lg bg-pink-950/20 border border-pink-500/10">
                              <p className="text-pink-300/50 uppercase tracking-wider text-[10px] mb-0.5">Notas</p>
                              <p className="text-pink-100">{appt.notes}</p>
                            </div>
                          )}
                          {appt.client_phone && (
                            <a
                              href={`https://wa.me/${appt.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${appt.client_name}, te confirmamos tu cita en LM Nails & Spa Studio para el ${apptDate.toLocaleDateString('es-CO')} a las ${apptDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}. ¡Te esperamos! 💅`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/60 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Confirmar por WhatsApp
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* TAB: CONFIGURACIÓN                          */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="mt-6 max-w-2xl">
            <div className="p-5 sm:p-6 rounded-2xl bg-[#150d15]/80 border border-pink-500/20">
              <h2 className="text-lg font-bold text-white font-serif mb-1">Configuración del Negocio</h2>
              <p className="text-xs text-pink-300/60 mb-6">Personaliza la información de contacto y políticas de LM Nails & Spa.</p>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                    <Phone className="w-3.5 h-3.5 inline mr-1" />
                    WhatsApp de Atención
                  </label>
                  <input
                    type="text"
                    value={editSettings['whatsapp_number'] !== undefined ? editSettings['whatsapp_number'] : '+57 '}
                    onChange={e => setEditSettings({ ...editSettings, whatsapp_number: e.target.value })}
                    placeholder="+57 300 123 4567"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none placeholder:text-zinc-600"
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                    Dirección del Spa
                  </label>
                  <input
                    type="text"
                    value={editSettings['address'] || ''}
                    onChange={e => setEditSettings({ ...editSettings, address: e.target.value })}
                    placeholder="Calle Principal # 12-34, Barrio, Ciudad"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none placeholder:text-zinc-600"
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                    <AtSign className="w-3.5 h-3.5 inline mr-1" />
                    Instagram
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-pink-400 text-sm pl-3">@</span>
                    <input
                      type="text"
                      value={(editSettings['instagram'] || '').replace('@', '')}
                      onChange={e => setEditSettings({ ...editSettings, instagram: e.target.value })}
                      placeholder="lm.nails.spa"
                      className="flex-1 px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Horario general */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    Horario General
                  </label>
                  <input
                    type="text"
                    value={editSettings['horario'] || ''}
                    onChange={e => setEditSettings({ ...editSettings, horario: e.target.value })}
                    placeholder="Lun–Sáb: 9am – 7pm"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none placeholder:text-zinc-600"
                  />
                </div>

                {/* Nombre del negocio */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                    <Star className="w-3.5 h-3.5 inline mr-1" />
                    Nombre del Negocio
                  </label>
                  <input
                    type="text"
                    value={editSettings['business_name'] || ''}
                    onChange={e => setEditSettings({ ...editSettings, business_name: e.target.value })}
                    placeholder="LM Nails & Spa Studio"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none placeholder:text-zinc-600"
                  />
                </div>

                {/* Política de cancelación */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">
                    <Shield className="w-3.5 h-3.5 inline mr-1" />
                    Política de Cancelación
                  </label>
                  <textarea
                    rows={3}
                    value={editSettings['cancellation_policy'] || ''}
                    onChange={e => setEditSettings({ ...editSettings, cancellation_policy: e.target.value })}
                    placeholder="Cancela con mínimo 24 horas de anticipación para reprogramar tu cita sin costo..."
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none placeholder:text-zinc-600 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-pink-900/30"
                >
                  {savingSettings ? 'Guardando…' : '✨ Guardar Configuración'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: MANICURISTA                          */}
      {/* ════════════════════════════════════════════ */}
      {showWorkerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#150d15] border border-pink-500/30 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#150d15] flex items-center justify-between p-5 border-b border-pink-500/20 z-10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-serif">
                {editingWorker ? '✏️ Editar Especialista' : '💅 Nueva Especialista'}
              </h3>
              <button onClick={() => setShowWorkerModal(false)} className="text-pink-300/60 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorker} className="p-5 space-y-4">
              {/* Avatar preview + upload */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={workerFormAvatarUrl || '/logo_lmnail.jpg'}
                    alt="Vista previa"
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-pink-300/30"
                  />
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                      <Upload className="w-5 h-5 text-pink-400 animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70">Foto de Perfil</label>
                  <label className="cursor-pointer block">
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                    <span className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-200 text-xs font-semibold hover:bg-pink-500/25 transition-colors">
                      <Camera className="w-4 h-4" />
                      {uploadingAvatar ? 'Subiendo…' : 'Subir Foto'}
                    </span>
                  </label>
                  <input
                    type="url"
                    value={workerFormAvatarUrl}
                    onChange={e => setWorkerFormAvatarUrl(e.target.value)}
                    placeholder="O pega URL de imagen"
                    className="w-full px-2.5 py-1.5 bg-black/50 border border-pink-500/20 rounded-lg text-white text-xs focus:border-pink-500 focus:outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={workerFormName}
                  onChange={e => setWorkerFormName(e.target.value)}
                  placeholder="Ej. Laura Martínez"
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={workerFormPhone}
                  onChange={e => setWorkerFormPhone(e.target.value)}
                  placeholder="+57 300 123 4567"
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">Especialidad / Biografía</label>
                <textarea
                  rows={2}
                  value={workerFormBio}
                  onChange={e => setWorkerFormBio(e.target.value)}
                  placeholder="Especialista en acrílicas y diseño mano alzada"
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none resize-none"
                />
              </div>

              {/* Acepta citas */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-pink-950/20 border border-pink-500/15">
                <div>
                  <p className="text-sm font-semibold text-white">Acepta Citas Online</p>
                  <p className="text-xs text-pink-300/60">Aparecerá como opción al agendar</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkerFormAcceptsAppts(!workerFormAcceptsAppts)}
                  className="cursor-pointer"
                >
                  {workerFormAcceptsAppts
                    ? <ToggleRight className="w-7 h-7 text-emerald-400" />
                    : <ToggleLeft className="w-7 h-7 text-zinc-500" />}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWorkerModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-pink-300 text-sm font-semibold hover:bg-pink-950/30 border border-pink-500/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingWorker}
                  className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingWorker ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: SERVICIO                             */}
      {/* ════════════════════════════════════════════ */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#150d15] border border-pink-500/30 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#150d15] flex items-center justify-between p-5 border-b border-pink-500/20 z-10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-serif">
                {editingService ? '✏️ Editar Servicio' : '✨ Nuevo Servicio LM Nails'}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-pink-300/60 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-5 space-y-4">
              {/* Imagen del servicio */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-2">
                  <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
                  Imagen del Servicio
                </label>
                <div className="relative h-36 rounded-xl overflow-hidden bg-pink-950/20 border border-pink-500/20 mb-2">
                  {serviceFormImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={serviceFormImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-pink-500/20" />
                    </div>
                  )}
                  {uploadingServiceImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-pink-400 animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="cursor-pointer block">
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleServiceImageUpload} className="hidden" disabled={uploadingServiceImage} />
                    <span className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-200 text-xs font-semibold hover:bg-pink-500/25 transition-colors">
                      <Camera className="w-4 h-4" />
                      {uploadingServiceImage ? 'Subiendo…' : 'Subir Imagen'}
                    </span>
                  </label>
                  <input
                    type="url"
                    value={serviceFormImageUrl}
                    onChange={e => setServiceFormImageUrl(e.target.value)}
                    placeholder="O pega URL de imagen (Unsplash, etc.)"
                    className="w-full px-3 py-2 bg-black/50 border border-pink-500/20 rounded-xl text-white text-xs focus:border-pink-500 focus:outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">Título del Servicio *</label>
                <input
                  type="text"
                  required
                  value={serviceFormTitle}
                  onChange={e => setServiceFormTitle(e.target.value)}
                  placeholder="Ej. Manicura Rusa Combinada"
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Precio + Duración */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">Precio COP *</label>
                  <input
                    type="number"
                    required
                    value={serviceFormPrice}
                    onChange={e => setServiceFormPrice(e.target.value)}
                    placeholder="85000"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">Duración (min) *</label>
                  <input
                    type="number"
                    required
                    value={serviceFormDuration}
                    onChange={e => setServiceFormDuration(e.target.value)}
                    placeholder="90"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-200/70 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={serviceFormDesc}
                  onChange={e => setServiceFormDesc(e.target.value)}
                  placeholder="Incluye limpieza profunda, tips y esmaltado semipermanente"
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-pink-500/20 rounded-xl text-white text-sm focus:border-pink-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-pink-300 text-sm font-semibold hover:bg-pink-950/30 border border-pink-500/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingService ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: CONFIRMAR BORRADO                    */}
      {/* ════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#150d15] border border-red-500/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Confirmar Eliminación</h3>
            </div>
            <p className="text-xs text-pink-200/70">
              ¿Estás segura de que deseas eliminar <span className="text-white font-bold">"{deleteTarget.name}"</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl text-xs text-pink-300 hover:bg-pink-950/40 border border-pink-500/20 font-semibold">
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingItem}
                className="px-4 py-2 rounded-xl text-xs bg-red-600 hover:bg-red-500 text-white font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {deletingItem ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
