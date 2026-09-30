// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect legacy /admin/login to the admin selector.
 * Each business now has its own independent login.
 */
export default function AdminLoginRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-white/50 text-sm tracking-widest uppercase">Redirigiendo...</p>
      </div>
    </div>
  );
}
