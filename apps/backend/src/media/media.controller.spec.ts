import { MediaController } from './media.controller';

const FILE = { buffer: Buffer.from('x'), mimetype: 'image/jpeg' } as any;
const REQ = { requestId: 'req-1' } as any;

/**
 * MediaController ne fait que déléguer à MediaService — la logique elle-même
 * (upload/suppression blob, écriture en base, nettoyage des blobs orphelins)
 * est couverte par media.service.spec.ts. Ces tests vérifient uniquement que
 * chaque route appelle la bonne méthode avec les bons arguments.
 */
describe('MediaController — délégation à MediaService', () => {
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
      uploadRestaurantLogo: jest
        .fn()
        .mockResolvedValue({ url: 'u', pathname: 'p' }),
      deleteRestaurantLogo: jest.fn().mockResolvedValue({ message: 'ok' }),
      uploadRestaurantBanner: jest
        .fn()
        .mockResolvedValue({ url: 'u', pathname: 'p' }),
      deleteRestaurantBanner: jest.fn().mockResolvedValue({ message: 'ok' }),
    };
    return {
      controller: new MediaController(mediaService as any),
      mediaService,
    };
  }

  it("délègue l'upload d'image de plat", async () => {
    const { controller, mediaService } = buildController();

    await controller.uploadMenuItemImage('item-1', FILE, REQ);

    expect(mediaService.uploadMenuItemImage).toHaveBeenCalledWith(
      'item-1',
      FILE,
      'req-1',
    );
  });

  it("délègue la suppression d'image de plat", async () => {
    const { controller, mediaService } = buildController();

    await controller.deleteMenuItemImage('item-1', REQ);

    expect(mediaService.deleteMenuItemImage).toHaveBeenCalledWith(
      'item-1',
      'req-1',
    );
  });

  it("délègue l'upload d'image de catégorie", async () => {
    const { controller, mediaService } = buildController();

    await controller.uploadCategoryImage('cat-1', FILE, REQ);

    expect(mediaService.uploadCategoryImage).toHaveBeenCalledWith(
      'cat-1',
      FILE,
      'req-1',
    );
  });

  it("délègue la suppression d'image de catégorie", async () => {
    const { controller, mediaService } = buildController();

    await controller.deleteCategoryImage('cat-1', REQ);

    expect(mediaService.deleteCategoryImage).toHaveBeenCalledWith(
      'cat-1',
      'req-1',
    );
  });

  it("délègue l'upload du logo de l'établissement", async () => {
    const { controller, mediaService } = buildController();

    await controller.uploadRestaurantLogo(FILE, REQ);

    expect(mediaService.uploadRestaurantLogo).toHaveBeenCalledWith(
      FILE,
      'req-1',
    );
  });

  it("délègue la suppression du logo de l'établissement", async () => {
    const { controller, mediaService } = buildController();

    await controller.deleteRestaurantLogo(REQ);

    expect(mediaService.deleteRestaurantLogo).toHaveBeenCalledWith('req-1');
  });

  it("délègue l'upload de la bannière", async () => {
    const { controller, mediaService } = buildController();

    await controller.uploadRestaurantBanner(FILE, REQ);

    expect(mediaService.uploadRestaurantBanner).toHaveBeenCalledWith(
      FILE,
      'req-1',
    );
  });

  it('délègue la suppression de la bannière', async () => {
    const { controller, mediaService } = buildController();

    await controller.deleteRestaurantBanner(REQ);

    expect(mediaService.deleteRestaurantBanner).toHaveBeenCalledWith('req-1');
  });
});
