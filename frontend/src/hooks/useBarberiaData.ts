// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { Service, Worker, PortfolioItem } from '@/types/database';

export function useBarberiaData() {
  const [business, setBusiness] = useState<{ id: string; name: string; phone: string; address?: string } | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [masterBarber, setMasterBarber] = useState<Worker | null>(null);
  const [collabBarbers, setCollabBarbers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;

    try {
      const [bizRes, workersRes, servicesRes, portfolioRes] = await Promise.all([
        sb.from('businesses').select('*').eq('slug', 'barberia').maybeSingle(),
        sb
          .from('workers')
          .select('*')
          .eq('business_type', 'barberia')
          .eq('is_active', true)
          .order('created_at'),
        sb
          .from('services')
          .select('*')
          .eq('business_type', 'barberia')
          .eq('business_id', 'f880f993-a1a6-4e43-aa44-cc7df98fbd57')
          .eq('is_active', true)
          .order('created_at'),
        sb
          .from('portfolio_items')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);

      if (bizRes.data) {
        setBusiness(bizRes.data);
      }

      if (workersRes.data) {
        const loadedWorkers = workersRes.data as Worker[];
        setWorkers(loadedWorkers);
        setMasterBarber(
          loadedWorkers.find((w) => !w.accepts_appointments) || loadedWorkers[0] || null,
        );
        setCollabBarbers(loadedWorkers.filter((w) => w.accepts_appointments));
      }
      if (servicesRes.data) {
        setServices(servicesRes.data as Service[]);
      }
      if (portfolioRes.data) {
        setPortfolio(portfolioRes.data as PortfolioItem[]);
      }
    } catch (err) {
      console.error('Error cargando datos de barbería:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const sb = getSupabase();
    if (!sb) return;

    const channel = sb
      .channel('barberia-public-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_items' }, loadData)
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [loadData]);

  const activePhone = business?.phone || masterBarber?.phone || '+573001234567';

  return {
    business,
    phone: activePhone,
    services,
    workers,
    portfolio,
    masterBarber,
    collabBarbers,
    loading,
    refresh: loadData,
  };
}
