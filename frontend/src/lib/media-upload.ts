import { getSupabase } from './supabase/client';

const BUCKET = 'barber-choa-media';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')
    ? 'https://barber-choa-production.up.railway.app/api'
    : 'http://localhost:4000/api');

export type MediaFolder = 'avatars' | 'portfolio' | 'services';

/** Upload directly to Supabase Storage (anon key, no auth required with public RLS policy) */
export async function uploadMedia(
  folder: MediaFolder,
  file: File,
  _accessToken?: string,  // kept for API compatibility but no longer required
): Promise<string> {
  const sb = getSupabase();
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await sb.storage
    .from(BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }

  const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function deleteMedia(
  filePath: string,
  _accessToken?: string,
): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.storage.from(BUCKET).remove([filePath]);
  if (error) {
    throw new Error(`Error al eliminar la imagen: ${error.message}`);
  }
}

export function getPublicMediaUrl(filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${filePath}`;
}
