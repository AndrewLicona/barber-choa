import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class MediaService {
  private getSupabaseAdmin() {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eukuwryssmpkqkiwcufr.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a3V3cnlzc21wa3FraXdjdWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY3MzQ5MCwiZXhwIjoyMTA1MjQ5NDkwfQ.4hUFbDT8CPA3ykv_36uxgqxw7WkC0Z3Fn-lrANm6vyY';

    if (!url || !serviceRoleKey) {
      throw new BadRequestException('Supabase storage not configured');
    }

    return createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async getUploadUrl(
    businessId: string,
    folder: 'avatars' | 'portfolio' | 'services',
    fileName: string,
    contentType: string,
  ) {
    const supabase = this.getSupabaseAdmin();

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
    }

    // Max 5MB
    const maxSize = 5 * 1024 * 1024;

    const ext = fileName.split('.').pop() || 'jpg';
    const uniqueName = `${randomUUID()}.${ext}`;
    const filePath = `${businessId}/${folder}/${uniqueName}`;

    const bucketName = 'barber-choa-media';

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath);

    if (error) {
      throw new BadRequestException(`Failed to create upload URL: ${error.message}`);
    }

    return {
      uploadUrl: data.signedUrl,
      filePath,
      publicUrl: `https://eukuwryssmpkqkiwcufr.supabase.co/storage/v1/object/public/barber-choa-media/${filePath}`,
    };
  }

  async deleteFile(filePath: string) {
    const supabase = this.getSupabaseAdmin();

    const { error } = await supabase.storage.from('barber-choa-media').remove([filePath]);

    if (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }

    return { success: true };
  }
}
