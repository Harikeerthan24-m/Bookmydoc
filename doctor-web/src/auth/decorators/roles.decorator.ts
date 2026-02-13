import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../guard/roles.guard';
import { IRole } from '@app/common/types/type';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: IRole[]) => SetMetadata(ROLES_KEY, roles);

export const RoleGuard = (...roles: IRole[]) => {
  return applyDecorators(Roles(...roles), UseGuards(RolesGuard));
};
