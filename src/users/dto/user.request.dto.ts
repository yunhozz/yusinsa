import {IsEmail, IsInt, IsNotEmpty, IsNumberString, IsString, Length, Matches, MaxLength} from "class-validator";
import {PartialType, PickType} from "@nestjs/mapped-types";
import {Gender} from "../user.entity";

export class CreateUserRequestDto {
    @IsEmail()
    @MaxLength(30, { message: '글자 수 30 이하로 입력해주세요.' })
    email: string;

    @IsString()
    @Length(6, 12, { message: '6 ~ 12글자 사이로 입력해주세요.' })
    @Matches(/^[a-zA-Z0-9]*$/, { message: '패스워드는 영어와 숫자로만 구성할 수 있습니다.' })
    password: string;

    @IsString()
    name: string;

    @IsInt()
    age: number;

    @IsNotEmpty()
    gender: Gender;

    @IsString()
    si: string;

    @IsString()
    gu: string;

    @IsString()
    dong: string;

    @IsString()
    etc: string;

    @IsNumberString()
    phoneNumber: number;
}

export class UpdateProfileRequestDto extends PartialType<CreateUserRequestDto>(CreateUserRequestDto) {}

export class LoginRequestDto extends PickType<CreateUserRequestDto, any>(CreateUserRequestDto, ['email', 'password']) {}