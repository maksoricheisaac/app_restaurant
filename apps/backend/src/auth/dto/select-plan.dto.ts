import { IsIn, IsNotEmpty } from 'class-validator';

export class SelectPlanDto {
  @IsIn(['free', 'pro', 'enterprise'], { message: 'Plan invalide' })
  @IsNotEmpty({ message: 'Le plan est requis' })
  plan: string;
}
