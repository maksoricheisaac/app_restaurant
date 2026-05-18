import { IsIn, IsNotEmpty } from 'class-validator';

export class AccountTypeDto {
  @IsIn(['OWNER', 'MULTI_MANAGER', 'FRANCHISE'], {
    message: 'Type de compte invalide',
  })
  @IsNotEmpty({ message: 'Le type de compte est requis' })
  accountType: string;
}
