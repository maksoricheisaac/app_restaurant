import { NotFoundException } from '@nestjs/common';
import { MediaController } from './media.controller';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const TENANT = { id: 'tenant-1', logoPathname: null } as any;
const FILE: Express.Multer.File = {
  buffer: Buffer.from('fake-image'),
  mimetype: 'image/jpeg',
  originalname: 'test.jpg',
  size: 10,
} as any;
const REQ = { requestId: 'req-1' } as any;
const BLOB_RESULT = { url: 'https://blob.example.com/img.jpg', pathname: 'img.jpg' };

function buildController(prisma: MockPrisma, blobMocks?: Partial<{ replaceImage: jest.Mock; deleteImage: jest.Mock }>) {
  const blobService = {
    replaceImage: (blobMocks?.replaceImage ?? jest.fn()).mockResolvedValue(BLOB_RESULT),
    deleteImage: (blobMocks?.deleteImage ?? jest.fn()).mockResolvedValue(undefined),
  } as any;
  return new MediaController(blobService, prisma as any);
}

describe('MediaController', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  // ─── uploadMenuItemImage ───────────────────────────────────────────────────

  describe('uploadMenuItemImage', () => {
    it('returns url and pathname on success', async () => {
      prisma.menuItem.findFirst.mockResolvedValue({ id: 'item-1', imagePathname: null });
      prisma.menuItem.update.mockResolvedValue({});
      const ctrl = buildController(prisma);

      const result = await ctrl.uploadMenuItemImage(TENANT, 'item-1', FILE, REQ);

      expect(result).toEqual({ url: BLOB_RESULT.url, pathname: BLOB_RESULT.pathname });
      expect(prisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { image: BLOB_RESULT.url, imagePathname: BLOB_RESULT.pathname },
      });
    });

    it('passes the old imagePathname to replaceImage for cleanup', async () => {
      const replaceImage = jest.fn().mockResolvedValue(BLOB_RESULT);
      prisma.menuItem.findFirst.mockResolvedValue({ id: 'item-1', imagePathname: 'old.jpg' });
      prisma.menuItem.update.mockResolvedValue({});
      const ctrl = buildController(prisma, { replaceImage });

      await ctrl.uploadMenuItemImage(TENANT, 'item-1', FILE, REQ);

      expect(replaceImage).toHaveBeenCalledWith(
        expect.objectContaining({ oldPathname: 'old.jpg', context: 'menu-items' }),
        'req-1',
      );
    });

    it('throws NotFoundException when item not found', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(null);
      const ctrl = buildController(prisma);

      await expect(ctrl.uploadMenuItemImage(TENANT, 'x', FILE, REQ)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.menuItem.update).not.toHaveBeenCalled();
    });
  });

  // ─── deleteMenuItemImage ───────────────────────────────────────────────────

  describe('deleteMenuItemImage', () => {
    it('deletes image and clears DB fields', async () => {
      const deleteImage = jest.fn().mockResolvedValue(undefined);
      prisma.menuItem.findFirst.mockResolvedValue({ id: 'item-1', imagePathname: 'img.jpg' });
      prisma.menuItem.update.mockResolvedValue({});
      const ctrl = buildController(prisma, { deleteImage });

      const result = await ctrl.deleteMenuItemImage(TENANT, 'item-1', REQ);

      expect(result).toEqual({ message: 'Image supprimée' });
      expect(deleteImage).toHaveBeenCalledWith('img.jpg', 'req-1');
      expect(prisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { image: null, imagePathname: null },
      });
    });

    it('returns early when item has no image', async () => {
      const deleteImage = jest.fn();
      prisma.menuItem.findFirst.mockResolvedValue({ id: 'item-1', imagePathname: null });
      const ctrl = buildController(prisma, { deleteImage });

      const result = await ctrl.deleteMenuItemImage(TENANT, 'item-1', REQ);

      expect(result).toEqual({ message: 'Aucune image associée' });
      expect(deleteImage).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when item not found', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(null);
      const ctrl = buildController(prisma);

      await expect(ctrl.deleteMenuItemImage(TENANT, 'x', REQ)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── uploadCategoryImage ───────────────────────────────────────────────────

  describe('uploadCategoryImage', () => {
    it('returns url and pathname on success', async () => {
      prisma.menuCategory.findFirst.mockResolvedValue({ id: 'cat-1', imagePathname: null });
      prisma.menuCategory.update.mockResolvedValue({});
      const ctrl = buildController(prisma);

      const result = await ctrl.uploadCategoryImage(TENANT, 'cat-1', FILE, REQ);

      expect(result).toEqual({ url: BLOB_RESULT.url, pathname: BLOB_RESULT.pathname });
      expect(prisma.menuCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { imageUrl: BLOB_RESULT.url, imagePathname: BLOB_RESULT.pathname },
      });
    });

    it('throws NotFoundException when category not found', async () => {
      prisma.menuCategory.findFirst.mockResolvedValue(null);
      const ctrl = buildController(prisma);

      await expect(ctrl.uploadCategoryImage(TENANT, 'x', FILE, REQ)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── deleteCategoryImage ───────────────────────────────────────────────────

  describe('deleteCategoryImage', () => {
    it('deletes image and clears DB fields', async () => {
      prisma.menuCategory.findFirst.mockResolvedValue({ id: 'cat-1', imagePathname: 'cat.jpg' });
      prisma.menuCategory.update.mockResolvedValue({});
      const ctrl = buildController(prisma);

      const result = await ctrl.deleteCategoryImage(TENANT, 'cat-1', REQ);

      expect(result).toEqual({ message: 'Image supprimée' });
      expect(prisma.menuCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { imageUrl: null, imagePathname: null },
      });
    });

    it('returns early when category has no image', async () => {
      prisma.menuCategory.findFirst.mockResolvedValue({ id: 'cat-1', imagePathname: null });
      const ctrl = buildController(prisma);

      const result = await ctrl.deleteCategoryImage(TENANT, 'cat-1', REQ);
      expect(result).toEqual({ message: 'Aucune image associée' });
    });
  });

  // ─── uploadTenantLogo ─────────────────────────────────────────────────────

  describe('uploadTenantLogo', () => {
    it('replaces logo and updates tenant', async () => {
      prisma.tenant.update.mockResolvedValue({});
      const ctrl = buildController(prisma);

      const result = await ctrl.uploadTenantLogo(TENANT, FILE, REQ);

      expect(result).toEqual({ url: BLOB_RESULT.url, pathname: BLOB_RESULT.pathname });
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { logo: BLOB_RESULT.url, logoPathname: BLOB_RESULT.pathname },
      });
    });
  });

  // ─── deleteTenantLogo ─────────────────────────────────────────────────────

  describe('deleteTenantLogo', () => {
    it('deletes existing logo and clears DB fields', async () => {
      const deleteImage = jest.fn().mockResolvedValue(undefined);
      prisma.tenant.findUnique.mockResolvedValue({ logoPathname: 'logo.jpg' });
      prisma.tenant.update.mockResolvedValue({});
      const ctrl = buildController(prisma, { deleteImage });

      const result = await ctrl.deleteTenantLogo(TENANT, REQ);

      expect(result).toEqual({ message: 'Logo supprimé' });
      expect(deleteImage).toHaveBeenCalledWith('logo.jpg', 'req-1');
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { logo: null, logoPathname: null },
      });
    });

    it('skips blob deletion when no logoPathname', async () => {
      const deleteImage = jest.fn();
      prisma.tenant.findUnique.mockResolvedValue({ logoPathname: null });
      prisma.tenant.update.mockResolvedValue({});
      const ctrl = buildController(prisma, { deleteImage });

      await ctrl.deleteTenantLogo(TENANT, REQ);

      expect(deleteImage).not.toHaveBeenCalled();
    });
  });

  // ─── uploadTenantBanner ───────────────────────────────────────────────────

  describe('uploadTenantBanner', () => {
    it('replaces banner and updates tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ bannerPathname: null });
      prisma.tenant.update.mockResolvedValue({});
      const ctrl = buildController(prisma);

      const result = await ctrl.uploadTenantBanner(TENANT, FILE, REQ);

      expect(result).toEqual({ url: BLOB_RESULT.url, pathname: BLOB_RESULT.pathname });
    });
  });

  // ─── deleteTenantBanner ───────────────────────────────────────────────────

  describe('deleteTenantBanner', () => {
    it('deletes existing banner and clears DB fields', async () => {
      const deleteImage = jest.fn().mockResolvedValue(undefined);
      prisma.tenant.findUnique.mockResolvedValue({ bannerPathname: 'banner.jpg' });
      prisma.tenant.update.mockResolvedValue({});
      const ctrl = buildController(prisma, { deleteImage });

      const result = await ctrl.deleteTenantBanner(TENANT, REQ);

      expect(result).toEqual({ message: 'Bannière supprimée' });
      expect(deleteImage).toHaveBeenCalledWith('banner.jpg', 'req-1');
    });

    it('skips blob deletion when no bannerPathname', async () => {
      const deleteImage = jest.fn();
      prisma.tenant.findUnique.mockResolvedValue({ bannerPathname: null });
      prisma.tenant.update.mockResolvedValue({});
      const ctrl = buildController(prisma, { deleteImage });

      await ctrl.deleteTenantBanner(TENANT, REQ);
      expect(deleteImage).not.toHaveBeenCalled();
    });
  });

  // ─── Multi-tenant isolation ────────────────────────────────────────────────

  describe('multi-tenant isolation', () => {
    it('uploadMenuItemImage: item belonging to another tenant is treated as not found', async () => {
      // Prisma's findFirst includes tenantId in where — mock null means not found
      prisma.menuItem.findFirst.mockResolvedValue(null);
      const ctrl = buildController(prisma);

      await expect(ctrl.uploadMenuItemImage({ id: 'other-tenant' } as any, 'item-1', FILE, REQ))
        .rejects.toThrow(NotFoundException);
    });
  });
});
