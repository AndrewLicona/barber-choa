'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Actualiza el favicon dinámicamente según la sección (Barbería vs Manicura).
 * NO elimina elementos del DOM con remove() para no romper la reconciliación
 * del Virtual DOM de React 19 / Next.js 16.
 */
export default function DynamicFavicon() {
  const pathname = usePathname();

  useEffect(() => {
    let targetIcon = '/favicon.ico';

    if (pathname.startsWith('/barberia')) {
      targetIcon = '/favicon-barberia.png';
    } else if (pathname.startsWith('/manicura')) {
      targetIcon = '/favicon-manicura.png';
    }

    try {
      // Buscar o crear un tag específico controlado por nosotros
      let link = document.getElementById('app-dynamic-favicon') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.id = 'app-dynamic-favicon';
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      if (link.getAttribute('href') !== targetIcon) {
        link.setAttribute('href', targetIcon);
      }
    } catch {
      // Entorno seguro en caso de fallos de DOM
    }
  }, [pathname]);

  return null;
}
