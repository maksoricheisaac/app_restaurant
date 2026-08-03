import { NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const FILE = {
  buffer: Buffer.from('fake-image'),
  mimetype: 'image/jpeg',
} as any;
const REQUEST_ID = 'req-1';
const BLOB_RESULT = {
  url: 'https://blob.example.com/img.jpg',
  pathname: 'img.jpg',
};

function buildService(
  prisma: MockPrisma,
  blobMocks?: Partial<{ replaceImage: jest.Mock; deleteImage: jest.Mock }>,
) {
  const blobService = {
    replaceImage: (blobMocks?.replaceImage ?? jest.fn()).mockResolvedValue(
      BLOB_RESULT,
    ),
    deleteImage: (blobMocks?.deleteImage ?? jest.fn()).mockResolvedValue(
      undefined,
    ),
  } as any;
  return { service: new MediaService(blobService, prisma as any), blobService };
}

describe('MediaService', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  // ─── uploadMenuItemImage ───────────────────────────────────────────────────

  describe('uploadMenuItemImage', () => {
    it('returns url and pathname on success', async () => {
      prisma.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        imagePathname: null,
      });
      prisma.menuItem.update.mockResolvedValue({});
      const { service } = buildService(prisma);

      const result = await service.uploadMenuItemImage(
        'item-1',
        FILE,
        REQUEST_ID,
      );

      expect(result).toEqual({
        url: BLOB_RESULT.url,
        pathname: BLOB_RESULT.pathname,
      });
      expect(prisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { image: BLOB_RESULT.url, imagePathname: BLOB_RESULT.pathname },
      });
    });

    it('passes the old imagePathname to replaceImage for cleanup', async () => {
      const replaceImage = jest.fn().mockResolvedValue(BLOB_RESULT);
      prisma.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        imagePathname: 'old.jpg',
      });
      prisma.menuItem.update.mockResolvedValue({});
      const { service } = buildService(prisma, { replaceImage });

      await service.uploadMenuItemImage('item-1', FILE, REQUEST_ID);

      expect(replaceImage).toHaveBeenCalledWith(
        expect.objectContaining({
          oldPathname: 'old.jpg',
          context: 'menu-items',
        }),
        REQUEST_ID,
      );
    });

    it('throws NotFoundException when item not found', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(null);
      const { service } = buildService(prisma);

      await expect(
        service.uploadMenuItemImage('x', FILE, REQUEST_ID),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.menuItem.update).not.toHaveBeenCalled();
    });

    it('cleans up the orphaned blob if the DB update fails after a successful upload', async () => {
      const deleteImage = jest.fn().mockResolvedValue(undefined);
      prisma.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        imagePathname: null,
      });
      prisma.menuItem.update.mockRejectedValue(new Error('DB write failed'));
      const { service } = buildService(prisma, { deleteImage });

      await expect(
        service.uploadMenuItemImage('item-1', FILE, REQUEST_ID),
      ).rejects.toThrow('DB write failed');

      expect(deleteImage).toHaveBeenCalledWith(
        BLOB_RESULT.pathname,
        REQUEST_ID,
      );
    });
  });

  // ─── deleteMenuItemImage ───────────────────────────────────────────────────

  describe('deleteMenuItemImage', () => {
    it('deletes image and clears DB fields', async () => {
      const deleteImage = jest.fn().mockResolvedValue(undefined);
      prisma.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        imagePathname: 'img.jpg',
      });
      prisma.menuItem.update.mockResolvedValue({});
      const { service } = buildService(prisma, { deleteImage });

      const result = await service.deleteMenuItemImage('item-1', REQUEST_ID);

      expect(result).toEqual({ message: 'Image supprimée' });
      expect(deleteImage).toHaveBeenCalledWith('img.jpg', REQUEST_ID);
      expect(prisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { image: null, imagePathname: null },
      });
    });

    it('returns early when item has no image', async () => {
      const deleteImage = jest.fn();
      prisma.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        imagePathname: null,
      });
      const { service } = buildService(prisma, { deleteImage });

      const result = await service.deleteMenuItemImage('item-1', REQUEST_ID);

      expect(result).toEqual({ message: 'Aucune image associée' });
      expect(deleteImage).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when item not found', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(null);
      const { service } = buildService(prisma);

      await expect(
        service.deleteMenuItemImage('x', REQUEST_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── uploadCategoryImage ───────────────────────────────────────────────────

  describe('uploadCategoryImage', () => {
    it('returns url and pathname on success', async () => {
      prisma.menuCategory.findFirst.mockResolvedValue({
        id: 'cat-1',
        imagePathname: null,
      });
      prisma.menuCategory.update.mockResolvedValue({});
      const { service } = buildService(prisma);

      const result = await service.uploadCategoryImage(
        'cat-1',
        FILE,
        REQUEST_ID,
      );

      expect(result).toEqual({
        url: BLOB_RESULT.url,
        pathname: BLOB_RESULT.pathname,
      });
      expect(prisma.menuCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: {
          imageUrl: BLOB_RESULT.url,
          imagePathname: BLOB_RESULT.pathname,
        },
      });
    });

    it('throws NotFoundException when category not found', async () => {
      prisma.menuCategory.findFirst.mockResolvedValue(null);
      const { service } = buildService(prisma);

      await expect(
        service.uploadCategoryImage('x', FILE, REQUEST_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── deleteCategoryImage ───────────────────────────────────────────────────

  describe('deleteCategoryImage', () => {
    it('deletes image and clears DB fields', async () => {
      prisma.menuCategory.findFirst.mockResolvedValue({
        id: 'cat-1',
        imagePathname: 'cat.jpg',
      });
      prisma.menuCategory.update.mockResolvedValue({});
      const { service } = buildService(prisma);

      const result = await service.deleteCategoryImage('cat-1', REQUEST_ID);

      expect(result).toEqual({ message: 'Image supprimée' });
      expect(prisma.menuCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { imageUrl: null, imagePathname: null },
      });
    });

    it('returns early when category has no image', async () => {
      prisma.menuCategory.findFirst.mockResolvedValue({
        id: 'cat-1',
        imagePathname: null,
      });
      const { service } = buildService(prisma);

      const result = await service.deleteCategoryImage('cat-1', REQUEST_ID);
      expect(result).toEqual({ message: 'Aucune image associée' });
    });
  });

  // ─── Logo & bannière de l'établissement ───────────────────────────────────

  describe('uploadRestaurantLogo', () => {
    it('remplace le logo et enregistre url + pathname', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        logoPathname: 'old.jpg',
      });
      prisma.restaurant.update.mockResolvedValue({});
      const { service, blobService } = buildService(prisma);

      const result = await service.uploadRestaurantLogo(FILE, REQUEST_ID);

      expect(result).toEqual({
        url: BLOB_RESULT.url,
        pathname: BLOB_RESULT.pathname,
      });
      expect(blobService.replaceImage).toHaveBeenCalledWith(
        expect.objectContaining({
          context: 'restaurant-logo',
          oldPathname: 'old.jpg',
        }),
        REQUEST_ID,
      );
      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'restaurant' },
        data: { logo: BLOB_RESULT.url, logoPathname: BLOB_RESULT.pathname },
      });
    });
  });

  describe('deleteRestaurantLogo', () => {
    it('supprime le blob puis vide les champs en base', async () => {
      const deleteImage = jest.fn().mockResolvedValue(undefined);
      prisma.restaurant.findUnique.mockResolvedValue({
        logoPathname: 'logo.jpg',
      });
      prisma.restaurant.update.mockResolvedValue({});
      const { service } = buildService(prisma, { deleteImage });

      const result = await service.deleteRestaurantLogo(REQUEST_ID);

      expect(result).toEqual({ message: 'Logo supprimé' });
      expect(deleteImage).toHaveBeenCalledWith('logo.jpg', REQUEST_ID);
      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'restaurant' },
        data: { logo: null, logoPathname: null },
      });
    });

    it('ne touche pas au blob storage sans logo enregistré', async () => {
      const deleteImage = jest.fn();
      prisma.restaurant.findUnique.mockResolvedValue({ logoPathname: null });
      prisma.restaurant.update.mockResolvedValue({});
      const { service } = buildService(prisma, { deleteImage });

      await service.deleteRestaurantLogo(REQUEST_ID);

      expect(deleteImage).not.toHaveBeenCalled();
    });
  });

  describe('deleteRestaurantBanner', () => {
    it('supprime le blob puis vide les champs en base', async () => {
      const deleteImage = jest.fn().mockResolvedValue(undefined);
      prisma.restaurant.findUnique.mockResolvedValue({
        bannerPathname: 'banner.jpg',
      });
      prisma.restaurant.update.mockResolvedValue({});
      const { service } = buildService(prisma, { deleteImage });

      const result = await service.deleteRestaurantBanner(REQUEST_ID);

      expect(result).toEqual({ message: 'Bannière supprimée' });
      expect(deleteImage).toHaveBeenCalledWith('banner.jpg', REQUEST_ID);
    });
  });
});
