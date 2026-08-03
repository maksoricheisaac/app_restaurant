import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { BlobService } from '../blob/blob.service';
import { PrismaService } from '../prisma/prisma.service';
import { RESTAURANT_ID } from '../restaurant/restaurant.constants';

const NOT_DELETED = { deletedAt: null };

interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
}

/**
 * Couche service pour les uploads d'images : plats, catégories, logo et
 * bannière de l'établissement.
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
    menuItemId: string,
    file: UploadedImageFile,
    requestId?: string,
  ) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, ...NOT_DELETED },
      select: { id: true, imagePathname: true },
    });
    if (!item) throw new NotFoundException('Menu item introuvable');

    const uploaded = await this.blobService.replaceImage(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
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

  async deleteMenuItemImage(menuItemId: string, requestId?: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, ...NOT_DELETED },
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
    categoryId: string,
    file: UploadedImageFile,
    requestId?: string,
  ) {
    const category = await this.prisma.menuCategory.findFirst({
      where: { id: categoryId, ...NOT_DELETED },
      select: { id: true, imagePathname: true },
    });
    if (!category) throw new NotFoundException('Catégorie introuvable');

    const uploaded = await this.blobService.replaceImage(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
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

  async deleteCategoryImage(categoryId: string, requestId?: string) {
    const category = await this.prisma.menuCategory.findFirst({
      where: { id: categoryId, ...NOT_DELETED },
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

  // ── Logo de l'établissement ──────────────────────────────────────────────

  async uploadRestaurantLogo(file: UploadedImageFile, requestId?: string) {
    const current = await this.prisma.restaurant.findUnique({
      where: { id: RESTAURANT_ID },
      select: { logoPathname: true },
    });

    const uploaded = await this.blobService.replaceImage(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        context: 'restaurant-logo',
        oldPathname: current?.logoPathname ?? null,
      },
      requestId,
    );

    try {
      await this.prisma.restaurant.update({
        where: { id: RESTAURANT_ID },
        data: { logo: uploaded.url, logoPathname: uploaded.pathname },
      });
    } catch (err) {
      await this.cleanupOrphanedBlob(uploaded.pathname, requestId);
      throw err;
    }

    return { url: uploaded.url, pathname: uploaded.pathname };
  }

  async deleteRestaurantLogo(requestId?: string) {
    const current = await this.prisma.restaurant.findUnique({
      where: { id: RESTAURANT_ID },
      select: { logoPathname: true },
    });
    if (current?.logoPathname) {
      await this.blobService.deleteImage(current.logoPathname, requestId);
    }
    await this.prisma.restaurant.update({
      where: { id: RESTAURANT_ID },
      data: { logo: null, logoPathname: null },
    });
    return { message: 'Logo supprimé' };
  }

  // ── Bannière de l'établissement ──────────────────────────────────────────

  async uploadRestaurantBanner(file: UploadedImageFile, requestId?: string) {
    const current = await this.prisma.restaurant.findUnique({
      where: { id: RESTAURANT_ID },
      select: { bannerPathname: true },
    });

    const uploaded = await this.blobService.replaceImage(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        context: 'restaurant-banner',
        oldPathname: current?.bannerPathname ?? null,
      },
      requestId,
    );

    try {
      await this.prisma.restaurant.update({
        where: { id: RESTAURANT_ID },
        data: { bannerUrl: uploaded.url, bannerPathname: uploaded.pathname },
      });
    } catch (err) {
      await this.cleanupOrphanedBlob(uploaded.pathname, requestId);
      throw err;
    }

    return { url: uploaded.url, pathname: uploaded.pathname };
  }

  async deleteRestaurantBanner(requestId?: string) {
    const current = await this.prisma.restaurant.findUnique({
      where: { id: RESTAURANT_ID },
      select: { bannerPathname: true },
    });
    if (current?.bannerPathname) {
      await this.blobService.deleteImage(current.bannerPathname, requestId);
    }
    await this.prisma.restaurant.update({
      where: { id: RESTAURANT_ID },
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
