import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { MAX_FILE_SIZE_BYTES } from '../blob/constants/blob.constants';
import type { Tenant } from '@prisma/client';
import type { Request } from 'express';

const uploadInterceptor = () =>
  FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  });

const fileValidator = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES }),
    new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
  ],
});

function requestIdOf(req: Request): string | undefined {
  return (req as Request & { requestId?: string }).requestId;
}

@Controller('/media')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // ── Menu item image ──────────────────────────────────────────────────────

  @Post('/upload/menu-item/:id')
  @Roles('owner', 'manager', 'head_chef')
  @UseInterceptors(uploadInterceptor())
  uploadMenuItemImage(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @UploadedFile(fileValidator) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.mediaService.uploadMenuItemImage(
      tenant.id,
      id,
      file,
      requestIdOf(req),
    );
  }

  @Delete('/menu-item/:id/image')
  @Roles('owner', 'manager', 'head_chef')
  deleteMenuItemImage(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.mediaService.deleteMenuItemImage(
      tenant.id,
      id,
      requestIdOf(req),
    );
  }

  // ── Category image ───────────────────────────────────────────────────────

  @Post('/upload/category/:id')
  @Roles('owner', 'manager', 'head_chef')
  @UseInterceptors(uploadInterceptor())
  uploadCategoryImage(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @UploadedFile(fileValidator) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.mediaService.uploadCategoryImage(
      tenant.id,
      id,
      file,
      requestIdOf(req),
    );
  }

  @Delete('/category/:id/image')
  @Roles('owner', 'manager', 'head_chef')
  deleteCategoryImage(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.mediaService.deleteCategoryImage(
      tenant.id,
      id,
      requestIdOf(req),
    );
  }

  // ── Tenant logo ──────────────────────────────────────────────────────────

  @Post('/upload/tenant-logo')
  @Roles('owner')
  @UseInterceptors(uploadInterceptor())
  uploadTenantLogo(
    @CurrentTenant() tenant: Tenant,
    @UploadedFile(fileValidator) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.mediaService.uploadTenantLogo(
      tenant.id,
      (tenant as any).logoPathname ?? null,
      file,
      requestIdOf(req),
    );
  }

  @Delete('/tenant-logo')
  @Roles('owner')
  deleteTenantLogo(@CurrentTenant() tenant: Tenant, @Req() req: Request) {
    return this.mediaService.deleteTenantLogo(tenant.id, requestIdOf(req));
  }

  // ── Tenant banner ────────────────────────────────────────────────────────

  @Post('/upload/tenant-banner')
  @Roles('owner')
  @UseInterceptors(uploadInterceptor())
  uploadTenantBanner(
    @CurrentTenant() tenant: Tenant,
    @UploadedFile(fileValidator) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.mediaService.uploadTenantBanner(
      tenant.id,
      file,
      requestIdOf(req),
    );
  }

  @Delete('/tenant-banner')
  @Roles('owner')
  deleteTenantBanner(@CurrentTenant() tenant: Tenant, @Req() req: Request) {
    return this.mediaService.deleteTenantBanner(tenant.id, requestIdOf(req));
  }
}
