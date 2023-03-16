import {Gender, User} from "../user.entity";

export class UserProfileResponseDto {
    name: string;
    age: number;
    gender: Gender;

    constructor(user: User) {
        this.name = user.name;
        this.age = user.age;
        this.gender = user.gender;
    }
}

export class JwtTokenResponseDto {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiredDate: Date;

    constructor(accessToken: string, refreshToken: string, accessTokenExpiredDate: Date) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.accessTokenExpiredDate = accessTokenExpiredDate;
    }
}