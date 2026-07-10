import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export enum MessageStatusValue {
  new = 'new',
  read = 'read',
  replied = 'replied',
  closed = 'closed',
  archived = 'archived',
}

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class UpdateMessageDto {
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @IsOptional()
  @IsEnum(MessageStatusValue)
  status?: MessageStatusValue;

  @IsOptional()
  @IsString()
  subject?: string;
}
