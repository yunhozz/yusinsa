import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseEnumPipe,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Res,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { OrdersService } from '../service/orders.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '../../common/response/api-response';
import { GetUser } from '../../common/decorator/get-user.decorator';
import { Response } from 'express';
import { PageRequest } from '../../common/pagination/page-request';
import { AddressRequestDto, CartItemRequestDto, OrderItemRequestDto, OrderRequestDto } from '../dto/order-request.dto';
import { OrderStatus } from '../order.enum';
import { Cookie } from '../../common/decorator/cookie.decorator';
import { CartResponseDto } from '../dto/order-response.dto';

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
    @HttpCode(HttpStatus.OK)
    async getOrderList(
        @GetUser() userId: bigint,
        @Query('status', new ParseEnumPipe(OrderStatus)) status: OrderStatus,
        @Query('page', ParseIntPipe) pageNo?: number,
        @Query('size', ParseIntPipe) pageSize?: number
    ): Promise<ApiResponse> {
        const pageRequest = new PageRequest(pageNo, pageSize);
        const orderPage = await this.orderService.findOrdersByUserId(userId, pageRequest, status);

        if (orderPage.items.length == 0) {
            return ApiResponse.ok(HttpStatus.OK, '주문 내역이 존재하지 않습니다.');
        }
        return ApiResponse.ok(HttpStatus.OK, '주문 리스트 조회에 성공하였습니다.', orderPage);
    }

    /**
     * 장바구니 상품 목록 조회
     * @param cart: CartResponseDto[]
     */
    @Get('/cart')
    @HttpCode(HttpStatus.OK)
    async getCartItemList(@Cookie('cart') cart: CartResponseDto[]): Promise<ApiResponse> {
        if (!cart) {
            return ApiResponse.ok(HttpStatus.OK, '장바구니가 비어있습니다.');
        }
        return ApiResponse.ok(HttpStatus.OK, '장바구니 상품 목록 조회에 성공하였습니다.', cart);
    }

    /**
     * 주문 상세 내역 조회
     * @param orderCode: string
     */
    @Get('/:code')
    @HttpCode(HttpStatus.OK)
    async getOrderDetails(@Param('code') orderCode: string): Promise<ApiResponse> {
        const orderDetails = await this.orderService.findOrderDetails(orderCode);
        return ApiResponse.ok(HttpStatus.OK, '주문 상세 내역 조회에 성공하였습니다.', orderDetails);
    }

    /**
     * 장바구니의 상품 목록 주문
     * @param dto: AddressRequestDto
     * @param cart: CartResponseDto[]
     * @param res: Response
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async makeOrderByCart(
        @Body(ValidationPipe) dto: AddressRequestDto,
        @Cookie('cart') cart: CartResponseDto[],
        @Res({ passthrough : true }) res: Response
    ): Promise<ApiResponse> {
        const cartItems: CartItemRequestDto[] = [];
        const { si, gu, dong, etc } = dto;

        for (const c of cart) {
            const cartItem = new CartItemRequestDto(c.order, c.item, c.count);
            cartItems.push(cartItem);
        }
        const orderRequestDto = new OrderRequestDto(cartItems, si, gu, dong, etc);
        const orderCode = await this.orderService.makeOrderFromCartItems(orderRequestDto);
        res.clearCookie('cart', { path : '/' });
        return ApiResponse.ok(HttpStatus.CREATED, '장바구니의 상품들을 성공적으로 주문하였습니다.', orderCode);
    }

    /**
     * 장바구니에 상품 추가
     * @param userId: bigint
     * @param dto: OrderItemRequestDto
     * @param cart: CartResponseDto[]
     * @param res: Response
     */
    @Post('/cart')
    @HttpCode(HttpStatus.CREATED)
    async addGoodsIntoCart(
        @GetUser() userId: bigint,
        @Body(ValidationPipe) dto: OrderItemRequestDto,
        @Cookie('cart') cart: CartResponseDto[],
        @Res({ passthrough : true }) res: Response
    ): Promise<ApiResponse> {
        const cartItem = await this.orderService.addOrderHistory(userId, dto);
        let value;

        if (cart) {
            cart.push(cartItem);
            value = cart;
        } else {
            value = [cartItem];
        }
        res.cookie('cart', value, { path : '/', httpOnly : true });
        return ApiResponse.ok(HttpStatus.CREATED, '장바구니에 성공적으로 담았습니다.');
    }

    /**
     * 장바구니의 상품 단건 취소
     * @param dto: CartItemRequestDto
     * @param cart: CartResponseDto[]
     * @param res: Response
     */
    @Patch('/cart')
    @HttpCode(HttpStatus.CREATED)
    async cancelItemOnCart(
        @Body(ValidationPipe) dto: CartItemRequestDto,
        @Cookie('cart') cart: CartResponseDto[],
        @Res({ passthrough : true }) res: Response
    ): Promise<ApiResponse> {
        const { orderCode, itemCode, count } = dto;
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].order == orderCode && cart[i].item == itemCode && cart[i].count == count) {
                const code = await this.orderService.deleteOrderItemByCodeAndCount(orderCode, itemCode, count);
                cart.splice(i, 1);
                res.cookie('cart', cart, { path : '/', httpOnly : true });
                return ApiResponse.ok(HttpStatus.NO_CONTENT, `장바구니의 해당 상품을 성공적으로 취소하였습니다. item code : ${code}`);
            }
        }
        return ApiResponse.fail(HttpStatus.BAD_REQUEST, `장바구니에 해당 상품이 존재하지 않습니다. item code : ${itemCode}`);
    }

    /**
     * 주문 취소
     * @param orderCode: string
     */
    @Patch('/:code')
    @HttpCode(HttpStatus.CREATED)
    async cancelOrder(@Param('code') orderCode: string): Promise<ApiResponse> {
        const code = await this.orderService.changeStatusCancelAndDeleteOrder(orderCode);
        return ApiResponse.ok(HttpStatus.NO_CONTENT, `해당 주문건을 성공적으로 취소하였습니다. order code : ${code}`);
    }
}