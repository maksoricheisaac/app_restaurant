import { Module } from '@nestjs/common';
import { BlobService } from './blob.service';
import { MonitoringModule } from '../common/monitoring/monitoring.module';

@Module({
  imports: [MonitoringModule],
  providers: [BlobService],
  exports: [BlobService],
})
export class BlobModule {}
