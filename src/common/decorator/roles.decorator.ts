import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/user.enum';

export const ROLES = 'roles';

export const Roles = (...roles: Role[]): MethodDecorator => SetMetadata(ROLES, roles);