import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkerDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsBoolean()
  accepts_appointments?: boolean;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  // Redes sociales del trabajador
  @IsOptional()
  @IsString()
  instagram_url?: string;

  @IsOptional()
  @IsString()
  facebook_url?: string;

  @IsOptional()
  @IsString()
  tiktok_url?: string;
}

export class UpdateWorkerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsBoolean()
  accepts_appointments?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  // Redes sociales del trabajador
  @IsOptional()
  @IsString()
  instagram_url?: string;

  @IsOptional()
  @IsString()
  facebook_url?: string;

  @IsOptional()
  @IsString()
  tiktok_url?: string;
}

export class CreateServiceDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @Min(15)
  duration_minutes: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  buffer_minutes?: number;

  @IsOptional()
  @IsBoolean()
  requires_appointment?: boolean;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(15)
  duration_minutes?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  buffer_minutes?: number;

  @IsOptional()
  @IsBoolean()
  requires_appointment?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreatePortfolioItemDto {
  @IsString()
  image_url: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUUID()
  worker_id?: string;

  @IsOptional()
  @IsUUID()
  service_id?: string;
}

export class UpdatePortfolioItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ScheduleDayDto {
  @IsString()
  start_time: string;

  @IsString()
  end_time: string;

  @IsOptional()
  @IsString()
  break_start?: string;

  @IsOptional()
  @IsString()
  break_end?: string;

  @IsBoolean()
  is_active: boolean;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  business_name?: string;

  @IsOptional()
  @IsString()
  whatsapp_number?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  instagram_url?: string;

  @IsOptional()
  @IsString()
  facebook_url?: string;

  @IsOptional()
  @IsString()
  tiktok_url?: string;

  @IsOptional()
  @IsString()
  website_url?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  booking_message?: string;

  @IsOptional()
  @IsString()
  hero_image_url?: string;

  @IsOptional()
  @IsString()
  map_url?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class QueueActionDto {
  @IsUUID()
  worker_id: string;
}

export class AddWalkInDto {
  @IsString()
  client_name: string;

  @IsOptional()
  @IsString()
  client_phone?: string;

  @IsUUID()
  worker_id: string;
}

export class AdvanceQueueDto {
  @IsUUID()
  worker_id: string;
}

export class RemoveQueueItemDto {
  @IsUUID()
  queue_item_id: string;
}