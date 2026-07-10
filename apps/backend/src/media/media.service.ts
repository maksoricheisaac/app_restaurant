import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { BlobService } from '../blob/blob.service';
import { PrismaService } from '../prisma/prisma.service';

const NOT_DELETED = { deletedAt: null };

interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
}

/**
 * Couche service pour les uploads d'images (menu items, catégories, logo et
 * bannière du tenant). Extrait de MediaController, qui parlait directement
 * à Prisma/BlobService sans couche service — seul contrôleur du projet
 * dans ce cas, ce qui cassait la stratification contrôleur→service→Prisma
 * respectée partout ailleurs et rendait la logique impossible à tester
 * unitairement sans monter tout le contrôleur HTTP.
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly blobService: BlobService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Menu item image ──────────────────────────────────────────────────────

  async uploadMenuItemImage(
    tenantId: string,
    menuItemId: string,
    file: UploadedImageFile,
    requestId?: string,
  ) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, tenantId, ...NOT_DELETED },
      select: { id: true, imagePathname: true },
    });
    if (!item) throw new NotFoundException('Menu item introuvable');

    const uploaded = await this.blobService.replaceImage(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        tenantId,
        context: 'menu-items',
        oldPathname: item.imagePathname,
      },
      requestId,
    );

    try {
      await this.prisma.menuItem.update({
        where: { id: menuItemId },
        data: { image: uploaded.url, imagePathname: uploaded.pathname },
      });
    } catch (err) {
      await this.cleanupOrphanedBlob(uploaded.pathname, requestId);
      throw err;
    }

    return { url: uploaded.url, pathname: uploaded.pathname };
  }

  async deleteMenuItemImage(
    tenantId: string,
    menuItemId: string,
    requestId?: string,
  ) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, tenantId, ...NOT_DELETED },
      select: { id: true, imagePathname: true },
    });
    if (!item) throw new NotFoundException('Menu item introuvable');
    if (!item.imagePathname) return { message: 'Aucune image associée' };

    await this.blobService.deleteImage(item.imagePathname, requestId);

    await this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: { image: null, imagePathname: null },
    });

    return { message: 'Image supprimée' };
  }

  // ── Category image ───────────────────────────────────────────────────────

  async uploadCategoryImage(
    tenantId: string,
    categoryId: string,
    file: UploadedImageFile,
    requestId?: string,
  ) {
    const category = await this.prisma.menuCategory.findFirst({
      where: { id: categoryId, tenantId, ...NOT_DELETED },
      select: { id: true, imagePathname: true },
    });
    if (!category) throw new NotFoundException('Catégorie introuvable');

    const uploaded = await this.blobService.replaceImage(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        tenantId,
        context: 'categories',
        oldPathname: category.imagePathname,
      },
      requestId,
    );

    try {
      await this.prisma.menuCategory.update({
        where: { id: categoryId },
        data: { imageUrl: uploaded.url, imagePathname: uploaded.pathname },
      });
    } catch (err) {
      await this.cleanupOrphanedBlob(uploaded.pathname, requestId);
      throw err;
    }

    return { url: uploaded.url, pathname: uploaded.pathname };
  }

  async deleteCategoryImage(
    tenantId: string,
    categoryId: string,
    requestId?: string,
  ) {
    const category = await this.prisma.menuCategory.findFirst({
      where: { id: categoryId, tenantId, ...NOT_DELETED },
      select: { id: true, imagePathname: true },
    });
    if (!category) throw new NotFoundException('Catégorie introuvable');
    if (!category.imagePathname) return { message: 'Aucune image associée' };

    await this.blobService.deleteImage(category.imagePathname, requestId);

    await this.prisma.menuCategory.update({
      where: { id: categoryId },
      data: { imageUrl: null, imagePathname: null },
    });

    return { message: 'Image supprimée' };
  }

  // ── Tenant logo ──────────────────────────────────────────────────────────

  async uploadTenantLogo(
    tenantId: string,
    currentLogoPathname: string | null,
    file: UploadedImageFile,
    requestId?: string,
  ) {
    const uploaded = await this.blobService.replaceImage(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        tenantId,
        context: 'tenant-logo',
        oldPathname: currentLogoPathname,
      },
      requestId,
    );

    try {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { logo: uploaded.url, logoPathname: uploaded.pathname },
      });
    } catch (err) {
      await this.cleanupOrphanedBlob(uploaded.pathname, requestId);
      throw err;
    }

    return { url: uploaded.url, pathname: uploaded.pathname };
  }

  async deleteTenantLogo(tenantId: string, requestId?: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { logoPathname: true },
    });
    if (t?.logoPathname) {
      await this.blobService.deleteImage(t.logoPathname, requestId);
    }
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logo: null, logoPathname: null },
    });
    return { message: 'Logo supprimé' };
  }

  // ── Tenant banner ────────────────────────────────────────────────────────

  async uploadTenantBanner(
    tenantId: string,
    file: UploadedImageFile,
    requestId?: string,
  ) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { bannerPathname: true },
    });

    const uploaded = await this.blobService.replaceImage(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        tenantId,
        context: 'tenant-banner',
        oldPathname: t?.bannerPathname ?? null,
      },
      requestId,
    );

    try {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { bannerUrl: uploaded.url, bannerPathname: uploaded.pathname },
      });
    } catch (err) {
      await this.cleanupOrphanedBlob(uploaded.pathname, requestId);
      throw err;
    }

    return { url: uploaded.url, pathname: uploaded.pathname };
  }

  async deleteTenantBanner(tenantId: string, requestId?: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { bannerPathname: true },
    });
    if (t?.bannerPathname) {
      await this.blobService.deleteImage(t.bannerPathname, requestId);
    }
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { bannerUrl: null, bannerPathname: null },
    });
    return { message: 'Bannière supprimée' };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Le blob storage ne peut pas participer à la transaction Postgres : si
   * l'update DB échoue après un upload réussi, le blob devient orphelin.
   * Best-effort de nettoyage plutôt que de laisser fuiter du stockage.
   */
  private async cleanupOrphanedBlob(pathname: string, requestId?: string) {
    try {
      await this.blobService.deleteImage(pathname, requestId);
    } catch (cleanupErr) {
      this.logger.error(
        `Échec du nettoyage du blob orphelin ${pathname} après une erreur DB`,
        cleanupErr,
      );
    }
  }
}
