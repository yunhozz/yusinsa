export class UserProfileResponseDto {
    email: string;
    name: string;
    age: number;
}

export class JwtTokenResponseDto {
    accessToken: string;
    expiredDate: Date;
}