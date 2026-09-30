import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    businessId?: string;
    role: string;
  };
}

@Controller('admin/media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  async getUploadUrl(
    @Body() body: { folder: 'avatars' | 'portfolio' | 'services'; fileName: string; contentType: string },
    @Req() req: AuthenticatedRequest,
  ) {
    if (!body.fileName || !body.contentType) {
      throw new BadRequestException('fileName and contentType are required');
    }

    // Solo ADMIN o SUPERADMIN pueden subir
    const allowedRoles = ['SUPERADMIN', 'ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new BadRequestException('Not authorized to upload media');
    }

    const businessId = req.user.businessId;
    if (!businessId && req.user.role !== 'SUPERADMIN') {
      throw new BadRequestException('Business ID not found in token');
    }

    return this.mediaService.getUploadUrl(
      businessId || 'global',
      body.folder,
      body.fileName,
      body.contentType,
    );
  }

  @Delete('delete')
  async deleteFile(@Body() body: { filePath: string }, @Req() req: AuthenticatedRequest) {
    const allowedRoles = ['SUPERADMIN', 'ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new BadRequestException('Not authorized to delete media');
    }

    return this.mediaService.deleteFile(body.filePath);
  }
}
