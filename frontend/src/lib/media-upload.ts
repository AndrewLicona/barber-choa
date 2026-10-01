import { getSupabase } from './supabase/client';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')
    ? 'https://barber-choa-production.up.railway.app/api'
    : 'http://localhost:4000/api');

export type MediaFolder = 'avatars' | 'portfolio' | 'services';

interface UploadUrlResponse {
  uploadUrl: string;
  filePath: string;
  publicUrl: string;
}

export async function getUploadUrl(
  folder: MediaFolder,
  fileName: string,
  contentType: string,
  accessToken: string,
): Promise<UploadUrlResponse> {
  const response = await fetch(`${API_URL}/admin/media/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ folder, fileName, contentType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get upload URL');
  }

  return response.json();
}

export async function uploadFile(
  uploadUrl: string,
  file: File,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }
}

export async function uploadMedia(
  folder: MediaFolder,
  file: File,
  accessToken: string,
): Promise<string> {
  // 1. Get signed upload URL
  const { uploadUrl, publicUrl } = await getUploadUrl(
    folder,
    file.name,
    file.type,
    accessToken,
  );

  // 2. Upload file directly to Supabase Storage
  await uploadFile(uploadUrl, file);

  return publicUrl;
}

export async function deleteMedia(
  filePath: string,
  accessToken: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/admin/media/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ filePath }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete media');
  }
}

export function getPublicMediaUrl(filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/barber-choa-media/${filePath}`;
}
