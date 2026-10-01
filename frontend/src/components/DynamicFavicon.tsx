'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Actualiza el favicon dinámicamente según la sección.
 * Por defecto usa el logo/icono de Barber Choa para la raíz (/), /admin y /barberia.
 * Para /manicura usa el icono de manicura.
 */
export default function DynamicFavicon() {
  const pathname = usePathname();

  useEffect(() => {
    const isManicura = pathname.startsWith('/manicura');
    const targetIcon = isManicura ? '/favicon-manicura.png' : '/favicon-barberia.png';

    try {
      const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
      rels.forEach((rel) => {
        let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.rel = rel;
          document.head.appendChild(link);
        }
        link.href = targetIcon;
        link.type = 'image/png';
      });

      // Asegurar que el título de la pestaña sea claro
      if (pathname === '/admin' && !document.title.includes('Admin')) {
        document.title = 'Panel de Administración | Choa Studio';
      }
    } catch {
      // Safe fallback
    }
  }, [pathname]);

  return null;
}
