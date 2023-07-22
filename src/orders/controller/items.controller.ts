import { ApiResponse } from '../../common/response/api-response';
import { AuthGuard } from '@nestjs/passport';
import { Category } from '../../common/type/category.type';
import { ItemQueryRequestDto, ItemRequestDto, ItemUpdateRequestDto } from '../dto/item-request.dto';
import { ItemsService } from '../service/items.service';
import { Role } from '../../users/user.enum';
import { Roles } from '../../common/decorator/roles.decorator';
import { RolesGuard } from '../../config/guard/roles.guard';
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';

@Controller('/api/items')
export class ItemsController {
    constructor(private readonly itemService: ItemsService) { }

    @Get("/:code")
    @HttpCode(HttpStatus.OK)
    async getItemInfo(@Param('code') itemCode: string): Promise<ApiResponse> {
        const itemInfo = await this.itemService.findItemDetailsByCode(itemCode);
        return ApiResponse.ok(HttpStatus.OK, '해당 상품 조회에 성공했습니다.', itemInfo);
    }

    @Post()
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async createItemByCategory(@Body(ValidationPipe) dto: ItemRequestDto): Promise<ApiResponse> {
        const itemCode = await this.itemService.addItem(dto);
        return ApiResponse.ok(HttpStatus.CREATED, '상품을 성공적으로 추가하였습니다.', itemCode);
    }

    @Post('/q')
    @HttpCode(HttpStatus.CREATED)
    async getItemPageBySearchConditions(
        @Body(ValidationPipe) query: ItemQueryRequestDto,
        @Query('category') category: Category,
    ): Promise<ApiResponse> {
        const itemPage = await this.itemService.findItemsByQuery(query, category);
        return ApiResponse.ok(HttpStatus.OK, '검색 조건에 맞는 상품 리스트를 조회하였습니다.', itemPage);
    }

    @Patch()
    @HttpCode(HttpStatus.CREATED)
    async updateItemDetails(@Body(ValidationPipe) dto: ItemUpdateRequestDto, @Query('code') itemCode: string): Promise<ApiResponse> {
        const itemInfo = await this.itemService.updateItem(itemCode, dto);
        return ApiResponse.ok(HttpStatus.CREATED, '해당 상품을 성공적으로 업데이트 하였습니다.', itemInfo);
    }

    @Patch('/:code')
    @HttpCode(HttpStatus.CREATED)
    async deleteItemByCode(@Param('code') itemCode: string): Promise<ApiResponse> {
        const code = await this.itemService.softDeleteItem(itemCode);
        return ApiResponse.ok(HttpStatus.NO_CONTENT, '해당 상품을 성공적으로 삭제하였습니다.', code);
    }
}