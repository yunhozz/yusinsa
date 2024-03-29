import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Gender } from '../order.enum';
import { Category } from '../order.interface';

export class ItemRequestDto {
    @IsEnum(Gender, { message: 'man, woman, unisex 중 하나여야 합니다.' })
    @IsNotEmpty()
    gender: Gender;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0, { message: '가격은 0원 이상이어야 합니다.' })
    price: number;

    @IsString()
    @IsNotEmpty()
    size: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    image?: Buffer;

    @IsNumber()
    @Min(1, { message: '최소 수량은 1개입니다.' })
    stockQuantity: number;

    @IsString()
    @IsNotEmpty()
    categoryParent: Category;

    @IsString()
    @IsNotEmpty()
    categoryChild: string;
}

export class ItemUpdateRequestDto extends PartialType(ItemRequestDto) { }

export class ItemQueryRequestDto {
    @IsNumber()
    @IsOptional()
    pageNo?: number | 1;

    @IsNumber()
    @IsOptional()
    pageSize?: number | 10;

    @IsString()
    @IsOptional()
    keyword?: string;

    @IsEnum(Gender, { message: 'man, woman, unisex 중 하나여야 합니다.' })
    @IsOptional()
    gender?: Gender;

    @IsNumber()
    @IsOptional()
    @Min(0, { message: '최소 금액은 0원입니다.' })
    minPrice?: number;

    @IsNumber({ allowInfinity: false })
    @IsOptional()
    @Min(0, { message: '최소 금액은 0원입니다.' })
    maxPrice?: number;

    @IsString()
    @IsOptional()
    size?: string;
}