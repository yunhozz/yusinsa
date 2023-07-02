import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    ParseEnumPipe,
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
import {OrderItemRequestDto} from "../dto/order-request.dto";
import {OrderStatus} from "../entity/order.enum";

@Controller('/api/orders')
@UseGuards(AuthGuard())
export class OrdersController {
    constructor(private readonly orderService: OrdersService) {}

    @Get()
    async getOrderList(
        @GetUser() userId: bigint,
        @Query('pageNo', ParseIntPipe) pageNo?: number,
        @Query('pageSize', ParseIntPipe) pageSize?: number,
        @Query('status', new ParseEnumPipe(OrderStatus)) status?: OrderStatus
    ): Promise<ApiResponse> {
        const pageRequest = new PageRequest(pageNo, pageSize);
        const orderPage = await this.orderService.findOrdersByUserId(userId, pageRequest, status);
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
        @GetUser() userId: bigint,
        @Body(ValidationPipe) dto: OrderItemRequestDto,
        @Req() req: Request, @Res({ passthrough : true }) res: Response
    ): Promise<ApiResponse> {
        const orderInfo = await this.orderService.addOrderHistory(userId, dto);
        const cart = req?.cookies['cart'];

        if (cart) {
            cart.value.push(orderInfo);
            res.cookie('cart', cart, {
                path : '/',
                httpOnly : true
            });
        } else {
            res.cookie('cart', [orderInfo], {
                path : '/',
                httpOnly : true
            });
        }

        return ApiResponse.ok(HttpStatus.CREATED, '장바구니에 성공적으로 담았습니다.');
    }
}