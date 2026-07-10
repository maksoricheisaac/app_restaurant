import { IsNumber, IsEnum, Min, IsUUID } from 'class-validator';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  ONLINE = 'online',
}

export class ProcessPaymentDto {
  @IsUUID()
  orderId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  // Injected server-side from JWT — never trusted from client
  cashierId?: string;
}
