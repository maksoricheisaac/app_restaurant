import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentProviderFactory } from './payment-provider.factory';

@Module({
  imports: [ConfigModule],
  providers: [PaymentProviderFactory],
  exports: [PaymentProviderFactory],
})
export class PaymentsModule {}
