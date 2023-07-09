import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    ParseEnumPipe,
    ParseIntPipe,
    Patch,
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
import {OrderItemRequestDto} from "../dto/order-request.dto";
import {OrderStatus} from "../entity/order.enum";

@Controller('/api/orders')
@UseGuards(AuthGuard())
export class OrdersController {
    constructor(private readonly orderService: OrdersService) {}

    /**
     * 주문 리스트 조회
     * @param userId: bigint
     * @param status: OrderStatus
     * @param pageNo: number
     * @param pageSize: number
     */
    @Get()
    async getOrderList(
        @GetUser() userId: bigint,
        @Query('status', new ParseEnumPipe(OrderStatus)) status: OrderStatus,
        @Query('page', ParseIntPipe) pageNo?: number,
        @Query('size', ParseIntPipe) pageSize?: number
    ): Promise<ApiResponse> {
        const pageRequest = new PageRequest(pageNo, pageSize);
        const orderPage = await this.orderService.findOrdersByUserId(userId, pageRequest, status);
        return ApiResponse.ok(HttpStatus.OK, '주문 리스트 조회에 성공하였습니다.', orderPage);
    }

    @Get('/cart')
    async getCartItemList(@GetUser() userId: bigint, @Req() req: Request): Promise<ApiResponse> {
        const cart = req?.cookies['cart'];
        return ApiResponse.ok(HttpStatus.OK, '장바구니 상품 목록 조회에 성공하였습니다.', cart);
    }

    /**
     * 주문 상세 내역 조회
     * @param orderCode: string
     */
    @Get('/:code')
    async getOrderDetails(@Param('code') orderCode: string): Promise<ApiResponse> {
        const orderDetails = await this.orderService.findOrderDetails(orderCode);
        return ApiResponse.ok(HttpStatus.OK, '주문 상세 내역 조회에 성공하였습니다.', orderDetails);
    }

    // TODO
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
        @GetUser() userId: bigint,
        @Body(ValidationPipe) dto: OrderItemRequestDto,
        @Req() req: Request, @Res({ passthrough : true }) res: Response
    ): Promise<ApiResponse> {
        const orderInfo = await this.orderService.addOrderHistory(userId, dto);
        const cart = req?.cookies['cart'];
        let value;
        const option = { path : '/', httpOnly : true };

        if (cart) {
            cart.push(orderInfo);
            value = cart;
        } else value = [orderInfo];
        res.cookie('cart', value, option);
        return ApiResponse.ok(HttpStatus.CREATED, '장바구니에 성공적으로 담았습니다.');
    }

    // TODO
    @Patch('/:code')
    async cancelOrder(@Param('code') orderCode: string): Promise<ApiResponse> {
        const code = await this.orderService.changeStatusCancelAndDeleteOrder(orderCode);
        return ApiResponse.ok(HttpStatus.NO_CONTENT, `해당 주문건을 성공적으로 취소하였습니다. order code : ${code}`);
    }

    // TODO
    @Patch('/cart')
    async cancelItemOnCart(@Query('item') itemCode: string): Promise<ApiResponse> {
        return ApiResponse.ok(HttpStatus.NO_CONTENT, '장바구니의 해당 상품을 성공적으로 취소하였습니다.');
    }
}