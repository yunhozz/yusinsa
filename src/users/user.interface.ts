import { Gender, Role } from './user.enum';

export interface LocalUserInfo {
    password: string;
    age: number;
    gender: Gender;
    address: Address;
    phoneNumber: number;
    getAddress(): string;
}

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

export interface KakaoUser {
    email: string;
    nickname: string;
    photo?: string;
}

export interface MailOptions {
    to: string;
    subject: string;
    html: string;
}