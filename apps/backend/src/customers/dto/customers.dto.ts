import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  authProvider?: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
