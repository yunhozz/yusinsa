import {UserRole} from "../domain/user.role.enum";

export interface JwtPayload {
    email: string;
    role: UserRole;
}