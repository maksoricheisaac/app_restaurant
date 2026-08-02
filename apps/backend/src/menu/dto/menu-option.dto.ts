import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOptionGroupDto {
  @IsUUID() menuItemId: string;
  @IsString() @IsNotEmpty() @MaxLength(80) name: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(50) minSelect?: number;
  @IsOptional() @IsInt() @Min(0) @Max(50) maxSelect?: number; // 0 = illimité
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateOptionGroupDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80) name?: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(50) minSelect?: number;
  @IsOptional() @IsInt() @Min(0) @Max(50) maxSelect?: number;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class CreateOptionDto {
  @IsUUID() groupId: string;
  @IsString() @IsNotEmpty() @MaxLength(80) name: string;
  @IsOptional() @IsNumber() @Min(-100000) @Max(100000) priceDelta?: number;
  @IsOptional() @IsBoolean() available?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateOptionDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80) name?: string;
  @IsOptional() @IsNumber() @Min(-100000) @Max(100000) priceDelta?: number;
  @IsOptional() @IsBoolean() available?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}
