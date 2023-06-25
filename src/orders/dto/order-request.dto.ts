import {IsNotEmpty, IsNumber, IsString, Min} from "class-validator";
import {OmitType, PickType} from "@nestjs/mapped-types";

export class OrderRequestDto {
    @IsNotEmpty()
    cartItems: CartItemRequestDto[];

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

export class OrderInfoRequestDto extends OmitType(OrderRequestDto, ['cartItems']) {}

export class CartItemRequestDto {
    @IsString()
    @IsNotEmpty()
    itemCode: string;

    @IsNotEmpty()
    size: string | number;

    @IsNumber()
    @Min(1, { message : '최소 수량은 1개입니다.' })
    count: number;
}

export class CartRequestDto extends PickType(CartItemRequestDto, ['size', 'count']) {}

export interface Cart {
    items: CartItemRequestDto[];
}

export const Cart: Cart = {
    items : []
}