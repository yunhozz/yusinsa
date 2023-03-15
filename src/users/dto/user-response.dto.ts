import {Gender} from "../user.entity";

export class UserProfileResponseDto {
    name: string;
    age: number;
    gender: Gender;
}

export class JwtTokenResponseDto {
    accessToken: string;
    expiredDate: Date;
}