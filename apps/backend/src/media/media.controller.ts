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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MAX_FILE_SIZE_BYTES } from '../blob/constants/blob.constants';
import type { Request } from 'express';

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

function requestIdOf(req: Request): string | undefined {
  return (req as Request & { requestId?: string }).requestId;
}

@Controller('/media')
@UseGuards(AuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // ── Menu item image ──────────────────────────────────────────────────────

  @Post('/upload/menu-item/:id')
  @Roles('owner', 'manager', 'chef')
  @UseInterceptors(uploadInterceptor())
  uploadMenuItemImage(
    @Param('id') id: string,
    @UploadedFile(fileValidator) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.mediaService.uploadMenuItemImage(id, file, requestIdOf(req));
  }

  @Delete('/menu-item/:id/image')
  @Roles('owner', 'manager', 'chef')
  deleteMenuItemImage(@Param('id') id: string, @Req() req: Request) {
    return this.mediaService.deleteMenuItemImage(id, requestIdOf(req));
  }

  // ── Category image ───────────────────────────────────────────────────────

  @Post('/upload/category/:id')
  @Roles('owner', 'manager', 'chef')
  @UseInterceptors(uploadInterceptor())
  uploadCategoryImage(
    @Param('id') id: string,
    @UploadedFile(fileValidator) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.mediaService.uploadCategoryImage(id, file, requestIdOf(req));
  }

  @Delete('/category/:id/image')
  @Roles('owner', 'manager', 'chef')
  deleteCategoryImage(@Param('id') id: string, @Req() req: Request) {
    return this.mediaService.deleteCategoryImage(id, requestIdOf(req));
  }

  // ── Logo de l'établissement ──────────────────────────────────────────────

  @Post('/upload/restaurant-logo')
  @Roles('owner')
  @UseInterceptors(uploadInterceptor())
  uploadRestaurantLogo(
    @UploadedFile(fileValidator) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.mediaService.uploadRestaurantLogo(file, requestIdOf(req));
  }

  @Delete('/restaurant-logo')
  @Roles('owner')
  deleteRestaurantLogo(@Req() req: Request) {
    return this.mediaService.deleteRestaurantLogo(requestIdOf(req));
  }

  // ── Bannière de l'établissement ──────────────────────────────────────────

  @Post('/upload/restaurant-banner')
  @Roles('owner')
  @UseInterceptors(uploadInterceptor())
  uploadRestaurantBanner(
    @UploadedFile(fileValidator) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.mediaService.uploadRestaurantBanner(file, requestIdOf(req));
  }

  @Delete('/restaurant-banner')
  @Roles('owner')
  deleteRestaurantBanner(@Req() req: Request) {
    return this.mediaService.deleteRestaurantBanner(requestIdOf(req));
  }
}
