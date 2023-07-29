import { LocalUser } from '../user.entity';
import { Gender } from '../user.enum';

export class UserProfileResponseDto {
    email: string;
    name: string;
    age: number;
    gender: Gender;
    phoneNumber: number;

    constructor(user: LocalUser) {
        this.email = user.email;
        this.name = user.name;
        this.age = user.age;
        this.gender = user.gender;
        this.phoneNumber = user.phoneNumber;
    }
}

export class JwtTokenResponseDto {
    sub: bigint;
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiry: number;

    constructor(sub: bigint, accessToken: string, refreshToken: string, refreshTokenExpiry: number) {
        this.sub = sub;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.refreshTokenExpiry = refreshTokenExpiry;
    }
}