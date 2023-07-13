import { Role } from '../../users/user.entity';

export interface TokenPayload {
    sub: bigint,
    username: string;
    roles: Role[];
}