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
import {PageRequest} from "../../common/pagination/page-request";
import {Cart, CartItemRequestDto, CartRequestDto, OrderInfoRequestDto} from "../dto/order-request.dto";

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

    // TODO
    @Get('/cart')
    async getCartItemList(@GetUser() userId: bigint, @Req() req: Request): Promise<ApiResponse> {
        return ApiResponse.ok(HttpStatus.OK, '장바구니 상품 목록 조회에 성공하였습니다.', null);
    }

    @Post()
    async makeOrderByCart(
        @GetUser() userId: bigint,
        @Body(ValidationPipe) dto: OrderInfoRequestDto,
        @Req() req: Request, @Res({ passthrough : true }) res: Response
    ): Promise<ApiResponse> {
        const cart = req.cookies['cart'];
        const orderCode = await this.orderService.makeOrderFromCartItems(userId, {
            cartItems : cart.items,
            si : dto.si,
            gu : dto.gu,
            dong : dto.dong,
            etc : dto.etc
        });
        res.clearCookie('cart', { path : '/' });
        return ApiResponse.ok(HttpStatus.CREATED, '장바구니의 상품들을 성공적으로 주문하였습니다.', { order : orderCode });
    }

    @Post('/cart')
    async addGoodsIntoCart(
        @Query('itemCode') itemCode: string,
        @Body(ValidationPipe) dto: CartRequestDto,
        @Req() req: Request, @Res({ passthrough : true }) res: Response
    ): Promise<ApiResponse> {
        const cart = req?.cookies['cart'];
        const { size, count } = dto;
        const item: CartItemRequestDto = { itemCode, size, count };

        cart.isEmpty() ? Cart.items.push(item) : cart.items.push(item);
        res.cookie('cart', Cart, {
            path : '/',
            httpOnly : true
        });

        return ApiResponse.ok(HttpStatus.CREATED, '장바구니에 성공적으로 담았습니다.');
    }
}