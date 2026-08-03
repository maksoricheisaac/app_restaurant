export type BlobUploadContext =
  | 'menu-items'
  | 'categories'
  | 'avatars'
  | 'restaurant-logo'
  | 'restaurant-banner';

export interface UploadedBlob {
  url: string;
  pathname: string;
  contentType: string;
  sizeBytes: number;
}

export interface UploadImageParams {
  buffer: Buffer;
  mimeType: string;
  context: BlobUploadContext;
}

export interface ReplaceImageParams extends UploadImageParams {
  oldPathname: string | null | undefined;
}
