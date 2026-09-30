// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GenericLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
        <p className="text-white/60 text-xs tracking-widest uppercase font-mono">Cargando acceso...</p>
      </div>
    </div>
  );
}
