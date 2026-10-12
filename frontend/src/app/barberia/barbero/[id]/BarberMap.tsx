'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface BarberMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
}

export default function BarberMap({ latitude, longitude, title, address }: BarberMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
    });

    // Tile layer - OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Marker personalizado
    const customIcon = L.divIcon({
      className: 'custom-barber-marker',
      html: `
        <div style="
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        ">
          ✂️
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });

    // Popup con info
    const popupContent = `
      <div style="padding: 8px; min-width: 200px; font-family: system-ui, sans-serif;">
        <div style="font-weight: 700; font-size: 16px; color: #111827; margin-bottom: 4px;">
          ${title || 'Ubicación'}
        </div>
        ${address ? `<div style="font-size: 13px; color: #6b7280; margin-bottom: 8px; line-height: 1.4;">${address}</div>` : ''}
        <a 
          href="https://maps.google.com/?q=${latitude},${longitude}" 
          target="_blank" 
          rel="noopener noreferrer"
          style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background: linear-gradient(135deg, #f59e0b, #f97316);
            color: white;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s;
          "
          onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(245,158,11,0.4)'"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
          Abrir en Google Maps
        </a>
      `;

    const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);

    // Popup con info
    marker.bindPopup(popupContent, {
      className: 'custom-popup',
      minWidth: 220,
      maxWidth: 280,
    });

    // Abrir popup por defecto
    marker.openPopup();

    // Cleanup
    return () => {
      map.remove();
    };
  }, [latitude, longitude, title, address]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '350px',
        minHeight: '350px',
      }} 
      aria-label="Mapa de ubicación"
    />
  );
}