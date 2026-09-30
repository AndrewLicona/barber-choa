export type BusinessType = 'barberia' | 'manicura';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Dom, 1=Lun, ... 6=Sáb

export const DAY_NAMES: Record<number, string> = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
};

export const DAY_SHORT: Record<number, string> = {
  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié',
  4: 'Jue', 5: 'Vie', 6: 'Sáb',
};

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type QueueStatus = 'WAITING' | 'IN_SERVICE' | 'FINISHED' | 'CANCELLED';

export interface Worker {
  id: string;
  user_id?: string | null;
  business_id?: string;
  name: string;
  business_type: BusinessType;
  phone: string;
  accepts_appointments: boolean;
  is_active: boolean;
  avatar_url?: string | null;
  bio?: string | null;
  specialties?: string[];
  display_order?: number;
  is_public?: boolean;
  created_at?: string;
}

export interface Service {
  id: string;
  business_id?: string;
  title: string;
  business_type: BusinessType;
  duration_minutes: number;
  price: number;
  description?: string | null;
  category?: string | null;
  image_url?: string | null;
  buffer_minutes?: number;
  requires_appointment?: boolean;
  display_order?: number;
  is_public?: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface Schedule {
  id: string;
  worker_id: string;
  day_of_week: number; // 0: Dom, 6: Sáb
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  break_start?: string | null;
  break_end?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface ScheduleException {
  id: string;
  worker_id: string;
  date: string; // YYYY-MM-DD
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
  is_available?: boolean;
  created_at?: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  worker_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  client_email?: string | null;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  status: AppointmentStatus;
  notes?: string | null;
  created_at?: string;
  // Joins opcionales
  worker?: Worker;
  service?: Service;
}

export interface LiveQueueItem {
  id: string;
  business_id: string;
  worker_id: string;
  client_name: string;
  client_phone?: string | null;
  status: QueueStatus;
  position: number;
  estimated_wait_minutes: number;
  created_at?: string;
  worker?: Worker;
}

export interface BusinessSettings {
  id: string;
  business_id?: string;
  key: string;
  value: string;
  updated_at?: string;
}

export interface PortfolioItem {
  id: string;
  business_id: string;
  worker_id?: string | null;
  service_id?: string | null;
  title?: string | null;
  image_url: string;
  tags?: string[];
  is_active?: boolean;
  created_at?: string;
}

export interface GalleryItem {
  id: string;
  business_type: BusinessType;
  image_url: string;
  title?: string | null;
  category?: string | null;
  tags?: string[];
  is_featured?: boolean;
  created_at?: string;
}
