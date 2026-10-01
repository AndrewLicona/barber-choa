'use client';

import React, { useState } from 'react';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { uploadMedia } from '@/lib/media-upload';

interface ImageUploaderProps {
  label?: string;
  folder: 'avatars' | 'services' | 'portfolio';
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: 'square' | 'video' | 'portrait';
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
}

export function ImageUploader({
  label = 'Fotografía / Imagen',
  folder,
  value,
  onChange,
  aspectRatio = 'video',
  onError,
  onSuccess,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [mode, setMode] = useState<'upload' | 'url'>('upload');

  const aspectStyles = {
    square: 'aspect-square max-w-[140px]',
    video: 'aspect-video max-w-full',
    portrait: 'aspect-[4/5] max-w-[180px]',
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadMedia(folder, file);
      onChange(publicUrl);
      onSuccess?.('Imagen subida correctamente');
    } catch (err: any) {
      onError?.(err?.message || 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono uppercase tracking-wider text-zinc-300">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
              mode === 'upload'
                ? 'bg-[#d4af37]/20 text-[#f3e5ab] font-bold border border-[#d4af37]/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Subir archivo
          </button>
          <span className="text-zinc-600 text-[10px]">•</span>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
              mode === 'url'
                ? 'bg-[#d4af37]/20 text-[#f3e5ab] font-bold border border-[#d4af37]/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Pegar URL
          </button>
        </div>
      </div>

      {/* Preview Card */}
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 group">
          <div className={`${aspectStyles[aspectRatio]} w-full mx-auto relative`}>
            <img
              src={value}
              alt="Vista previa"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-white transition-colors"
            title="Quitar imagen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div>
          {mode === 'upload' ? (
            <label className="flex flex-col items-center justify-center p-6 border border-dashed border-white/15 hover:border-[#d4af37]/50 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-all text-center">
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Loader2 className="w-6 h-6 text-[#d4af37] animate-spin" />
                  <span className="text-xs text-[#f3e5ab] font-mono">
                    Subiendo archivo...
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-[#d4af37] mb-2" />
                  <span className="text-xs font-semibold text-zinc-200">
                    Toca para seleccionar foto
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono mt-1">
                    PNG, JPG, WEBP hasta 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </>
              )}
            </label>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  setUrlInput(raw);
                  const clean = raw.trim().replace(/^['"\s]+|['",;\s]+$/g, '');
                  if (clean.startsWith('http://') || clean.startsWith('https://')) {
                    onChange(clean);
                  }
                }}
                onBlur={() => {
                  if (urlInput.trim()) {
                    const clean = urlInput.trim().replace(/^['"\s]+|['",;\s]+$/g, '');
                    onChange(clean);
                    setUrlInput('');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (urlInput.trim()) {
                      const clean = urlInput.trim().replace(/^['"\s]+|['",;\s]+$/g, '');
                      onChange(clean);
                      setUrlInput('');
                    }
                  }
                }}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]/60"
              />
              <button
                type="button"
                onClick={() => {
                  if (urlInput.trim()) {
                    const clean = urlInput.trim().replace(/^['"\s]+|['",;\s]+$/g, '');
                    onChange(clean);
                    setUrlInput('');
                  }
                }}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#f3e5ab] border border-[#d4af37]/40 cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
