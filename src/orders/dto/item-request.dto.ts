import { Gender } from '../order.enum';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PageRequest } from '../../common/pagination/page-request';

export class ItemQueryRequestDto {
    page: PageRequest;

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