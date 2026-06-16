export type BlobUploadContext =
  | 'menu-items'
  | 'categories'
  | 'avatars'
  | 'tenant-logo'
  | 'tenant-banner';

export interface UploadedBlob {
  url: string;
  pathname: string;
  contentType: string;
  sizeBytes: number;
}

export interface UploadImageParams {
  buffer: Buffer;
  mimeType: string;
  tenantId: string;
  context: BlobUploadContext;
}

export interface ReplaceImageParams extends UploadImageParams {
  oldPathname: string | null | undefined;
}
