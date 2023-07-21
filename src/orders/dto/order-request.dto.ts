import { IsArray, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { OmitType } from '@nestjs/mapped-types';

export class OrderItemRequestDto {
    @IsString()
    @IsNotEmpty()
    itemCode: string;

    @IsNumber()
    @Min(1, { message: '최소 수량은 1개입니다.' })
    count: number;
}

export class OrderRequestDto {
    @IsArray()
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

    constructor(cart: CartItemRequestDto[], si: string, gu: string, dong: string, etc: string) {
        this.cart = cart;
        this.si = si;
        this.gu = gu;
        this.dong = dong;
        this.etc = etc;
    }
}

export class AddressRequestDto extends OmitType(OrderRequestDto, ['cart']) { }

export class CartItemRequestDto {
    @IsString()
    @IsNotEmpty()
    orderCode: string;

    @IsString()
    @IsNotEmpty()
    itemCode: string;

    @IsNumber()
    @Min(1, { message: '최소 수량은 1개입니다.' })
    count: number;

    constructor(orderCode: string, itemCode: string, count: number) {
        this.orderCode = orderCode;
        this.itemCode = itemCode;
        this.count = count;
    }
}