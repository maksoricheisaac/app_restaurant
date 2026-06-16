import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import { MonitoringService } from '../common/monitoring/monitoring.service';
import {
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_DIMENSION,
  WEBP_QUALITY,
} from './constants/blob.constants';
import { validateMagicBytes } from './utils/file-validation.util';
import type {
  UploadedBlob,
  UploadImageParams,
  ReplaceImageParams,
} from './interfaces/blob.interfaces';

@Injectable()
export class BlobService {
  private readonly logger = new Logger(BlobService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly monitoring: MonitoringService,
  ) {}

  async uploadImage(
    params: UploadImageParams,
    requestId?: string,
  ): Promise<UploadedBlob> {
    const { buffer, mimeType, tenantId, context } = params;

    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      throw new BadRequestException(
        `Type de fichier non autorisé: ${mimeType}`,
      );
    }

    if (!validateMagicBytes(buffer, mimeType)) {
      throw new BadRequestException(
        'Contenu du fichier invalide ou non conforme au type déclaré',
      );
    }

    // Strip accidental surrounding quotes that can appear when the value is
    // copy-pasted with delimiters into .env (e.g.  ="\"token\"" → token).
    const rawToken = this.config.get<string>('BLOB_READ_WRITE_TOKEN');
    const token = rawToken?.replace(/^["']|["']$/g, '');
    if (!token) {
      throw new InternalServerErrorException(
        'Blob storage non configuré — BLOB_READ_WRITE_TOKEN manquant',
      );
    }

    // Resize to max dimension, convert to WebP for bandwidth optimisation
    let processedBuffer: Buffer;
    try {
      processedBuffer = await sharp(buffer)
        .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    } catch (err) {
      this.monitoring.captureError(err, {
        requestId,
        tenantId,
        context: 'blob:process',
        extra: { mimeType },
      });
      throw new InternalServerErrorException(
        "Erreur lors du traitement de l'image",
      );
    }

    const pathname = `tenants/${tenantId}/${context}/${crypto.randomUUID()}.webp`;
    const start = Date.now();

    try {
      const blob = await put(pathname, processedBuffer, {
        access: 'public',
        contentType: 'image/webp',
        token,
      });

      this.logger.log(
        JSON.stringify({
          event: 'blob_uploaded',
          pathname: blob.pathname,
          tenantId,
          context,
          originalSizeBytes: buffer.length,
          processedSizeBytes: processedBuffer.length,
          latencyMs: Date.now() - start,
          requestId,
        }),
      );

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: 'image/webp',
        sizeBytes: processedBuffer.length,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);

      // Vercel Blob store is configured as private — public blobs are required
      // for images to be accessible by restaurant customers without authentication.
      // Fix: Vercel Dashboard → Storage → <store> → Settings → set Default Access to Public.
      if (errMsg.includes('private store') || errMsg.includes('Cannot use public access')) {
        this.logger.error(
          '[BlobService] Vercel Blob store is private. Images cannot be served publicly. ' +
          'Go to Vercel Dashboard → Storage → your store → Settings → set Default Blob Access to Public.',
        );
        throw new InternalServerErrorException(
          'Le store Vercel Blob est configuré en mode PRIVÉ. ' +
          'Les images restaurant doivent être publiquement accessibles. ' +
          'Allez dans Vercel Dashboard → Storage → votre store → Settings → ' +
          'passez "Default Blob Access" en PUBLIC, puis copiez le nouveau BLOB_READ_WRITE_TOKEN.',
        );
      }

      this.monitoring.captureError(err, {
        requestId,
        tenantId,
        context: 'blob:upload',
        extra: { pathname, error: errMsg },
      });
      throw new InternalServerErrorException(
        "Erreur lors de l'upload de l'image",
      );
    }
  }

  async deleteImage(pathname: string, requestId?: string): Promise<void> {
    const raw = this.config.get<string>('BLOB_READ_WRITE_TOKEN');
    const token = raw?.replace(/^["']|["']$/g, '');
    if (!token) return; // graceful degradation in dev without token

    try {
      await del(pathname, { token });
      this.logger.log(
        JSON.stringify({ event: 'blob_deleted', pathname, requestId }),
      );
    } catch (err) {
      // Delete failures must not block the calling operation
      this.monitoring.captureError(err, {
        requestId,
        context: 'blob:delete',
        extra: { pathname },
      });
    }
  }

  async replaceImage(
    params: ReplaceImageParams,
    requestId?: string,
  ): Promise<UploadedBlob> {
    const { oldPathname, ...uploadParams } = params;

    // Upload new image first — if this fails we keep the old one intact
    const uploaded = await this.uploadImage(uploadParams, requestId);

    // Best-effort cleanup of the replaced blob
    if (oldPathname) {
      await this.deleteImage(oldPathname, requestId);
    }

    return uploaded;
  }
}
