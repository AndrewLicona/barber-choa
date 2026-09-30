import type { SupabaseClient } from '@supabase/supabase-js';

type BusinessAccessRow = {
  role: 'SUPERADMIN' | 'ADMIN' | 'WORKER';
  is_active: boolean;
  business: { slug: string } | { slug: string }[] | null;
};

export async function canManageBusiness(
  supabase: SupabaseClient,
  businessSlug: 'barberia' | 'manicura',
) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return false;

  const { data, error } = await supabase
    .from('user_business_access')
    .select('role, is_active, business:businesses(slug)')
    .eq('auth_user_id', user.id)
    .eq('is_active', true);

  if (error || !data) return false;

  return (data as BusinessAccessRow[]).some((access) => {
    if (access.role === 'SUPERADMIN') return true;
    const business = Array.isArray(access.business) ? access.business[0] : access.business;
    return access.role === 'ADMIN' && business?.slug === businessSlug;
  });
}
