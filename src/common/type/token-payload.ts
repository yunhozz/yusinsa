import { Role } from '../../users/user.enum';

export interface TokenPayload {
    sub: bigint,
    username: string;
    roles: Role[];
}