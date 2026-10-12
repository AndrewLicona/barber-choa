'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/auth-context';

interface UseFetchReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T = any>(url: string, options: RequestInit = {}): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Agregar prefijo /api si no lo tiene
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;

    fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            if (errorData.message) {
              errorMessage = Array.isArray(errorData.message) 
                ? errorData.message.join(', ') 
                : errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // Ignorar error parsing JSON
          }
          throw new Error(errorMessage);
        }
        return res.json();
      })
      .then((data) => {
        if (mounted) {
          setData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Error al cargar datos');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [url, options]);

  return { data, loading, error };
}