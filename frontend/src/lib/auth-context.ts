// Auth context para guardar el JWT de NestJS junto con la sesión de Supabase
import { getSupabase } from './supabase/client';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')
    ? 'https://barber-choa-production.up.railway.app/api'
    : 'http://localhost:4000/api');
const NESTJS_TOKEN_KEY = 'barber_choa_nestjs_token';
const NESTJS_USER_KEY = 'barber_choa_nestjs_user';

export interface NestJSUser {
  id: string;
  email: string;
  role: string;
  worker?: any;
  accessToken: string;
}

export function getNestJSToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(NESTJS_TOKEN_KEY);
}

export function setNestJSToken(token: string, user: NestJSUser): void {
  localStorage.setItem(NESTJS_TOKEN_KEY, token);
  localStorage.setItem(NESTJS_USER_KEY, JSON.stringify(user));
}

export function clearNestJSToken(): void {
  localStorage.removeItem(NESTJS_TOKEN_KEY);
  localStorage.removeItem(NESTJS_USER_KEY);
}

export function getNestJSUser(): NestJSUser | null {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem(NESTJS_USER_KEY);
  return u ? JSON.parse(u) : null;
}

// Login via NestJS (usado por los admin pages)
export async function nestJSLogin(email: string, password: string): Promise<NestJSUser> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Error al iniciar sesión');
  }

  const data = await res.json();
  const user: NestJSUser = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.role,
    worker: data.user.worker,
    accessToken: data.accessToken,
  };
  setNestJSToken(data.accessToken, user);
  return user;
}

export function nestJSLogout(): void {
  clearNestJSToken();
}

// Helper para hacer requests autenticadas al backend NestJS
export async function nestJSFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getNestJSToken();
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}
