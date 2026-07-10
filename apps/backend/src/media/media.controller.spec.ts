import { MediaController } from './media.controller';

const TENANT = { id: 'tenant-1', logoPathname: 'old-logo.jpg' } as any;
const FILE = { buffer: Buffer.from('x'), mimetype: 'image/jpeg' } as any;
const REQ = { requestId: 'req-1' } as any;

/**
 * MediaController ne fait plus que déléguer à MediaService (la logique
 * elle-même — validation tenant, upload/suppression blob, écriture DB,
 * nettoyage des blobs orphelins — est testée dans media.service.spec.ts).
 * Ces tests vérifient uniquement que chaque route appelle la bonne méthode
 * de service avec les bons arguments.
 */
describe('MediaController — delegation to MediaService', () => {
  function buildController() {
    const mediaService = {
      uploadMenuItemImage: jest
        .fn()
        .mockResolvedValue({ url: 'u', pathname: 'p' }),
      deleteMenuItemImage: jest.fn().mockResolvedValue({ message: 'ok' }),
      uploadCategoryImage: jest
        .fn()
        .mockResolvedValue({ url: 'u', pathname: 'p' }),
      deleteCategoryImage: jest.fn().mockResolvedValue({ message: 'ok' }),
      uploadTenantLogo: jest
        .fn()
        .mockResolvedValue({ url: 'u', pathname: 'p' }),
      deleteTenantLogo: jest.fn().mockResolvedValue({ message: 'ok' }),
      uploadTenantBanner: jest
        .fn()
        .mockResolvedValue({ url: 'u', pathname: 'p' }),
      deleteTenantBanner: jest.fn().mockResolvedValue({ message: 'ok' }),
    };
    return {
      controller: new MediaController(mediaService as any),
      mediaService,
    };
  }

  it('uploadMenuItemImage delegates with tenantId, id, file, requestId', async () => {
    const { controller, mediaService } = buildController();
    await controller.uploadMenuItemImage(TENANT, 'item-1', FILE, REQ);
    expect(mediaService.uploadMenuItemImage).toHaveBeenCalledWith(
      'tenant-1',
      'item-1',
      FILE,
      'req-1',
    );
  });

  it('deleteMenuItemImage delegates with tenantId, id, requestId', async () => {
    const { controller, mediaService } = buildController();
    await controller.deleteMenuItemImage(TENANT, 'item-1', REQ);
    expect(mediaService.deleteMenuItemImage).toHaveBeenCalledWith(
      'tenant-1',
      'item-1',
      'req-1',
    );
  });

  it('uploadCategoryImage delegates with tenantId, id, file, requestId', async () => {
    const { controller, mediaService } = buildController();
    await controller.uploadCategoryImage(TENANT, 'cat-1', FILE, REQ);
    expect(mediaService.uploadCategoryImage).toHaveBeenCalledWith(
      'tenant-1',
      'cat-1',
      FILE,
      'req-1',
    );
  });

  it('deleteCategoryImage delegates with tenantId, id, requestId', async () => {
    const { controller, mediaService } = buildController();
    await controller.deleteCategoryImage(TENANT, 'cat-1', REQ);
    expect(mediaService.deleteCategoryImage).toHaveBeenCalledWith(
      'tenant-1',
      'cat-1',
      'req-1',
    );
  });

  it('uploadTenantLogo delegates with tenantId, current logoPathname, file, requestId', async () => {
    const { controller, mediaService } = buildController();
    await controller.uploadTenantLogo(TENANT, FILE, REQ);
    expect(mediaService.uploadTenantLogo).toHaveBeenCalledWith(
      'tenant-1',
      'old-logo.jpg',
      FILE,
      'req-1',
    );
  });

  it('deleteTenantLogo delegates with tenantId, requestId', async () => {
    const { controller, mediaService } = buildController();
    await controller.deleteTenantLogo(TENANT, REQ);
    expect(mediaService.deleteTenantLogo).toHaveBeenCalledWith(
      'tenant-1',
      'req-1',
    );
  });

  it('uploadTenantBanner delegates with tenantId, file, requestId', async () => {
    const { controller, mediaService } = buildController();
    await controller.uploadTenantBanner(TENANT, FILE, REQ);
    expect(mediaService.uploadTenantBanner).toHaveBeenCalledWith(
      'tenant-1',
      FILE,
      'req-1',
    );
  });

  it('deleteTenantBanner delegates with tenantId, requestId', async () => {
    const { controller, mediaService } = buildController();
    await controller.deleteTenantBanner(TENANT, REQ);
    expect(mediaService.deleteTenantBanner).toHaveBeenCalledWith(
      'tenant-1',
      'req-1',
    );
  });
});
