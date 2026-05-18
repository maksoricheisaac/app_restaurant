import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @IsOptional()
  @IsEnum(['active', 'inactive'], { message: 'Statut invalide' })
  status?: string;
}
