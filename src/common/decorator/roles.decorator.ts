import { Role } from '../../users/user.enum';
import { SetMetadata } from '@nestjs/common';

export const ROLES = 'roles';

export const Roles = (...roles: Role[]): MethodDecorator => SetMetadata(ROLES, roles);