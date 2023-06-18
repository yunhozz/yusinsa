import {Role} from "../user.entity";

export interface TokenPayload {
    sub: bigint,
    username: string;
    roles: Role[];
}