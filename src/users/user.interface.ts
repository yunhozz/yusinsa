import { Role } from './user.enum';

export interface Address {
    si: string;
    gu: string;
    dong: string;
    etc: string;
}

export interface TokenPayload {
    sub: bigint,
    username: string;
    role: Role;
}

export interface GoogleUser {
    email: string;
    firstName: string;
    lastName: string;
}

export interface MailOptions {
    to: string;
    subject: string;
    html: string;
}