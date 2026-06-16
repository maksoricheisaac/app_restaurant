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
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BlobService } from '../blob/blob.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { MAX_FILE_SIZE_BYTES } from '../blob/constants/blob.constants';
import type { Tenant } from '@prisma/client';
import type { Request } from 'express';

const NOT_DELETED = { deletedAt: null };

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

@Controller('/media')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class MediaController {
  constructor(
    private readonly blobService: BlobService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Menu item image ──────────────────────────────────────────────────────

  @Post('/upload/menu-item/:id')
  @Roles('owner', 'manager', 'head_chef')
  @UseInterceptors(uploadInterceptor())
  async uploadMenuItemImage(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @UploadedFile(fileValidator) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, tenantId: tenant.id, ...NOT_DELETED },
      select: { id: true, imagePathname: true },
    });
    if (!item) throw new NotFoundException('Menu item introuvable');

    const requestId = (req as Request & { requestId?: string }).requestId;
    const uploaded = await this.blobService.replaceImage(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        tenantId: tenant.id,
        context: 'menu-items',
        oldPathname: item.imagePathname,
      },
      requestId,
    );

    await this.prisma.menuItem.update({
      where: { id },
      data: { image: uploaded.url, imagePathname: uploaded.pathname },
    });

    return { url: uploaded.url, pathname: uploaded.pathname };
  }

  @Delete('/menu-item/:id/image')
  @Roles('owner', 'manager', 'head_chef')
  async deleteMenuItemImage(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, tenantId: tenant.id, ...NOT_DELETED },
      select: { id: true, imagePathname: true },
    });
    if (!item) throw new NotFoundException('Menu item introuvable');
    if (!item.imagePathname) return { message: 'Aucune image associée' };

    const requestId = (req as Request & { requestId?: string }).requestId;
    await this.blobService.deleteImage(item.imagePathname, requestId);

    await this.prisma.menuItem.update({
      where: { id },
      data: { image: null, imagePathname: null },
    });

    return { message: 'Image supprimée' };
  }

  // ── Category image ───────────────────────────────────────────────────────

  @Post('/upload/category/:id')
  @Roles('owner', 'manager', 'head_chef')
  @UseInterceptors(uploadInterceptor())
  async uploadCategoryImage(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @UploadedFile(fileValidator) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const category = await this.prisma.menuCategory.findFirst({
      where: { id, tenantId: tenant.id, ...NOT_DELETED },
      select: { id: true, imagePathname: true },
    });
    if (!category) throw new NotFoundException('Catégorie introuvable');

    const requestId = (req as Request & { requestId?: string }).requestId;
    const uploaded = await this.blobService.replaceImage(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        tenantId: tenant.id,
        context: 'categories',
        oldPathname: category.imagePathname,
      },
      requestId,
    );

    await this.prisma.menuCategory.update({
      where: { id },
      data: { imageUrl: uploaded.url, imagePathname: uploaded.pathname },
    });

    return { url: uploaded.url, pathname: uploaded.pathname };
  }

  @Delete('/category/:id/image')
  @Roles('owner', 'manager', 'head_chef')
  async deleteCategoryImage(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const category = await this.prisma.menuCategory.findFirst({
      where: { id, tenantId: tenant.id, ...NOT_DELETED },
      select: { id: true, imagePathname: true },
    });
    if (!category) throw new NotFoundException('Catégorie introuvable');
    if (!category.imagePathname) return { message: 'Aucune image associée' };

    const requestId = (req as Request & { requestId?: string }).requestId;
    await this.blobService.deleteImage(category.imagePathname, requestId);

    await this.prisma.menuCategory.update({
      where: { id },
      data: { imageUrl: null, imagePathname: null },
    });

    return { message: 'Image supprimée' };
  }

  // ── Tenant logo ──────────────────────────────────────────────────────────

  @Post('/upload/tenant-logo')
  @Roles('owner')
  @UseInterceptors(uploadInterceptor())
  async uploadTenantLogo(
    @CurrentTenant() tenant: Tenant,
    @UploadedFile(fileValidator) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    const uploaded = await this.blobService.replaceImage(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        tenantId: tenant.id,
        context: 'tenant-logo',
        oldPathname: (tenant as any).logoPathname ?? null,
      },
      requestId,
    );

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { logo: uploaded.url, logoPathname: uploaded.pathname },
    });

    return { url: uploaded.url, pathname: uploaded.pathname };
  }

  @Delete('/tenant-logo')
  @Roles('owner')
  async deleteTenantLogo(@CurrentTenant() tenant: Tenant, @Req() req: Request) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { logoPathname: true },
    });
    if (t?.logoPathname) {
      const requestId = (req as Request & { requestId?: string }).requestId;
      await this.blobService.deleteImage(t.logoPathname, requestId);
    }
    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { logo: null, logoPathname: null },
    });
    return { message: 'Logo supprimé' };
  }

  // ── Tenant banner ────────────────────────────────────────────────────────

  @Post('/upload/tenant-banner')
  @Roles('owner')
  @UseInterceptors(uploadInterceptor())
  async uploadTenantBanner(
    @CurrentTenant() tenant: Tenant,
    @UploadedFile(fileValidator) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { bannerPathname: true },
    });

    const requestId = (req as Request & { requestId?: string }).requestId;
    const uploaded = await this.blobService.replaceImage(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        tenantId: tenant.id,
        context: 'tenant-banner',
        oldPathname: t?.bannerPathname ?? null,
      },
      requestId,
    );

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { bannerUrl: uploaded.url, bannerPathname: uploaded.pathname },
    });

    return { url: uploaded.url, pathname: uploaded.pathname };
  }

  @Delete('/tenant-banner')
  @Roles('owner')
  async deleteTenantBanner(
    @CurrentTenant() tenant: Tenant,
    @Req() req: Request,
  ) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { bannerPathname: true },
    });
    if (t?.bannerPathname) {
      const requestId = (req as Request & { requestId?: string }).requestId;
      await this.blobService.deleteImage(t.bannerPathname, requestId);
    }
    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { bannerUrl: null, bannerPathname: null },
    });
    return { message: 'Bannière supprimée' };
  }
}
