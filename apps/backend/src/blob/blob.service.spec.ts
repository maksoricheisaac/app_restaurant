import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BlobService } from './blob.service';
import { MonitoringService } from '../common/monitoring/monitoring.service';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  del: jest.fn(),
}));

jest.mock('sharp', () => {
  const mockInstance = {
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-webp-data')),
  };
  const sharpFn = jest.fn(() => mockInstance);
  // esModuleInterop: default export must be the callable function
  return { default: sharpFn, __esModule: true };
});

// Valid JPEG magic bytes header (used across tests)
const JPEG_HEADER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0, 16, 0, 0, 0, 0, 0, 0,
]);

// ── Helpers ────────────────────────────────────────────────────────────────

function makePngBuffer(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
  ]);
}

function makeWebPBuffer(): Buffer {
  const buf = Buffer.alloc(12);
  // RIFF at 0-3
  buf[0] = 0x52;
  buf[1] = 0x49;
  buf[2] = 0x46;
  buf[3] = 0x46;
  // WEBP at 8-11
  buf[8] = 0x57;
  buf[9] = 0x45;
  buf[10] = 0x42;
  buf[11] = 0x50;
  return buf;
}

// ── Test suite ─────────────────────────────────────────────────────────────

describe('BlobService', () => {
  let service: BlobService;
  let configService: jest.Mocked<ConfigService>;
  let monitoringService: jest.Mocked<MonitoringService>;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { put, del } = require('@vercel/blob') as {
    put: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlobService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-token') },
        },
        {
          provide: MonitoringService,
          useValue: {
            captureError: jest.fn(),
            captureWarning: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlobService>(BlobService);
    configService = module.get(ConfigService);
    monitoringService = module.get(MonitoringService);

    put.mockReset();
    del.mockReset();
  });

  // ── uploadImage ──────────────────────────────────────────────────────────

  describe('uploadImage', () => {
    it('uploads a valid JPEG and returns metadata', async () => {
      put.mockResolvedValue({
        url: 'https://blob.vercel.app/tenants/t1/menu-items/abc.webp',
        pathname: 'tenants/t1/menu-items/abc.webp',
      });

      const result = await service.uploadImage({
        buffer: JPEG_HEADER,
        mimeType: 'image/jpeg',
        tenantId: 't1',
        context: 'menu-items',
      });

      expect(result.url).toContain('blob.vercel.app');
      expect(result.pathname).toContain('tenants/t1/menu-items');
      expect(result.contentType).toBe('image/webp');
      expect(put).toHaveBeenCalledWith(
        expect.stringContaining('tenants/t1/menu-items/'),
        expect.any(Buffer),
        expect.objectContaining({
          access: 'public',
          contentType: 'image/webp',
          token: 'test-token',
        }),
      );
    });

    it('accepts PNG files', async () => {
      put.mockResolvedValue({
        url: 'https://blob.vercel.app/x.webp',
        pathname: 'x.webp',
      });

      await expect(
        service.uploadImage({
          buffer: makePngBuffer(),
          mimeType: 'image/png',
          tenantId: 't1',
          context: 'menu-items',
        }),
      ).resolves.toBeDefined();
    });

    it('accepts WebP files', async () => {
      put.mockResolvedValue({
        url: 'https://blob.vercel.app/x.webp',
        pathname: 'x.webp',
      });

      await expect(
        service.uploadImage({
          buffer: makeWebPBuffer(),
          mimeType: 'image/webp',
          tenantId: 't1',
          context: 'categories',
        }),
      ).resolves.toBeDefined();
    });

    it('rejects disallowed MIME types', async () => {
      await expect(
        service.uploadImage({
          buffer: JPEG_HEADER,
          mimeType: 'image/gif',
          tenantId: 't1',
          context: 'menu-items',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects files with mismatched magic bytes (spoofed extension)', async () => {
      const fakeJpeg = Buffer.from('this-is-not-a-real-jpeg-file-0000');
      await expect(
        service.uploadImage({
          buffer: fakeJpeg,
          mimeType: 'image/jpeg',
          tenantId: 't1',
          context: 'menu-items',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects SVG declared as image/jpeg (wrong magic bytes)', async () => {
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
      await expect(
        service.uploadImage({
          buffer: svg,
          mimeType: 'image/jpeg',
          tenantId: 't1',
          context: 'menu-items',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws InternalServerErrorException when BLOB_READ_WRITE_TOKEN is missing', async () => {
      configService.get.mockReturnValue(undefined);

      await expect(
        service.uploadImage({
          buffer: JPEG_HEADER,
          mimeType: 'image/jpeg',
          tenantId: 't1',
          context: 'menu-items',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('throws InternalServerErrorException on Vercel Blob API failure', async () => {
      put.mockRejectedValue(new Error('Network error'));

      await expect(
        service.uploadImage({
          buffer: JPEG_HEADER,
          mimeType: 'image/jpeg',
          tenantId: 't1',
          context: 'menu-items',
        }),
      ).rejects.toThrow(InternalServerErrorException);

      expect(monitoringService.captureError).toHaveBeenCalled();
    });

    it('uses tenant-scoped pathname for isolation', async () => {
      put.mockResolvedValue({
        url: 'https://blob.vercel.app/x.webp',
        pathname: 'tenants/tenant-A/menu-items/x.webp',
      });

      await service.uploadImage({
        buffer: JPEG_HEADER,
        mimeType: 'image/jpeg',
        tenantId: 'tenant-A',
        context: 'menu-items',
      });

      const [calledPathname] = put.mock.calls[0];
      expect(calledPathname).toMatch(
        /^tenants\/tenant-A\/menu-items\/.+\.webp$/,
      );
    });
  });

  // ── deleteImage ──────────────────────────────────────────────────────────

  describe('deleteImage', () => {
    it('calls Vercel del() with correct pathname', async () => {
      del.mockResolvedValue(undefined);
      await service.deleteImage('tenants/t1/menu-items/old.webp');
      expect(del).toHaveBeenCalledWith('tenants/t1/menu-items/old.webp', {
        token: 'test-token',
      });
    });

    it('does not throw on Vercel del() failure (best-effort)', async () => {
      del.mockRejectedValue(new Error('Blob not found'));
      await expect(
        service.deleteImage('bad/path.webp'),
      ).resolves.toBeUndefined();
      expect(monitoringService.captureError).toHaveBeenCalled();
    });

    it('silently skips when BLOB_READ_WRITE_TOKEN is absent', async () => {
      configService.get.mockReturnValue(undefined);
      await expect(
        service.deleteImage('some/path.webp'),
      ).resolves.toBeUndefined();
      expect(del).not.toHaveBeenCalled();
    });
  });

  // ── replaceImage ─────────────────────────────────────────────────────────

  describe('replaceImage', () => {
    it('uploads new image then deletes old pathname', async () => {
      put.mockResolvedValue({
        url: 'https://blob.vercel.app/new.webp',
        pathname: 'new.webp',
      });
      del.mockResolvedValue(undefined);

      const result = await service.replaceImage({
        buffer: JPEG_HEADER,
        mimeType: 'image/jpeg',
        tenantId: 't1',
        context: 'menu-items',
        oldPathname: 'tenants/t1/menu-items/old.webp',
      });

      expect(result.url).toContain('new.webp');
      expect(del).toHaveBeenCalledWith(
        'tenants/t1/menu-items/old.webp',
        expect.anything(),
      );
    });

    it('skips delete when oldPathname is null', async () => {
      put.mockResolvedValue({
        url: 'https://blob.vercel.app/new.webp',
        pathname: 'new.webp',
      });

      await service.replaceImage({
        buffer: JPEG_HEADER,
        mimeType: 'image/jpeg',
        tenantId: 't1',
        context: 'menu-items',
        oldPathname: null,
      });

      expect(del).not.toHaveBeenCalled();
    });

    it('rolls back gracefully — upload failure leaves old blob intact', async () => {
      put.mockRejectedValue(new Error('Upload failed'));

      await expect(
        service.replaceImage({
          buffer: JPEG_HEADER,
          mimeType: 'image/jpeg',
          tenantId: 't1',
          context: 'menu-items',
          oldPathname: 'tenants/t1/menu-items/old.webp',
        }),
      ).rejects.toThrow(InternalServerErrorException);

      // Old blob must NOT be deleted when upload fails
      expect(del).not.toHaveBeenCalled();
    });
  });
});
