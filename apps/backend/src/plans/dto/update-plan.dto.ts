import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanDto } from './create-plan.dto';

/** Tous les champs de création deviennent optionnels (mise à jour partielle). */
export class UpdatePlanDto extends PartialType(CreatePlanDto) {}
