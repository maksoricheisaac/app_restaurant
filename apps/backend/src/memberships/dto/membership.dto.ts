import { IsEmail, IsNotEmpty, IsIn, IsUUID } from 'class-validator';
import { ASSIGNABLE_TENANT_ROLES } from '../../common/constants/tenant-roles.constant';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty()
  email: string;

  @IsIn(ASSIGNABLE_TENANT_ROLES, {
    message: `role must be one of: ${ASSIGNABLE_TENANT_ROLES.join(', ')}`,
  })
  role: string;
}

export class UpdateMemberRoleDto {
  @IsIn(ASSIGNABLE_TENANT_ROLES, {
    message: `role must be one of: ${ASSIGNABLE_TENANT_ROLES.join(', ')}`,
  })
  role: string;
}

export class TransferOwnershipDto {
  @IsUUID()
  @IsNotEmpty()
  membershipId: string;
}
