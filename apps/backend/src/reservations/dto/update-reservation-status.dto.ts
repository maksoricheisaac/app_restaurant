import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReservationStatus } from './create-reservation.dto';

export class UpdateReservationStatusDto {
  @IsEnum(ReservationStatus)
  @IsNotEmpty()
  status: ReservationStatus;
}
