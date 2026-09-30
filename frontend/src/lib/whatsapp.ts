import { Appointment, Service, Worker } from '@/types/database';

/**
 * Limpia y normaliza el número de teléfono para wa.me (añade código país si falta).
 */
export function formatPhoneNumber(phone: string, defaultCountryCode = '57'): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && !cleaned.startsWith('57')) {
    return `${defaultCountryCode}${cleaned}`;
  }
  return cleaned;
}

/**
 * Formatea valores monetarios (ej. $ 25.000)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Genera el enlace de WhatsApp para confirmación de cita.
 */
export function generateAppointmentWhatsAppLink({
  worker,
  service,
  clientName,
  dateTime,
  notes,
}: {
  worker: Worker;
  service: Service;
  clientName: string;
  dateTime: Date | string;
  notes?: string;
}): string {
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  const formattedDate = dateObj.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  
  const formattedTime = dateObj.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const businessIcon = service.business_type === 'barberia' ? '💈' : '💅';
  const businessName = service.business_type === 'barberia' ? 'Barbería Choa' : 'Choa Nails & Spa';

  const message = [
    `👋 *¡Hola ${worker.name}!*`,
    ``,
    `Acabo de reservar una cita en *${businessName}* ${businessIcon}:`,
    ``,
    `👤 *Cliente:* ${clientName}`,
    `✨ *Servicio:* ${service.title}`,
    `⏱️ *Duración:* ${service.duration_minutes} min`,
    `💵 *Valor:* ${formatCurrency(service.price)}`,
    `📅 *Fecha:* ${formattedDate}`,
    `⏰ *Hora:* ${formattedTime}`,
    notes ? `📝 *Nota:* ${notes}` : null,
    ``,
    `¿Me confirmas por favor la disponibilidad? ¡Muchas gracias! 🙌`,
  ]
    .filter(Boolean)
    .join('\n');

  const phone = formatPhoneNumber(worker.phone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Genera mensaje para notificar a un cliente en cola cuando falta poco para su turno.
 */
export function generateQueueAlertWhatsAppLink({
  clientName,
  clientPhone,
  position,
  barberName,
}: {
  clientName: string;
  clientPhone: string;
  position: number;
  barberName: string;
}): string {
  const message = [
    `💈 *¡Atención ${clientName}!*`,
    ``,
    `Tu turno con *${barberName}* en Barbería Choa está muy cerca:`,
    `📍 Estás en la posición *#${position}* de la fila.`,
    ``,
    `Por favor acércate al local para que no pierdas tu turno. ¡Te esperamos! ✂️`,
  ].join('\n');

  const phone = formatPhoneNumber(clientPhone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
