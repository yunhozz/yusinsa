import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/user.entity';

export const ROLES = 'roles';

export const Roles = (...roles: Role[]): MethodDecorator => SetMetadata(ROLES, roles);