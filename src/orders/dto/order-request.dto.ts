import {IsNotEmpty, IsNumber, IsString, Min} from "class-validator";

export class OrderRequestDto {
    @IsNumber()
    @Min(1, { message : '최소 수량은 1개입니다.' })
    count: number;

    @IsString()
    @IsNotEmpty()
    si: string;

    @IsString()
    @IsNotEmpty()
    gu: string;

    @IsString()
    @IsNotEmpty()
    dong: string;

    @IsString()
    @IsNotEmpty()
    etc: string;
}