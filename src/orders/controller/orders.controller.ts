import {
    Body,
    Controller,
    Get,
    HttpStatus,
    ParseIntPipe,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
    ValidationPipe
} from '@nestjs/common';
import {OrdersService} from "../orders.service";
import {AuthGuard} from "@nestjs/passport";
import {ApiResponse} from "../../common/response/api-response";
import {GetUser} from "../../common/decorator/get-user.decorator";
import {Request, Response} from "express";
import {ItemInventory} from "../../common/element/item-inventory.form";
import {OrderRequestDto} from "../dto/order-request.dto";
import {PageRequest} from "../../common/pagination/page-request";

@Controller('/api/orders')
@UseGuards(AuthGuard())
export class OrdersController {
    constructor(private readonly orderService: OrdersService) {}

    @Get()
    async getOrderList(
        @GetUser() userId: bigint,
        @Query('pageNo', ParseIntPipe) pageNo: number,
        @Query('pageSize', ParseIntPipe) pageSize: number
    ): Promise<ApiResponse> {
        const pageRequest = new PageRequest(pageNo, pageSize);
        const orderPage = await this.orderService.findOrdersByUserId(userId, pageRequest);
        return ApiResponse.ok(HttpStatus.OK, '주문내역 조회에 성공하였습니다.', orderPage);
    }

    @Post()
    async addGoodsIntoBasket(
        @GetUser() userId: bigint,
        @Query('itemId', ParseIntPipe) itemId: bigint,
        @Body(ValidationPipe) dto: OrderRequestDto,
        @Req() req: Request, @Res({ passthrough : true }) res: Response
    ): Promise<ApiResponse> {
        const itemCode = await this.orderService.makeItemCodeFromOrder(userId, itemId, dto);
        const basket = req.cookies['basket'];
        let inventory;

        basket ? inventory = basket.value : inventory = new ItemInventory();
        inventory.codes.push(itemCode);
        res.cookie('basket', inventory, {
            path : '/',
            httpOnly : true
        });

        return ApiResponse.ok(HttpStatus.CREATED, '장바구니에 성공적으로 담았습니다.', { code : itemCode });
    }
}