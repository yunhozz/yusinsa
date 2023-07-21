import { User } from '../user.entity';
import { Gender } from '../user.enum';

export class UserProfileResponseDto {
    name: string;
    age: number;
    gender: Gender;
    address: string;
    phoneNumber: number;

    constructor(user: User) {
        this.name = user.name;
        this.age = user.age;
        this.gender = user.gender;
        this.address = user.getAddress();
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