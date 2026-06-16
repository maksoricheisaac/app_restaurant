import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { BlobModule } from '../blob/blob.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [BlobModule, PrismaModule, AuthModule],
  controllers: [MediaController],
})
export class MediaModule {}
