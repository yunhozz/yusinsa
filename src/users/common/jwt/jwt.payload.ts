import {Role} from "../../domain/role.enum";

export interface JwtPayload {
    email: string;
    role: Role;
}