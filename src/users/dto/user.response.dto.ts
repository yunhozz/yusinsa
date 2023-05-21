import {Gender, User} from "../user.entity";

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

    accessToken: string;
    refreshToken: string;
    accessTokenExpiredDate: Date;

    constructor(accessToken: string, refreshToken: string, accessTokenExpiredDate: Date) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.accessTokenExpiredDate = accessTokenExpiredDate;
    }
}