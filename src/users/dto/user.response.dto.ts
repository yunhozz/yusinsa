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
    expiredDate: Date;

    constructor(accessToken: string, expiredDate: Date) {
        this.accessToken = accessToken;
        this.expiredDate = expiredDate;
    }
}