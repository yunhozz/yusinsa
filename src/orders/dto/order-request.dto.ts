import {IsNotEmpty, IsNumber, IsString, Min} from "class-validator";

export class OrderItemRequestDto {
    @IsString()
    @IsNotEmpty()
    itemCode: string;

    @IsNotEmpty()
    size: string;

    @IsNumber()
    @Min(1, { message : '최소 수량은 1개입니다.' })
    count: number;
}

export class OrderRequestDto {
    @IsNotEmpty()
    cart: CartItemRequestDto[];

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

export class CartItemRequestDto {
    @IsString()
    @IsNotEmpty()
    orderCode: string;

    @IsString()
    @IsNotEmpty()
    itemCode: string;

    @IsNumber()
    @IsNotEmpty()
    count: number;
}