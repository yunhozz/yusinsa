import { Gender } from '../order.enum';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

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

    @IsOptional()
    gender?: Gender;

    @IsNumber()
    @IsOptional()
    @Min(0, { message : '최소 금액은 0원입니다.' })
    minPrice?: number;

    @IsNumber({ allowInfinity : false })
    @IsOptional()
    maxPrice?: number;

    @IsString()
    @IsOptional()
    size?: string;
}